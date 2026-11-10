#!/usr/bin/env node
// A credential-free MCP fixture installed only in a disposable Codex profile.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const cli=process.argv.slice(2);
const codexIndex=cli.indexOf('--codex');
const executable=codexIndex>=0?cli[codexIndex+1]:(cli.find(arg=>!arg.startsWith('--'))||'codex');
if(!executable)throw Error('--codex requires an executable path');
const probePlaceholders=cli.includes('--probe-placeholders');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const packaged=path.join(root,'packages/codex');
assert.ok(fs.existsSync(path.join(packaged,'scripts/mcp-server.mjs')),'Build packages before running the MCP runtime smoke test');
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'observability-mcp-runtime-'));
const home=path.join(fixture,'profile');
const market=path.join(fixture,'market');
const plugin=path.join(market,'fixture');
fs.mkdirSync(home,{recursive:true});
fs.mkdirSync(path.join(market,'.agents/plugins'),{recursive:true});
fs.mkdirSync(path.join(plugin,'.codex-plugin'),{recursive:true});
fs.mkdirSync(path.join(plugin,'scripts'),{recursive:true});
fs.writeFileSync(path.join(plugin,'.codex-plugin/plugin.json'),JSON.stringify({name:'mcp-root-fixture',version:'1.0.0',description:'Local credential-free MCP fixture',mcpServers:'./.mcp.json'}));
fs.cpSync(packaged,path.join(market,'observability'),{recursive:true});
const bridgeManifest=path.join(market,'observability','.mcp.json');
const bridgeConfig=JSON.parse(fs.readFileSync(bridgeManifest,'utf8'));
const bridgeEntries=Object.entries(bridgeConfig.mcpServers||{});
assert.equal(bridgeEntries.length,1,'Expected one packaged Observability MCP server');
const [bridgeName,bridge]=bridgeEntries[0];
assert.equal(bridge.cwd,'.','Packaged Codex MCP must resolve cwd relative to plugin root');
assert.deepEqual(bridge.args,['scripts/mcp-server.mjs'],'Packaged Codex MCP must use the tested relative script path');
const safeEnv={OBSERVABILITY_PROFILE:path.join(fixture,'absent-profile.json'),ZABBIX_URL:'',ZABBIX_API_TOKEN:'',GRAFANA_URL:'',GRAFANA_SERVICE_ACCOUNT_TOKEN:'',OBSERVABILITY_ALLOW_WRITES:'false'};
bridge.env={...bridge.env,...safeEnv};
fs.writeFileSync(bridgeManifest,JSON.stringify(bridgeConfig));
fs.writeFileSync(path.join(market,'.agents/plugins/marketplace.json'),JSON.stringify({name:'mcp-fixtures',plugins:[{name:'mcp-root-fixture',version:'1.0.0',source:'./fixture'},{name:'observability',version:JSON.parse(fs.readFileSync(path.join(packaged,'.codex-plugin/plugin.json'))).version,source:'./observability'}]}));
fs.writeFileSync(path.join(plugin,'scripts/server.mjs'),`import {createInterface} from 'node:readline';
createInterface({input:process.stdin}).on('line',line=>{let r;try{r=JSON.parse(line)}catch{return}if(r.id===undefined)return;
let result=r.method==='initialize'?{protocolVersion:r.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'path-fixture',version:'1.0.0'}}:r.method==='tools/list'?{tools:[{name:'fixture_ping',description:'Local path validation fixture',inputSchema:{type:'object',properties:{}}}]}:r.method==='tools/call'?{content:[{type:'text',text:'fixture-ok'}]}:{};
process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:r.id,result})+'\\n');});`);
fs.writeFileSync(path.join(plugin,'.mcp.json'),JSON.stringify({mcpServers:{
 ...(probePlaceholders?{root:{command:process.execPath,args:['${PLUGIN_ROOT}/scripts/server.mjs']},claude:{command:process.execPath,args:['${CLAUDE_PLUGIN_ROOT}/scripts/server.mjs']}}:{}),
 relative:{command:process.execPath,args:['scripts/server.mjs'],cwd:'.'}
}}));
const env={...process.env,...safeEnv,CODEX_HOME:home};
let child,lines,sequence=0;const pending=new Map();
try{
 for(const args of [['plugin','marketplace','add',market,'--json'],['plugin','add','mcp-root-fixture@mcp-fixtures','--json'],['plugin','add','observability@mcp-fixtures','--json']]){
  const r=spawnSync(executable,args,{env,encoding:'utf8',windowsHide:true,timeout:60000});
  if(r.error||r.status!==0)throw Error('Fixture installation failed: '+(r.error?.message||r.stderr));
 }
 child=spawn(executable,['app-server','--stdio'],{env,cwd:fixture,windowsHide:true,stdio:['pipe','pipe','pipe']});child.stderr.resume();
 const failPending=error=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();};
 child.on('error',failPending);
 child.on('exit',code=>failPending(Error('Codex app-server exited: '+code)));
 lines=createInterface({input:child.stdout});
 lines.on('line',line=>{let r;try{r=JSON.parse(line)}catch{return}const p=pending.get(r.id);if(!p)return;pending.delete(r.id);clearTimeout(p.timer);r.error?p.reject(Error(r.error.message)):p.resolve(r.result);});
 function request(method,params){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout: '+method));},60000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
 const init=await request('initialize',{clientInfo:{name:'mcp_path_smoke',version:'1.0.0'},capabilities:{experimentalApi:true}});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'initialized'})+'\n');
 await request('thread/start',{cwd:fixture,approvalPolicy:'never',sandbox:'read-only'});
 let status;
 for(let attempt=0;attempt<15;attempt++){
  status=await request('mcpServerStatus/list',{});
  if(['relative',bridgeName].every(name=>(status.data||[]).some(s=>s.name===name&&Object.keys(s.tools||{}).length)))break;
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 const results=(status.data||[]).map(s=>({name:s.name,tools:Object.keys(s.tools||{}),status:s.status,error:s.error}));
 assert.ok(results.some(s=>s.name==='relative'&&s.tools.includes('fixture_ping')),'Relative-path fixture was not discovered');
 const bridgeResult=results.find(s=>s.name===bridgeName);
 assert.ok(bridgeResult,'Packaged bridge was not discovered');
 assert.deepEqual(bridgeResult.tools.sort(),['connection_status','grafana_read','zabbix_read'],'Only status and read tools should be exposed');
 console.log(JSON.stringify({status:'PASS',runtime:init.userAgent,results,scope:'Real packaged MCP discovery in an isolated profile; no external API requests or credentials'},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}finally{
 for(const p of pending.values())clearTimeout(p.timer);
 lines?.close();
 if(child&&child.exitCode===null&&child.signalCode===null){
  // EOF lets app-server stop its MCP children before releasing the fixture cwd.
  await new Promise(resolve=>{
   let deadline;
   const finished=()=>{clearTimeout(deadline);child.off('close',finished);resolve();};
   child.once('close',finished);
   deadline=setTimeout(()=>{child.kill();deadline=setTimeout(finished,2000);},5000);
   child.stdin.end();
  });
 }
 // Only delete the absolute directory created by mkdtemp above.
 await fs.promises.rm(fixture,{recursive:true,force:true,maxRetries:10,retryDelay:250});
}
