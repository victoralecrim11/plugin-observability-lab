import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const p=x=>path.join(root,x);
const read=x=>fs.readFileSync(p(x),'utf8');
const fm=x=>read(x).split(/^---\r?\n/)[1]?.split(/\r?\n---/)[0]??'';
const info=JSON.parse(read('BUILD-INFO.json'));
const isAnti=info.platform==='antigravity';
const special=['observability-orchestrator','zabbix-engineer','grafana-engineer','monitoring-integrations'];
const guarded=['alertas','atualizar-dashboard','atualizar-template','criar-dashboard','criar-template','integrar-aplicacao','monitorar-http','renomear-hosts'];
const agents=['observability-planner','observability-quality-auditor','observability-zabbix-specialist','observability-grafana-specialist','observability-integration-specialist'];

test('skill roteadora model-invoked mantém conhecimento e operações fora do catálogo',()=>{
 const front=fm('skills/observability/SKILL.md');
 assert.match(front,/^user-invocable:\s*false$/m);
 assert.doesNotMatch(front,/^disable-model-invocation:\s*true$/m);
 for(const n of special)assert.ok(fs.existsSync(p('skills/observability/references/domains/'+n+'/GUIDE.md')),n);
});

test('comandos de alteração exigem invocação direta Claude; referências preservam os guardrails',()=>{
 for(const n of guarded){
  assert.match(fm('skills/observability/references/workflows/'+n+'.md'),/^disable-model-invocation:\s*true$/m,n);
  if(info.platform==='claude-codex')assert.match(fm('commands/'+n+'.md'),/^disable-model-invocation:\s*true$/m,n);
 }
});

test('contrato ROOT_ROUTED diferencia planner, specialist e auditor e exige prova',()=>{
 const s=read('references/agentic-workflow.md');
 assert.match(s,/ROOT_ROUTED/);
 assert.match(s,/NOT EXECUTED/);
 assert.match(s,/ROOT_PROXY/);
 assert.match(s,/APPROVAL/);
 assert.match(s,/nested delegation/i);
});
test('agentes com nomes exclusivos e fronteiras de responsabilidade',()=>{
 for(const a of agents){
  assert.ok(fs.existsSync(p('agents/'+a+'.md')),'missing '+a);
  const front=fm('agents/'+a+'.md');
  assert.match(front,new RegExp('^name:\\s*'+a+'$','m'));
  if(isAnti){
   assert.match(front,/^mainAgent:\s*false$/m);
   assert.match(front,/^subagent:\s*true$/m);
   assert.match(front,/^commandExecutionPolicy:\s*off$/m);
   assert.match(front,/^inheritMcp:\s*false$/m);
   assert.doesNotMatch(front,/^tools:/m,'restricted tool list caused old runtime registry error');
  }
 }
});
test('guardrails nativos possuem trigger valido e nao sao ignorados pelo Antigravity',()=>{
 for(const filename of ['rules/security.md','rules/agentic-governance.md']){
  if(!fs.existsSync(p(filename))){if(isAnti)assert.fail('Regra ausente: '+filename);continue;}
  assert.match(fm(filename),/^trigger:\s*(?:always_on|model_decision|glob|manual)$/m,filename);
 }
});

test('pacote Antigravity nao herda arquivo MCP exclusivo Claude',()=>{
 if(!isAnti)return;
 assert.equal(fs.existsSync(p('.mcp.json')),false);
 assert.equal(fs.existsSync(p('mcp_config.json')),true);
});

test('marketplace Codex mantém nome estável para atualização do cadastro existente',()=>{
 if(info.platform!=='claude-codex')return;
 const claude=JSON.parse(read('.claude-plugin/marketplace.json'));
 const codex=JSON.parse(read('.agents/plugins/marketplace.json'));
 const plugin=JSON.parse(read('.codex-plugin/plugin.json'));
 assert.equal(claude.name,'observability-marketplace');
 assert.equal(codex.name,claude.name);
 assert.equal(codex.plugins[0].name,'observability');
 assert.equal(codex.plugins[0].version,plugin.version);
});
