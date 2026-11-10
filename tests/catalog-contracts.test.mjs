import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const p=rel=>path.join(root,rel);
const read=rel=>fs.readFileSync(p(rel),'utf8').replace(/\r\n/g,'\n');
const info=JSON.parse(read('BUILD-INFO.json'));
const refs='skills/observability/references/workflows';
const names=dir=>fs.readdirSync(p(dir)).filter(n=>n.endsWith('.md')).sort();
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);

test('catálogo contém somente a entrada observability, sem skills dentro das referências',()=>{
 const files=walk(p('skills')).filter(f=>path.basename(f)==='SKILL.md');
 assert.deepEqual(files,[p('skills/observability/SKILL.md')]);
 assert.equal(fs.existsSync(p('codex-skills')),false);
 for(const dir of ['.codex-plugin/migrated-command-skills','.claude-plugin/migrated-command-skills'])assert.equal(fs.existsSync(p(dir)),false,dir);
});

test('19 workflows preservados integralmente entre fonte, comandos e referências',()=>{
 const operations=names(refs);
 assert.equal(operations.length,19);
 for(const dir of ['commands','workflows']){
  if(!fs.existsSync(p(dir)))continue;
  assert.deepEqual(names(dir),operations,dir);
  for(const n of operations)assert.equal(read(dir+'/'+n),read(refs+'/'+n),n);
 }
 if(info.platform==='claude-codex')assert.equal(names('commands').length,19);
});

test('Codex e Antigravity isolam comandos Claude para impedir Source Command',()=>{
 if(info.platform==='claude-codex')return;
 for(const rel of ['commands','.claude-plugin','codex-skills'])assert.equal(fs.existsSync(p(rel)),false,rel);
});

test('manifesto Codex descobre somente o diretório único de skills',()=>{
 if(info.platform==='antigravity')return;
 const cx=JSON.parse(read('.codex-plugin/plugin.json'));
 assert.equal(cx.name,'observability');
 assert.equal(cx.version,info.version);
 assert.equal(cx.skills,'./skills/');
 if(info.platform==='claude-codex'){
  const claude=JSON.parse(read('.claude-plugin/plugin.json'));
  assert.equal(claude.name,cx.name);
  assert.equal(claude.version,cx.version);
 }
});

test('validador rejeita skill extra e workflow adulterado',()=>{
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'observability-contract-'));
 try {
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
   if(['.git','dist','packages','node_modules'].includes(entry.name))continue;
   fs.cpSync(p(entry.name),path.join(fixture,entry.name),{recursive:true});
  }
  const validate=()=>spawnSync(process.execPath,[p('scripts/validate-package.mjs'),'--path',fixture],{encoding:'utf8'});
  let result=validate();
  assert.equal(result.status,0,result.stdout+result.stderr);
  fs.mkdirSync(path.join(fixture,'skills/duplicate'),{recursive:true});
  fs.writeFileSync(path.join(fixture,'skills/duplicate/SKILL.md'),'---\nname: duplicate\ndescription: Duplicate\n---\n');
  result=validate();
  assert.equal(result.status,1,result.stdout);
  assert.match(result.stdout,/skill model-invoked única/);
  if(info.platform==='claude-codex'){
   fs.appendFileSync(path.join(fixture,refs,names(refs)[0]),'\nchanged\n');
   result=validate();
   assert.equal(result.status,1);
   assert.match(result.stdout,/Workflow divergente/);
  }
 } finally {
  fs.rmSync(fixture,{recursive:true,force:true});
 }
});
