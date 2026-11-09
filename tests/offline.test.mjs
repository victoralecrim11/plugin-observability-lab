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
test('19 procedimentos e skills de domínio, na fonte ou na distribuição',()=>{
 const root=path.resolve(base,'..');
 const hasSource=fs.existsSync(path.join(root,'workflows'));
 if(hasSource) {
  assert.equal(fs.readdirSync(path.join(root,'workflows')).filter(x=>x.endsWith('.md')).length,19);
  assert.equal(fs.readdirSync(path.join(root,'skills')).length,4);
 } else {
  const cmds=fs.existsSync(path.join(root,'commands'))?fs.readdirSync(path.join(root,'commands')).filter(x=>x.endsWith('.md')).length:0;
  const skills=fs.readdirSync(path.join(root,'skills')).length;
  assert.ok((cmds===19&&skills===4)||(cmds===0&&skills===23));
 }
});
test('CLI fail em CSV duplicado',()=>{
 const root=path.resolve(base,'..');
 const r=spawnSync(process.execPath,[path.join(root,'scripts','plan-host-renames.mjs'),'--file',path.join(base,'fixtures','rename-hosts-bad.csv')],{encoding:'utf8'});
 assert.equal(r.status,1);assert.match(r.stdout,/duplicado/);
});
test('plugin combinado expõe manifestos Claude e Codex com identidade única',()=>{
 const root=path.resolve(base,'..');
 const rel='dist/claude-codex/observability';
 const b=fs.existsSync(path.join(root,rel))?path.join(root,rel):root;
 const claude=path.join(b,'.claude-plugin','plugin.json');
 const codex=path.join(b,'.codex-plugin','plugin.json');
 if(!fs.existsSync(claude)||!fs.existsSync(codex))return; // Teste no pacote Antigravity isolado.
 const c=JSON.parse(fs.readFileSync(claude,'utf8'));
 const x=JSON.parse(fs.readFileSync(codex,'utf8'));
 assert.equal(c.name,'observability');
 assert.equal(x.name,c.name);
 assert.equal(x.version,c.version);
 assert.deepEqual(x.skills,['./skills/','./codex-skills/']);
});
test('19 operações Codex correspondem exatamente aos comandos Claude',()=>{
 const root=path.resolve(base,'..');
 const dist=path.join(root,'dist/claude-codex/observability');
 const b=fs.existsSync(path.join(root,'commands'))?root:dist;
 if(!fs.existsSync(path.join(b,'commands')))return; // Antigravity usa outra distribuição.
 const commands=fs.readdirSync(path.join(b,'commands')).filter(f=>f.endsWith('.md')).sort();
 const codex=fs.readdirSync(path.join(b,'codex-skills')).sort();
 assert.equal(commands.length,19);
 assert.deepEqual(commands.map(f=>f.replace(/\.md$/,'')).sort(),codex);
 for(const f of commands){
  const slug=f.replace(/\.md$/,'');
  const op=fs.readFileSync(path.join(b,'codex-skills',slug,'SKILL.md'),'utf8');
  const command=fs.readFileSync(path.join(b,'commands',f),'utf8');
  assert.ok(op.includes(`name: ${slug}`));
  assert.ok(op.includes(command.match(/^description: (.+)$/m)?.[1]||'__missing__'));
 }
});
test('manifestos não incluem MCP corporativo ou credenciais',()=>{
 const root=path.resolve(base,'..');
 const b=fs.existsSync(path.join(root,'dist','claude-codex','observability'))?path.join(root,'dist','claude-codex','observability'):root;
 if(!fs.existsSync(path.join(b,'.mcp.json')))return;
 const j=JSON.parse(fs.readFileSync(path.join(b,'.mcp.json'),'utf8'));
 assert.deepEqual(j,{mcpServers:{}});
});
