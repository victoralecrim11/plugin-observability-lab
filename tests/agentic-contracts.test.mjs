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

test('skills de conhecimento ocultas para usuario com invocacao por contexto preservada',()=>{
 for(const n of special){
   const front=fm('skills/'+n+'/SKILL.md');
   assert.match(front,/^user-invocable:\s*false$/m,n);
   assert.doesNotMatch(front,/^disable-model-invocation:\s*true$/m,n);
 }
});
test('comandos de alteracao exigem invocacao direta Claude',()=>{
 if(isAnti)return;
 for(const n of guarded){
  const dir=fs.existsSync(p('commands'))?'commands':'workflows';
  assert.match(fm(dir+'/'+n+'.md'),/^disable-model-invocation:\s*true$/m,n);
 }
});
test('Codex ops continuam inteiras e nao invocaveis no menu quando runtime suporta flag',()=>{
 if(isAnti)return;
 const names=fs.readdirSync(p('codex-skills')).filter(n=>fs.existsSync(p('codex-skills/'+n+'/SKILL.md')));
 assert.equal(names.length,19);
 for(const n of names){
  assert.match(fm('codex-skills/'+n+'/SKILL.md'),/^user-invocable:\s*false$/m,n);
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
test('skills operacionais do Antigravity permanecem acionaveis por intencao',()=>{
 if(!isAnti)return;
 const front=fm('skills/diagnosticar/SKILL.md');
 assert.doesNotMatch(front,/^user-invocable:\s*false$/m);
});
test('guardrails nativos para Antigravity e arquivos compartilhados',()=>{
 if(!isAnti)return;
 assert.ok(fs.existsSync(p('rules/security.md')));
 assert.ok(fs.existsSync(p('rules/agentic-governance.md')));
});
