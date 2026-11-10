#!/usr/bin/env node
// Minimal stdio MCP server. stdout is reserved for protocol responses.
import {pathToFileURL} from 'node:url';
import {createApiClient,ApiError,READ_METHODS,GRAFANA_RESOURCES} from './mcp-api-client.mjs';
const schema=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const readAnnotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true};
const writeAnnotations={readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:true};
export function toolDefinitions(allowWrites=false){
 const tools=[
  {name:'connection_status',description:'Report configured connections without URLs or credentials. Does not contact servers or prove authentication.',inputSchema:schema(),annotations:{...readAnnotations,openWorldHint:false}},
  {name:'zabbix_read',description:'Read allowlisted Zabbix API resources with persistent token authentication. Export is JSON and explicit template IDs only. Output is redacted and is not a restorable secret-complete backup.',inputSchema:schema({method:{type:'string',enum:READ_METHODS},params:{type:'object'}},['method']),annotations:readAnnotations},
  {name:'grafana_read',description:'Read Grafana health, dashboards, search, datasources or folders. Output is redacted; do not treat it as a complete backup.',inputSchema:schema({resource:{type:'string',enum:GRAFANA_RESOURCES},uid:{type:'string'},query:{type:'string'}},['resource']),annotations:readAnnotations}
 ];
 if(allowWrites)tools.push(
  {name:'zabbix_import_template',description:'WRITE: import a reviewed JSON template export. Requires prior approval for this exact payload, destination and effects on linked hosts. No deletions. Use the import workflow; prepare a complete authorized backup outside this redacted read channel before updating existing objects.',inputSchema:schema({source:{type:'object'},rules:{type:'object'}},['source','rules']),annotations:writeAnnotations},
  {name:'grafana_import_dashboard',description:'WRITE: save a reviewed Grafana 12 dashboard model. Requires prior approval, explicit destination folder and resolved datasources/inputs. For update, prepare a complete authorized backup, preserve destination UID/version and review conflicts.',inputSchema:schema({dashboard:{type:'object'},folderUid:{type:'string'},rootFolder:{type:'boolean'},overwrite:{type:'boolean',default:false}},['dashboard','folderUid']),annotations:writeAnnotations}
 );
 return tools;
}

export function createMcpHandler(config={},options={}){
 const client=createApiClient(config,options);let initialized=false;
 const versions=['2024-11-05','2025-03-26','2025-06-18'];
 const error=(id,code,message)=>({jsonrpc:'2.0',id, error:{code,message}});
 return async message=>{
  if(!message||typeof message!=='object'||Array.isArray(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string')return error(message?.id??null,-32600,'Invalid Request');
  if(!Object.hasOwn(message,'id'))return null;
  const id=message.id;
  if(typeof id!=='string'&&typeof id!=='number')return error(null,-32600,'Invalid request ID');
  const result=value=>({jsonrpc:'2.0',id,result:value});
  if(message.method==='initialize'){
   initialized=true;
   return result({protocolVersion:versions.includes(message.params?.protocolVersion)?message.params.protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'observability-api',version:'1.0.0'},instructions:'Use configured API access before browser login. Read-only unless explicitly enabled locally; enabled writes still require user/host authorization. Redacted reads are not complete backups. Never infer that credentials authorize changes.'});
  }
  if(message.method==='ping')return result({});
  if(!initialized)return error(id,-32002,'Initialize the server first');
  if(message.method==='tools/list')return result({tools:toolDefinitions(config.allowWrites===true)});
  if(message.method!=='tools/call')return error(id,-32601,'Method not found');
  const name=message.params?.name;
  const tool=toolDefinitions(config.allowWrites===true).find(t=>t.name===name);
  if(!tool)return error(id,-32602,'Unknown or disabled tool');
  try{
   const args=message.params?.arguments??{};
   if(!args||typeof args!=='object'||Array.isArray(args))throw new ApiError('INVALID_ARGUMENT','Arguments must be an object');
   if(name==='connection_status'&&Object.keys(args).length)throw new ApiError('INVALID_ARGUMENT','No arguments accepted');
   const value=name==='connection_status'?client.status():await ({zabbix_read:client.zabbixRead,grafana_read:client.grafanaRead,zabbix_import_template:client.importTemplate,grafana_import_dashboard:client.importDashboard})[name](args);
   return result({content:[{type:'text',text:JSON.stringify(value)}],isError:false});
  }catch(err){
   return result({content:[{type:'text',text:JSON.stringify({code:err instanceof ApiError?err.code:'INTERNAL_ERROR',message:err instanceof ApiError?err.message:'Operation failed; no details logged'})}],isError:true});
  }
 };
}

export function serveStdio({config={},input=process.stdin,output=process.stdout,options={},maxLineBytes=4*1024*1024}={}){
 const handle=createMcpHandler(config,options);let pending=Buffer.alloc(0),queue=Promise.resolve(),discard=false;
 const send=response=>{if(response)output.write(JSON.stringify(response)+'\n');};
 input.on('data',chunk=>{
  const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
  let start=0;
  for(let i=0;i<bytes.length;i++)if(bytes[i]===10){
   const part=bytes.subarray(start,i);start=i+1;
   if(!discard&&pending.length+part.length<=maxLineBytes){
    const line=Buffer.concat([pending,part]).toString('utf8');
    if(line.trim())queue=queue.then(async()=>{let parsed;try{parsed=JSON.parse(line);}catch{send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}});return;}send(await handle(parsed));}).catch(()=>send({jsonrpc:'2.0',id:null,error:{code:-32603,message:'Internal error'}}));
   }else if(!discard)send({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Request exceeds size limit'}});
   pending=Buffer.alloc(0);discard=false;
  }
  const tail=bytes.subarray(start);
  if(!discard){if(pending.length+tail.length>maxLineBytes){pending=Buffer.alloc(0);discard=true;send({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Request exceeds size limit'}});}else pending=Buffer.concat([pending,tail]);}
 });
 return {drain:()=>queue};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const {loadConnectionConfig}=await import('./connection-profile.mjs');
  serveStdio({config:await loadConnectionConfig()});
 }catch{
  process.stderr.write('Observability connection profile could not be loaded. Check the local setup; no credentials were logged.\n');
  process.exitCode=1;
 }
}
