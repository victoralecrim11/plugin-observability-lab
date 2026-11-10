import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {createMcpHandler,serveStdio} from '../scripts/mcp-server.mjs';
const message=(id,method,params)=>({jsonrpc:'2.0',id,method,...(params?{params}:{})});
test('MCP initialization, notifications and default tools require no network',async()=>{
 const handle=createMcpHandler({}, {fetchImpl:()=>{throw new Error('Unexpected network');}});
 assert.equal((await handle(message(0,'tools/list'))).error.code,-32002);
 const init=await handle(message(1,'initialize',{protocolVersion:'2024-11-05'}));
 assert.equal(init.result.protocolVersion,'2024-11-05');
 assert.equal(await handle({jsonrpc:'2.0',method:'notifications/initialized'}),null);
 const list=await handle(message(2,'tools/list'));
 assert.deepEqual(list.result.tools.map(t=>t.name),['connection_status','zabbix_read','grafana_read']);
 const status=await handle(message(3,'tools/call',{name:'connection_status'}));
 assert.equal(JSON.parse(status.result.content[0].text).networkChecked,false);
 assert.equal((await handle(message(4,'tools/call',{name:'zabbix_import_template',arguments:{}}))).error.code,-32602);
});
test('enabled write tools have destructive annotations and argument errors use isError',async()=>{
 const handle=createMcpHandler({allowWrites:true});
 assert.equal((await handle(message(1,'initialize',{protocolVersion:'unknown'}))).result.protocolVersion,'2025-06-18');
 const list=await handle(message(2,'tools/list'));
 assert.equal(list.result.tools.length,5);
 for(const tool of list.result.tools.filter(t=>t.name.includes('import'))){assert.equal(tool.annotations.destructiveHint,true);assert.equal(tool.annotations.readOnlyHint,false);}
 const result=await handle(message(3,'tools/call',{name:'grafana_import_dashboard',arguments:{}}));
 assert.equal(result.result.isError,true);assert.equal(JSON.parse(result.result.content[0].text).code,'INVALID_ARGUMENT');
});
test('stdio transport handles split frames, silent notifications and parse recovery',async()=>{
 const input=new PassThrough(),output=new PassThrough();let text='';output.on('data',chunk=>text+=chunk);
 const server=serveStdio({input,output,maxLineBytes:300});
 const first=JSON.stringify(message(1,'initialize',{protocolVersion:'2025-03-26'}));
 input.write(first.slice(0,12));input.write(first.slice(12)+'\n');
 input.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 input.write('bad json\n');
 input.write(JSON.stringify(message(2,'ping'))+'\n');
 await server.drain();
 const frames=text.trim().split('\n').map(JSON.parse);
 assert.equal(frames.length,3);assert.equal(frames[0].result.protocolVersion,'2025-03-26');assert.equal(frames[1].error.code,-32700);assert.deepEqual(frames[2].result,{});
 input.destroy();output.destroy();
});
test('stdio rejects oversized frame and recovers without logging the content',async()=>{
 const input=new PassThrough(),output=new PassThrough();let text='';output.on('data',chunk=>text+=chunk);
 const server=serveStdio({input,output,maxLineBytes:80});
 input.write('sensitive'.repeat(20));input.write('\n'+JSON.stringify(message(2,'ping'))+'\n');
 await server.drain();
 const frames=text.trim().split('\n').map(JSON.parse);
 assert.equal(frames.length,2);assert.equal(frames[0].error.code,-32600);assert.equal(frames[1].id,2);assert.ok(!text.includes('sensitive'));
 input.destroy();output.destroy();
});
