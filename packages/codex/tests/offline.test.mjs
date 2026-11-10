import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {auditDashboard} from '../scripts/audit-dashboard.mjs';
import {auditTemplate} from '../scripts/audit-zabbix-template.mjs';
import {diffJson} from '../scripts/diff-json.mjs';
import {parseCsv,planRenames} from '../scripts/plan-host-renames.mjs';
const base=path.dirname(fileURLToPath(import.meta.url));
const fx=(name)=>fs.readFileSync(path.join(base,'fixtures',name),'utf8');
test('dashboard sintético válido tem dois painéis',()=>{
 const r=auditDashboard(JSON.parse(fx('dashboard.json')),JSON.parse(fx('datasources.json')));
 assert.equal(r.status,'PASS');assert.equal(r.details.panelCount,2);
});
test('dashboard detecta UID de fonte ausente',()=>{
 const r=auditDashboard(JSON.parse(fx('dashboard.json')),{foo:{name:'foo'}});
 assert.equal(r.status,'WARN');assert.ok(r.issues.some(x=>x.includes('não reconhecido')));
});
test('dashboard detecta IDs duplicados',()=>{
 const raw=JSON.parse(fx('dashboard.json'));raw.panels[1].id=1;
 assert.ok(auditDashboard(raw).issues.some(x=>x.includes('duplicado')));
});
test('auditoria de export Zabbix reconhece 7.4',()=>{
 const r=auditTemplate(fx('zabbix-template.yaml'));
 assert.equal(r.status,'PASS');assert.equal(r.details.exportVersion,'7.4');
});
test('auditoria Zabbix reporta arquivo incorreto',()=>{
 const r=auditTemplate('foo: bar\n');assert.equal(r.status,'WARN');
});
test('CSV parser suporta aspas e ponto e vírgula',()=>{
 const rows=parseCsv('a;b\n"A;B";3\n');assert.equal(rows[1][0],'A;B');
});
test('renomeação é dry-run e preserva nome técnico',()=>{
 const r=planRenames(fx('rename-hosts.csv'));
 assert.equal(r.status,'PASS');assert.equal(r.details.mode,'DRY_RUN_ONLY');
 assert.deepEqual(r.details.changes[0],{line:2,hostid:'10001',technicalHost:'VM-EXEMPLO-01',previousVisibleName:'VM-EXEMPLO-01',nextVisibleName:'GATEWAY - VM-EXEMPLO-01'});
});
test('renomeação bloqueia hostid duplicado',()=>{
 const r=planRenames(fx('rename-hosts-bad.csv'));
 assert.equal(r.status,'FAIL');assert.ok(r.issues[0].includes('duplicado'));
});
test('diff não revela valores alterados',()=>{
 const r=diffJson({token:'sensitiveOld'},{token:'sensitiveNew'});
 assert.deepEqual(r,[{op:'changed',path:'/token'}]);
 assert.equal(JSON.stringify(r).includes('sensitive'),false);
});
test('CLI fail em CSV duplicado',()=>{
 const root=path.resolve(base,'..');
 const r=spawnSync(process.execPath,[path.join(root,'scripts','plan-host-renames.mjs'),'--file',path.join(base,'fixtures','rename-hosts-bad.csv')],{encoding:'utf8'});
 assert.equal(r.status,1);assert.match(r.stdout,/duplicado/);
});
test('manifestos não incluem MCP corporativo ou credenciais',()=>{
 const root=path.resolve(base,'..');
 for(const name of ['.mcp.json','mcp_config.json']){
  if(!fs.existsSync(path.join(root,name)))continue;
  const config=JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
  assert.deepEqual(Object.keys(config.mcpServers),['observability-api']);
  const server=config.mcpServers['observability-api'];
  assert.equal(server.command,'node');
  assert.equal(server.env,undefined);
  assert.match(server.args[0],/scripts\/mcp-server\.mjs$/);
  assert.equal(JSON.stringify(config).includes('https://'),false);
 }
});
