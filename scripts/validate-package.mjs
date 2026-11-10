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
function list(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!e.isDirectory()||!['.git','node_modules','dist','packages'].includes(e.name)).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function read(rel){return fs.readFileSync(path.join(base,rel),'utf8');}
function json(rel){try{return JSON.parse(read(rel));}catch(e){problems.push(`JSON inválido/ausente ${rel}: ${e.message}`);return null;}}
function fm(file){const t=fs.readFileSync(file,'utf8');const m=t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);if(!m)throw Error(`Frontmatter inexistente: ${file}`);return Object.fromEntries(m[1].split('\n').filter(x=>/^[\w-]+:/.test(x)).map(x=>{const i=x.indexOf(':');return[x.slice(0,i),x.slice(i+1).trim()] }));}
function eq(received,expected,what){if(received!==expected)problems.push(`${what}: esperado ${expected}; observado ${received}`);}
function check(){
 const domain=list(path.join(base,'skills')).filter(x=>x.endsWith('SKILL.md'));
 const codex=list(path.join(base,'codex-skills')).filter(x=>x.endsWith('SKILL.md'));
 const commands=list(path.join(base,'commands')).filter(x=>x.endsWith('.md'));
 const workflows=list(path.join(base,'workflows')).filter(x=>x.endsWith('.md'));
 const info=json('BUILD-INFO.json');
 const combined=info?.platform==='claude-codex';const anti=info?.platform==='antigravity';const isolated=info?.platform==='codex';
 if(!combined&&!anti&&!isolated)problems.push('Plataforma desconhecida');
 eq(domain.length,isolated?20:1,'quantidade de skills esperada');
 eq(codex.length,0,'skills operacionais Codex legadas');
 if(exists('codex-skills'))problems.push('Diretório codex-skills legado');
 for(const rel of ['.codex-plugin/migrated-command-skills','.claude-plugin/migrated-command-skills'])if(exists(rel))problems.push('Source Command migrado no pacote: '+rel);
 if(isolated||anti)for(const rel of ['commands','.claude-plugin'])if(exists(rel))problems.push('Superfície Claude indevida: '+rel);
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
 const skill='skills/observability/SKILL.md';
 if(!exists(skill))problems.push('Skill roteadora ausente');
 else {
  const front=fm(path.join(base,skill));
  if(front['user-invocable']!=='false'||front['disable-model-invocation']==='true')problems.push('Skill roteadora deve ser model-invoked');
 }
 const refDir='skills/observability/references/workflows';
 const refs=list(path.join(base,refDir)).filter(x=>x.endsWith('.md'));
 eq(refs.length,19,'workflows como referências');
 const expectedNames=['observability',...(isolated?refs.map(f=>path.basename(f,'.md')):[])].sort();
 const actualNames=domain.map(f=>path.basename(path.dirname(f))).sort();
 if(JSON.stringify(actualNames)!==JSON.stringify(expectedNames))problems.push('Catálogo de skills divergente');
 for(const file of domain)if(path.relative(path.join(base,'skills'),file).split(path.sep).length!==2)problems.push('Skill interna exposta: '+file);
 if(isolated)for(const ref of refs){
  const slug=path.basename(ref,'.md');
  const rel='skills/'+slug+'/SKILL.md';
  if(!exists(rel)){problems.push('Operação Codex ausente: '+slug);continue;}
  const canonical=fs.readFileSync(ref,'utf8').replace(/\r\n/g,'\n');
  const content=read(rel).replace(/\r\n/g,'\n');
  const body=canonical.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)?.[1];
  const front=fm(path.join(base,rel));
  if(!body||!content.includes(body))problems.push('Workflow divergente na operação Codex: '+slug);
  if(front.description!==fm(ref).description)problems.push('Descrição Codex divergente: '+slug);
  if(front['user-invocable']==='false')problems.push('Operação Codex oculta do menu: '+slug);
 }

 for(const name of ['observability-orchestrator','zabbix-engineer','grafana-engineer','monitoring-integrations']){
  if(!exists('skills/observability/references/domains/'+name+'/GUIDE.md'))problems.push('Conhecimento de domínio ausente: '+name);
 }
 for(const f of [...commands,...workflows]){
  const rel=refDir+'/'+path.basename(f);
  if(!exists(rel)||fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')!==read(rel).replace(/\r\n/g,'\n'))problems.push('Workflow divergente: '+path.basename(f));
 }
 if(isolated){
  const cx=json('.codex-plugin/plugin.json');
  if(cx?.name!=='observability'||cx?.version!==info?.version)problems.push('Identidade/versão Codex divergente');
  if(JSON.stringify(cx?.skills)!==JSON.stringify('./skills/'))problems.push('Codex deve declarar somente ./skills/');
 }
 if(!exists('references/security-policy.md'))problems.push('Política de segurança ausente');
 for(const file of list(base).filter(x=>x.endsWith('.json')&&!x.includes('node_modules')))try{JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){problems.push(`JSON inválido: ${file}`)}
 for(const file of list(base).filter(x=>/\.(md|json|mjs|yaml|yml|txt)$/.test(x)&&!x.includes('node_modules'))){
  const t=fs.readFileSync(file,'utf8');
  if(/Bearer\s+[a-z0-9_-]{25,}/i.test(t)||/\bsk-proj-[a-z0-9_-]{20,}/i.test(t))problems.push(`Possível credencial literal: ${file}`);
 }
 if(combined){
  for(const n of ['alertas','atualizar-dashboard','atualizar-template','criar-dashboard','criar-template','integrar-aplicacao','monitorar-http','renomear-hosts']){
    const p='commands/'+n+'.md';
    if(!exists(p)||fm(path.join(base,p))['disable-model-invocation']!=='true')problems.push('Comando de alteracao sem invocacao manual: '+n);
  }
  const expected=['observability-planner','observability-quality-auditor','observability-zabbix-specialist','observability-grafana-specialist','observability-integration-specialist'];
  for(const n of expected)if(!exists('agents/'+n+'.md'))problems.push('Agente ausente: '+n);
  if(!exists('references/agentic-workflow.md'))problems.push('Contrato ROOT_ROUTED ausente');
  const claude=json('.claude-plugin/plugin.json');const market=json('.claude-plugin/marketplace.json');const cx=json('.codex-plugin/plugin.json');const mcp=json('.mcp.json');
  if(claude?.name!==cx?.name||claude?.name!=='observability')problems.push('Identidade divergente Claude/Codex');
  if(claude?.version!==cx?.version||claude?.version!==info?.version)problems.push('Versões divergentes Claude/Codex/BUILD');
  if(market?.plugins?.[0]?.name!==claude?.name)problems.push('Marketplace Claude com nome incompatível');
  const codexMarket=json('.agents/plugins/marketplace.json');
  if(market?.name!=='observability-marketplace'||codexMarket?.name!==market?.name)problems.push('Nomes de marketplaces Claude e Codex divergentes; atualizar um marketplace existente falha');
  if(codexMarket?.plugins?.[0]?.name!==claude?.name)problems.push('Plugin no marketplace Codex com identidade divergente');
  if(codexMarket?.plugins?.[0]?.version!==cx?.version)problems.push('Versao do marketplace Codex divergente do manifesto');
  if(mcp?.mcpServers&&Object.keys(mcp.mcpServers).length!==0)problems.push('A distribuição não pode vir com MCP corporativo pré-configurado');
  const skillPaths=Array.isArray(cx?.skills)?cx.skills:[cx?.skills];
  if(skillPaths.length!==1||skillPaths[0]!=='./skills/')problems.push('Codex deve declarar somente ./skills/');
  for(const value of skillPaths){if(typeof value!=='string'||!value.startsWith('./')||value.includes('..')||!exists(value))problems.push(`Caminho de skills inválido: ${value}`)}
  if(!exists('AGENTS.md'))problems.push('AGENTS.md compartilhado ausente');
 }
 if(anti){
   if(exists('.mcp.json'))problems.push('Arquivo Claude .mcp.json nao deve existir no pacote Antigravity');
   for(const rel of ['plugin.json','mcp_config.json','rules/AGENTS.md','rules/security.md','rules/agentic-governance.md','references/agentic-workflow.md']){
      if(!exists(rel))problems.push('Manifesto/regras/contrato Antigravity ausente: '+rel);
   }
   for(const rel of ['rules/security.md','rules/agentic-governance.md']){
      if(exists(rel)&&!/^---\r?\n[\s\S]*?^trigger:\s*(?:always_on|model_decision|glob|manual)\s*$/m.test(read(rel)))problems.push('Regra Antigravity sem trigger valido: '+rel);
   }
   const required=['observability-planner','observability-quality-auditor','observability-zabbix-specialist','observability-grafana-specialist','observability-integration-specialist'];
   const found=list(path.join(base,'agents')).filter(x=>x.endsWith('.md'));
   eq(found.length,required.length,'agentes Antigravity');
   for(const n of required){
      const rel='agents/'+n+'.md';
      if(!exists(rel)){problems.push('Agente Antigravity ausente: '+n);continue;}
      const v=fm(path.join(base,rel));
      if(v.name!==n||v.mainAgent!=='false'||v.subagent!=='true'||v.commandExecutionPolicy!=='off'||v.inheritMcp!=='false')problems.push('Metadata insegura/incompativel: '+rel);
      if(Object.hasOwn(v,'tools'))problems.push('Lista de ferramentas Antigravity fixa: '+rel);
   }
 }
 if(!source&&!exists('scripts/audit-dashboard.mjs'))problems.push('Scripts offline incompletos');
 if(source&&!exists('scripts/build.mjs'))problems.push('Builder não localizado');
 const result={status:problems.length?'FAIL':'PASS',mode:source?'source':info?.platform||'unrecognized',base,skills:domain.length,operationalSkills:isolated?domain.length-1:0,legacyOperationalSkills:codex.length,commands:commands.length,workflows:workflows.length,workflowReferences:refs.length,problems};
 console.log(JSON.stringify(result,null,2));if(problems.length)process.exitCode=1;
}
check();
