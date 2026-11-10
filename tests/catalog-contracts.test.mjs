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
const catalog=JSON.parse(read('config/workflow-catalog.json')).workflows;
const refs='skills/observability/references/workflows';
const names=dir=>fs.readdirSync(p(dir)).filter(n=>n.endsWith('.md')).sort();
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);

test('roteador alcança todo o catálogo, incluindo as duas importações',()=>{
 const router=read('skills/observability/SKILL.md');
 for(const slug of catalog)assert.ok(router.includes('references/workflows/'+slug+'.md'),slug);
 assert.ok(fs.existsSync(p('references/import-workflow.md')));
 for(const slug of ['importar-template','importar-dashboard']){
  const workflow=read(refs+'/'+slug+'.md');
  assert.ok(workflow.includes('references/import-workflow.md'),slug);
 }
});

test('catálogo contém somente roteador e operações nativas esperadas, sem skills internas',()=>{
 const files=walk(p('skills')).filter(f=>path.basename(f)==='SKILL.md');
 const expected=['observability',...(info.platform==='codex'?names(refs).map(n=>n.slice(0,-3)):[])];
 assert.deepEqual(files.sort(),expected.map(n=>p('skills/'+n+'/SKILL.md')).sort());
 assert.equal(fs.existsSync(p('codex-skills')),false);
 for(const dir of ['.codex-plugin/migrated-command-skills','.claude-plugin/migrated-command-skills'])assert.equal(fs.existsSync(p(dir)),false,dir);
});

test('Workflows preservados integralmente entre fonte, comandos e referências',()=>{
 const operations=names(refs);
 assert.deepEqual(operations,catalog.map(n=>n+'.md').sort());
 assert.ok(catalog.includes('importar-template')&&catalog.includes('importar-dashboard'));
 for(const dir of ['commands','workflows']){
  if(!fs.existsSync(p(dir)))continue;
  assert.deepEqual(names(dir),operations,dir);
  for(const n of operations)assert.equal(read(dir+'/'+n),read(refs+'/'+n),n);
 }
 if(info.platform==='claude-codex')assert.equal(names('commands').length,catalog.length);
 if(info.platform==='codex')for(const file of operations){
  const slug=file.slice(0,-3);
  const raw=read(refs+'/'+file);
  const body=raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)?.[1];
  const native=read('skills/'+slug+'/SKILL.md');
  assert.ok(body&&native.includes(body),'Workflow body lost: '+slug);
  assert.match(native,new RegExp('^name: '+slug+'$','m'));
  assert.doesNotMatch(native,/^user-invocable:\s*false$/m);
 }

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
  assert.match(result.stdout,/quantidade de skills esperada/);
  fs.rmSync(path.join(fixture,'skills/duplicate'),{recursive:true});
  if(info.platform==='codex'){
   const slug=names(refs)[0].slice(0,-3);
   const native=path.join(fixture,'skills',slug,'SKILL.md');
   fs.writeFileSync(native,fs.readFileSync(native,'utf8').replace('## Passos operacionais','## Alterado'));
   result=validate();
   assert.equal(result.status,1);
   assert.match(result.stdout,/Workflow divergente/);
  }
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
