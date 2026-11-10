import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createApiClient,validateEndpoint,redact} from '../scripts/mcp-api-client.mjs';

const config={zabbix:{url:'https://zabbix.example/api_jsonrpc.php',token:'synthetic-z-token'},grafana:{url:'https://grafana.example/grafana',token:'synthetic-g-token'},allowWrites:true};
const source={zabbix_export:{version:'7.4',templates:[{template:'API Example',name:'API Example'}]}};
const rules={templates:{createMissing:true},items:{createMissing:true,deleteMissing:false}};
function fixture(settings=config,result={ok:true}){
 const calls=[];
 const client=createApiClient(settings,{fetchImpl:async(url,options)=>{calls.push({url:String(url),...options});const body=options.body&&JSON.parse(options.body);return Response.json(body?.jsonrpc?{jsonrpc:'2.0',id:body.id,result}:result);}});
 return {client,calls};
}
test('connection URL policy rejects insecure hosts, credentials and ambiguous endpoints',()=>{
 for(const url of ['http://zabbix.example/api_jsonrpc.php','https://u:p@example.com/api_jsonrpc.php','https://example.com/api_jsonrpc.php?x=1','https://example.com/api_jsonrpc.php#x','https://example.com/zabbix'])assert.throws(()=>validateEndpoint(url,'zabbix'),{code:'CONFIG_INVALID'});
 for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(validateEndpoint(`http://${host}/api_jsonrpc.php`,'zabbix').protocol,'http:');
});
test('read requests authenticate and preserve Grafana subpath; API version omits authentication',async()=>{
 const {client,calls}=fixture();
 await client.zabbixRead({method:'host.get',params:{output:['hostid']}});
 await client.zabbixRead({method:'apiinfo.version'});
 await client.grafanaRead({resource:'search',query:'API & test'});
 assert.equal(calls[0].headers.Authorization,'Bearer synthetic-z-token');
 assert.equal(calls[1].headers.Authorization,undefined);
 assert.equal(calls[2].headers.Authorization,'Bearer synthetic-g-token');
 assert.equal(calls[2].url,'https://grafana.example/grafana/api/search?query=API+%26+test');
 assert.ok(calls.every(c=>c.redirect==='error'&&c.signal instanceof AbortSignal));
});
test('read allowlists reject mutating methods, URL injection, traversal and non-template exports without fetch',async()=>{
 const {client,calls}=fixture();
 for(const args of [{method:'host.delete'},{method:'apiinfo.version',params:{x:1}},{method:'configuration.export',params:{format:'json',options:{hosts:['1']}}}])await assert.rejects(client.zabbixRead(args),{code:'INVALID_ARGUMENT'});
 for(const args of [{resource:'dashboard',uid:'../admin'},{resource:'health',url:'https://attacker.example'},{resource:'health',query:'x'}])await assert.rejects(client.grafanaRead(args),{code:'INVALID_ARGUMENT'});
 assert.equal(calls.length,0);
});
test('disabled writes fail even with valid arguments',async()=>{
 const {client,calls}=fixture({...config,allowWrites:false});
 await assert.rejects(client.importTemplate({source,rules}),{code:'READ_ONLY'});
 await assert.rejects(client.importDashboard({dashboard:{title:'API',panels:[]},folderUid:'folder'}),{code:'READ_ONLY'});
 assert.equal(calls.length,0);
});
test('template import wraps reviewed JSON and denies deletions, host imports and incomplete rules',async()=>{
 const {client,calls}=fixture();
 await client.importTemplate({source,rules});
 const body=JSON.parse(calls[0].body);
 assert.equal(body.method,'configuration.import');
 assert.deepEqual(body.params,{format:'json',source:JSON.stringify(source),rules});
 for(const args of [{source,rules:{templates:{createMissing:true},items:{deleteMissing:true}}},{source:{zabbix_export:{...source.zabbix_export,hosts:[]}},rules},{source:JSON.stringify(source),rules},{source,rules:{items:{createMissing:true}}},{source,rules:{templates:{createMissing:'true'}}}])await assert.rejects(client.importTemplate(args),{code:'INVALID_ARGUMENT'});
 assert.equal(calls.length,1);
});
test('dashboard import requires explicit folder/root choice and resolved inputs; defaults to no overwrite',async()=>{
 const {client,calls}=fixture();const dashboard={title:'API',panels:[]};
 for(const args of [{dashboard},{dashboard,folderUid:''},{dashboard:{...dashboard,__inputs:[{name:'DS'}]},folderUid:'folder'},{dashboard,folderUid:'folder',overwrite:true},{dashboard:{...dashboard,id:5},folderUid:'folder'},{dashboard:{...dashboard,uid:'existing',version:3},folderUid:'folder'}])await assert.rejects(client.importDashboard(args),{code:'INVALID_ARGUMENT'});
 await client.importDashboard({dashboard,folderUid:'',rootFolder:true});
 assert.equal(calls[0].url,'https://grafana.example/grafana/api/dashboards/db');
 assert.deepEqual(JSON.parse(calls[0].body),{dashboard,folderUid:'',overwrite:false});
 await client.importDashboard({dashboard:{...dashboard,uid:'existing',version:2},folderUid:'folder',overwrite:true});
 assert.equal(JSON.parse(calls[1].body).overwrite,true);
});
test('transport and remote errors are sanitized and writes are never retried',async()=>{
 let count=0;
 const client=createApiClient(config,{fetchImpl:async()=>{count++;throw new Error('synthetic-z-token https://private.example secret payload');}});
 await assert.rejects(client.importTemplate({source,rules}),error=>error.code==='TRANSPORT_ERROR'&&!/synthetic|private|payload/.test(error.message));
 assert.equal(count,1);
 const remote=createApiClient(config,{fetchImpl:async(_,options)=>Response.json({jsonrpc:'2.0',id:JSON.parse(options.body).id,error:{data:'synthetic-z-token secret'}})});
 await assert.rejects(remote.zabbixRead({method:'template.get'}),error=>error.code==='ZABBIX_ERROR'&&!/synthetic|secret/.test(error.message));
});
test('bounded responses and malformed RPC responses fail closed',async()=>{
 const big=createApiClient(config,{maxBytes:20,fetchImpl:async()=>new Response('x'.repeat(21))});
 await assert.rejects(big.grafanaRead({resource:'health'}),{code:'RESPONSE_TOO_LARGE'});
 const wrong=createApiClient(config,{fetchImpl:async()=>Response.json({jsonrpc:'2.0',id:999,result:[]})});
 await assert.rejects(wrong.zabbixRead({method:'host.get'}),{code:'INVALID_RESPONSE'});
});
test('output redacts configured credentials, credential keys and serialized exports',async()=>{
 const value={password:'other',nested:{access_token:'another'},macros:[{macro:'{$AUTH}',value:'sensitive'}],text:'contains synthetic-z-token'};
 const {client}=fixture(config,value);
 const result=await client.zabbixRead({method:'template.get'});
 assert.equal(result.password,'[REDACTED]');assert.equal(result.macros[0].value,'[REDACTED]');assert.equal(result.text,'contains [REDACTED]');
 assert.deepEqual(JSON.parse(redact(JSON.stringify(value),['synthetic-z-token'])),result);
});
test('real loopback HTTP transport sends token once and refuses redirect forwarding',async()=>{
 const received=[];
 const server=createServer((req,res)=>{
  received.push({url:req.url,auth:req.headers.authorization});
  if(req.url==='/api/health'){res.writeHead(302,{Location:'/unexpected'});res.end();return;}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify([{uid:'example'}]));
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const client=createApiClient({grafana:{url:`http://127.0.0.1:${server.address().port}`,token:'synthetic-local-token'}});
  assert.deepEqual(await client.grafanaRead({resource:'folders'}),[{uid:'example'}]);
  await assert.rejects(client.grafanaRead({resource:'health'}),{code:'TRANSPORT_ERROR'});
  assert.deepEqual(received,[{url:'/api/folders',auth:'Bearer synthetic-local-token'},{url:'/api/health',auth:'Bearer synthetic-local-token'}]);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
