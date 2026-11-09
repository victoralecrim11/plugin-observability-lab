#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const source=argv.includes('--source');
const at=argv.indexOf('--path');
const base=source?root:(at<0?root:path.resolve(argv[at+1]));
const problems=[];
const exists=rel=>fs.existsSync(path.join(base,rel));
function list(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function read(rel){return fs.readFileSync(path.join(base,rel),'utf8');}
function json(rel){try{return JSON.parse(read(rel));}catch(e){problems.push(`JSON inválido/ausente ${rel}: ${e.message}`);return null;}}
function fm(file){const t=fs.readFileSync(file,'utf8');const m=t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);if(!m)throw Error(`Frontmatter inexistente: ${file}`);return Object.fromEntries(m[1].split('\n').filter(x=>/^[\w-]+:/.test(x)).map(x=>{const i=x.indexOf(':');return[x.slice(0,i),x.slice(i+1).trim()] }));}
function eq(received,expected,what){if(received!==expected)problems.push(`${what}: esperado ${expected}; observado ${received}`);}
function check(){
 const domain=list(path.join(base,'skills')).filter(x=>x.endsWith('SKILL.md'));
 const codex=list(path.join(base,'codex-skills')).filter(x=>x.endsWith('SKILL.md'));
 const commands=list(path.join(base,'commands')).filter(x=>x.endsWith('.md'));
 const workflows=list(path.join(base,'workflows')).filter(x=>x.endsWith('.md'));
 const info=source?null:json('BUILD-INFO.json');
 const combined=info?.platform==='claude-codex';const anti=info?.platform==='antigravity';
 eq(domain.length,anti?23:4,'skills de domínio (incluindo operações Antigravity)');
 eq(codex.length,combined?19:0,'skills operacionais Codex');
 eq(commands.length,combined?19:0,'comandos Claude');
 eq(workflows.length,source || (combined && exists('workflows')) ? 19 : 0,'workflows fonte');
 for(const file of [...domain,...codex]){
  try{const v=fm(file),slug=path.basename(path.dirname(file));
   if(v.name!==slug)problems.push(`Nome SKILL.md incompatível com pasta: ${file}`);
   if(!v.description||v.description.length>1024)problems.push(`Descrição ausente/longa: ${file}`);
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.name||''))problems.push(`Slug inválido: ${file}`);
  }catch(e){problems.push(e.message)}
 }
 for(const file of [...commands,...workflows])try{if(!fm(file).description)problems.push(`description ausente ${file}`)}catch(e){problems.push(e.message)};
 if(!exists('references/security-policy.md'))problems.push('Política de segurança ausente');
 for(const file of list(base).filter(x=>x.endsWith('.json')&&!x.includes('node_modules')))try{JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){problems.push(`JSON inválido: ${file}`)}
 for(const file of list(base).filter(x=>/\.(md|json|mjs|yaml|yml|txt)$/.test(x)&&!x.includes('node_modules'))){
  const t=fs.readFileSync(file,'utf8');
  if(/Bearer\s+[a-z0-9_-]{25,}/i.test(t)||/\bsk-proj-[a-z0-9_-]{20,}/i.test(t))problems.push(`Possível credencial literal: ${file}`);
 }
 if(combined){
  const claude=json('.claude-plugin/plugin.json');const market=json('.claude-plugin/marketplace.json');const cx=json('.codex-plugin/plugin.json');const mcp=json('.mcp.json');
  if(claude?.name!==cx?.name||claude?.name!=='observability')problems.push('Identidade divergente Claude/Codex');
  if(claude?.version!==cx?.version||claude?.version!==info?.version)problems.push('Versões divergentes Claude/Codex/BUILD');
  if(market?.plugins?.[0]?.name!==claude?.name)problems.push('Marketplace Claude com nome incompatível');
  if(mcp?.mcpServers&&Object.keys(mcp.mcpServers).length!==0)problems.push('A distribuição não pode vir com MCP corporativo pré-configurado');
  const skillPaths=Array.isArray(cx?.skills)?cx.skills:[cx?.skills];
  if(!skillPaths.includes('./skills/')||!skillPaths.includes('./codex-skills/'))problems.push('Codex não declarou os dois diretórios de skills');
  for(const value of skillPaths){if(typeof value!=='string'||!value.startsWith('./')||value.includes('..')||!exists(value))problems.push(`Caminho de skills inválido: ${value}`)}
  for(const f of commands){const slug=path.basename(f,'.md');if(!exists(`codex-skills/${slug}/SKILL.md`))problems.push(`Sem operação Codex correspondente a ${slug}`)}
  if(!exists('AGENTS.md'))problems.push('AGENTS.md compartilhado ausente');
 }
 if(anti){if(!exists('plugin.json')||!exists('mcp_config.json')||!exists('rules/AGENTS.md'))problems.push('Manifesto/regras Antigravity incompletos');}
 if(!source&&!exists('scripts/audit-dashboard.mjs'))problems.push('Scripts offline incompletos');
 if(source&&!exists('scripts/build.mjs'))problems.push('Builder não localizado');
 const result={status:problems.length?'FAIL':'PASS',mode:source?'source':info?.platform||'unrecognized',base,skills:domain.length,operationalSkills:codex.length,commands:commands.length,workflows:workflows.length,problems};
 console.log(JSON.stringify(result,null,2));if(problems.length)process.exitCode=1;
}
check();
