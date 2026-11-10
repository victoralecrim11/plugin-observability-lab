#!/usr/bin/env node
// Real runtime discovery smoke test; install the fixture before running this script.
// node scripts/test-runtime-catalog.mjs --codex /path/to/codex --home /isolated/profile --marketplace-path /marketplace
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workflowDir=fs.existsSync(path.join(root,'workflows'))?path.join(root,'workflows'):path.join(root,'skills/observability/references/workflows');
const expectedNames=['observability',...fs.readdirSync(workflowDir).filter(n=>n.endsWith('.md')).map(n=>n.slice(0,-3))].sort();
assert.equal(expectedNames.length,20,'Expected router plus 19 canonical workflows');

const args=process.argv.slice(2);
const option=name=>{
 const index=args.indexOf(name);
 if(index<0)return undefined;
 if(!args[index+1]||args[index+1].startsWith('--'))throw Error(`Missing value for ${name}`);
 return args[index+1];
};
const executable=option('--codex')||'codex';
const home=option('--home');
const marketplace=option('--marketplace-path');
const cwd=path.resolve(option('--cwd')||process.cwd());
const env={...process.env,...(home?{CODEX_HOME:path.resolve(home)}:{})};
let sequence=0;
const pending=new Map();
const child=spawn(executable,['app-server','--stdio'],{env,cwd,stdio:['pipe','pipe','pipe'],windowsHide:true});
// Do not emit runtime stderr: unrelated plugins may log private configuration.
child.stderr.resume();
const lines=createInterface({input:child.stdout});
const failAll=error=>{for(const {reject,timer} of pending.values()){clearTimeout(timer);reject(error);}pending.clear();};
child.on('error',failAll);
child.on('exit',code=>failAll(Error(`Codex app-server exited (${code})`)));
lines.on('line',line=>{
 let response;try{response=JSON.parse(line);}catch{return;}
 const entry=pending.get(response.id);if(!entry)return;
 pending.delete(response.id);clearTimeout(entry.timer);
 if(response.error)entry.reject(Error(`${entry.method}: ${response.error.message}`));
 else entry.resolve(response.result);
});
function request(method,params){
 return new Promise((resolve,reject)=>{
  const id=++sequence;
  const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Timeout waiting for ${method}`));},60000);
  pending.set(id,{resolve,reject,timer,method});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
 });
}
function assertCatalog(skills,label){
 const actualNames=skills.map(s=>s.name.replace(/^observability:/,'')).sort();
 assert.deepEqual(actualNames,expectedNames,`${label}: expected exactly the router and 19 native workflows`);
 assert.ok(!skills.some(s=>/source-command|migrated-command-skills/i.test(`${s.name} ${s.path}`)),`${label}: migrated command leaked`);
}
try{
 const initialized=await request('initialize',{clientInfo:{name:'observability_catalog_smoke',title:'Observability catalog smoke test',version:'1.0.0'},capabilities:{experimentalApi:true}});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'initialized'})+'\n');
 const readParams={pluginName:'observability'};
 if(marketplace){
  const resolved=path.resolve(marketplace);
  readParams.marketplacePath=fs.statSync(resolved).isDirectory()?path.join(resolved,'.agents','plugins','marketplace.json'):resolved;
 }
 const detail=await request('plugin/read',readParams);
 const plugin=detail.plugin;
 assert.ok(plugin,'plugin/read did not return plugin detail');
 assertCatalog(plugin.skills,'plugin/read');
 const catalog=await request('skills/list',{cwds:[cwd],forceReload:true});
 assert.ok(Array.isArray(catalog.data)&&catalog.data.length>0,'skills/list returned no cwd entries');
 for(const entry of catalog.data){
  const owned=entry.skills.filter(s=>s.pluginId===plugin.summary.id || (!s.pluginId&&/[\\/]observability[\\/]/i.test(s.path)));
  assertCatalog(owned,'skills/list');
  for(const skill of owned)assert.ok(skill.enabled,'Observability skill is disabled: '+skill.name);
  const errors=(entry.errors||[]).filter(e=>/observability/i.test(e.path));
  assert.deepEqual(errors,[],'Observability skill loading errors');
 }
 console.log(JSON.stringify({status:'PASS',runtime:initialized.userAgent||null,pluginId:plugin.summary.id,pluginReadSkills:plugin.skills.map(s=>s.name),skillsListCount:expectedNames.length,sourceCommands:0,scope:'Real app-server catalog; visual UI is a separate check'},null,2));
}catch(error){
 console.error(JSON.stringify({status:'FAIL',message:error.message},null,2));
 process.exitCode=1;
}finally{
 lines.close();child.stdin.end();child.kill();failAll(Error('Smoke test finished'));
}
