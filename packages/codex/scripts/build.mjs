#!/usr/bin/env node
/**
 * Observability Dev Toolkit - version derived from package.json
 * One canonical source, three runtime surfaces:
 *  - claude-codex: Claude commands plus contextual router (not the Codex installation root)
 *  - codex: isolated package without Claude command migration
 *  - antigravity: isolated native distribution
 * Workflow markdown is the source of truth for Claude commands and contextual references.
 */
import './sync-content.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const version = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const pluginName = 'observability';
const workflowNames = fs.readdirSync(path.join(root,'workflows')).filter(x => x.endsWith('.md')).sort();
const domainNames = fs.readdirSync(path.join(root,'skills')).filter(x => fs.statSync(path.join(root,'skills',x)).isDirectory()).sort();
const description = 'Sustentação e engenharia de observabilidade para Zabbix 7.4.x, Grafana 12.x e integrações, priorizando auditoria e mudanças autorizadas.';
const author = {name:'Victor Alecrim',url:'https://github.com/victoralecrim11'};
const keywords = ['zabbix','grafana','observability','monitoring','prometheus','azure','sre'];
const cp = (from, to) => { fs.mkdirSync(path.dirname(to),{recursive:true}); fs.cpSync(from,to,{recursive:true}); };
const write = (to, content) => { fs.mkdirSync(path.dirname(to),{recursive:true}); fs.writeFileSync(to,typeof content==='string'?content:JSON.stringify(content,null,2)+'\n','utf8'); };
function parseWorkflow(markdown, name) {
 const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!m) throw new Error(`Frontmatter inválido: ${name}`);
 const desc = m[1].match(/^description:\s*(.+)$/m)?.[1];
 if(!desc) throw new Error(`description ausente: ${name}`);
 return {description:desc,body:m[2]};
}
function common(base) {
 for(const dir of ['references','config','scripts','docs','tests','agents']) cp(path.join(root,dir),path.join(base,dir));
 for(const file of ['LICENSE','README.md']) cp(path.join(root,file),path.join(base,file));
 const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 pkg.scripts = {
   scan:'node scripts/security-scan.mjs',
   validate:'node scripts/validate-package.mjs --path .',
   test:'node --test tests/*.test.mjs',
   check:'npm run scan && npm run validate && npm test'
 };
 write(path.join(base,'package.json'),pkg);
 write(path.join(base,'.mcp.json'),{mcpServers:{}});
 for(const name of domainNames) cp(path.join(root,'skills',name),path.join(base,'skills',name));
}
function buildUnified() {
 const platform = 'claude-codex';
 const base = path.join(dist,platform,pluginName);
 fs.rmSync(base,{recursive:true,force:true}); fs.mkdirSync(base,{recursive:true});
 common(base);
 cp(path.join(root,'.agents','plugins','marketplace.json'),path.join(base,'.agents','plugins','marketplace.json'));
 for(const file of workflowNames) {
   cp(path.join(root,'workflows',file),path.join(base,'commands',file));
 }
 cp(path.join(root,'rules','AGENTS.md'),path.join(base,'AGENTS.md'));
 const manifest = {name:pluginName,displayName:'Observability Dev Toolkit',description,version,author,license:'MIT',keywords};
 write(path.join(base,'.claude-plugin','plugin.json'),manifest);
 write(path.join(base,'.claude-plugin','marketplace.json'),{
  name:'observability-marketplace',version,description:'Marketplace local do Observability Dev Toolkit.',owner:author,
  plugins:[{
   name:pluginName,displayName:'Observability Dev Toolkit',source:'./',description,version,author,license:'MIT',category:'development',keywords,
   skills:['./skills/'],commands:['./commands/'],
   agents:fs.readdirSync(path.join(root,'agents')).filter(x=>x.endsWith('.md')).sort().map(x=>`./agents/${x}`),
   strict:true
  }]
 });
 write(path.join(base,'.codex-plugin','plugin.json'),{
  name:pluginName,version,description,author:{name:author.name},license:'MIT',keywords,
  skills:'./skills/',mcpServers:'./.mcp.json',
  interface:{displayName:'Observability Dev Toolkit',shortDescription:'Audite e planeje Zabbix e Grafana com segurança.',
   longDescription:'Plugin integrado de observabilidade: auditoria, diagnóstico, dashboards, templates e integrações sem escrita automática em produção.',
   developerName:author.name,category:'Developer Tools',capabilities:['Read','Write'],
   defaultPrompt:['Audite este dashboard Grafana sem alterar o ambiente.','Planeje a integração HTTP de uma aplicação em homologação.','Crie um dry-run de renomeação de hosts Zabbix.']}
 });
 write(path.join(base,'BUILD-INFO.json'),{
  platform,version,domainSkills:domainNames.length,commands:workflowNames.length,codexOperationalSkills:0,workflowReferences:workflowNames.length,
  runtime:['claude-code','codex'],sourceOfTruth:'workflows/',mode:'offline',remoteWrites:0
 });
 return {platform,path:base,skillsShared:domainNames.length,commandsClaude:workflowNames.length,skillsCodex:domainNames.length};
}
function buildAntigravity(){
 const platform='antigravity';const base=path.join(dist,platform,pluginName);
 fs.rmSync(base,{recursive:true,force:true});fs.mkdirSync(base,{recursive:true});
 common(base);
 fs.rmSync(path.join(base,'.mcp.json'),{force:true}); // Claude-only config must not ship in Antigravity
 cp(path.join(root,'rules'),path.join(base,'rules'));
 write(path.join(base,'plugin.json'),{name:pluginName,version,displayName:'Observability Dev Toolkit',description,author,license:'MIT',keywords,
  suggestedPrompts:['Audite o Zabbix sem modificar produção','Diagnostique um painel Grafana sem dados','Planeje o monitoramento HTTP de nova aplicação']
 });
 write(path.join(base,'mcp_config.json'),{mcpServers:{}});
 for(const file of fs.readdirSync(path.join(base,'agents')).filter(x=>x.endsWith('.md'))) {
  const dst=path.join(base,'agents',file);
  let body=fs.readFileSync(dst,'utf8');
  body=body.replace('model: inherit\n','model: inherit\nmainAgent: false\nsubagent: true\ncommandExecutionPolicy: off\ninheritMcp: false\n');
  write(dst,body);
 }
 write(path.join(base,'BUILD-INFO.json'),{platform,version,domainSkills:domainNames.length,operationalSkills:0,workflowReferences:workflowNames.length,
  sourceOfTruth:'workflows/',mode:'offline',remoteWrites:0});
 return {platform,path:base,skills:domainNames.length};
}
fs.mkdirSync(dist,{recursive:true});
console.log(JSON.stringify(buildUnified()));
console.log(JSON.stringify(buildAntigravity()));
const codexBase=path.join(dist,'codex',pluginName);
fs.rmSync(codexBase,{recursive:true,force:true});
cp(path.join(dist,'claude-codex',pluginName),codexBase);
for(const rel of ['commands','.claude-plugin','.agents']) fs.rmSync(path.join(codexBase,rel),{recursive:true,force:true});
// Native Codex entries expose each operation once, without Claude command migration.
for(const file of workflowNames) {
 const slug=file.replace(/\.md$/,'');
 const workflow=parseWorkflow(fs.readFileSync(path.join(root,'workflows',file),'utf8'),file);
 const front=`---\nname: ${slug}\ndescription: ${workflow.description}\nlicense: MIT\nmetadata:\n  version: "${version}"\n---\n`;
 const guidance='\n\n## Localização do conhecimento\nResolva references/ e scripts/ citados acima a partir da raiz do plugin, dois níveis acima deste diretório. Consulte também ../observability/SKILL.md para especialidades e governança. A invocação desta operação não autoriza alterações remotas: preserve aprovação específica, backup, diff e rollback.\n';
 write(path.join(codexBase,'skills',slug,'SKILL.md'),front+workflow.body+guidance);
}
write(path.join(codexBase,'BUILD-INFO.json'),{platform:'codex',version,domainSkills:1,commands:0,codexOperationalSkills:workflowNames.length,workflowReferences:workflowNames.length,runtime:['codex'],sourceOfTruth:'workflows/',mode:'offline',remoteWrites:0});
console.log(JSON.stringify({platform:'codex',path:codexBase,skills:domainNames.length+workflowNames.length,commands:0}));
if(process.argv.includes('--sync')) {
 for(const rel of ['.claude-plugin','.codex-plugin','BUILD-INFO.json']) cp(path.join(dist,'claude-codex',pluginName,rel),path.join(root,rel));
 const published=path.join(root,'packages','codex');
 fs.rmSync(published,{recursive:true,force:true});
 cp(codexBase,published);
}
