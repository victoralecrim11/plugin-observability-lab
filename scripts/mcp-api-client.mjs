// Small, allowlisted API adapter. No credentials or remote data are persisted.
export class ApiError extends Error {
 constructor(code,message){super(message);this.code=code;}
}
const reject=(message='Invalid arguments')=>{throw new ApiError('INVALID_ARGUMENT',message);};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,allowed)=>{if(!object(x)||Object.keys(x).some(k=>!allowed.includes(k)))reject();};
export const READ_METHODS=['apiinfo.version','template.get','host.get','item.get','trigger.get','hostgroup.get','templategroup.get','configuration.export'];
export const GRAFANA_RESOURCES=['health','search','dashboard','datasources','folders'];
const ruleFlags={template_groups:['createMissing','updateExisting'],templates:['createMissing','updateExisting'],items:['createMissing','updateExisting','deleteMissing'],discoveryRules:['createMissing','updateExisting','deleteMissing'],triggers:['createMissing','updateExisting','deleteMissing'],graphs:['createMissing','updateExisting','deleteMissing'],valueMaps:['createMissing','updateExisting','deleteMissing'],httptests:['createMissing','updateExisting','deleteMissing'],templateLinkage:['createMissing','deleteMissing']};

export function validateEndpoint(value,system){
 let url;try{url=new URL(value);}catch{throw new ApiError('CONFIG_INVALID','Invalid connection URL');}
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.protocol!=='https:'&&!(url.protocol==='http:'&&local))||url.username||url.password||url.hash||url.search)throw new ApiError('CONFIG_INVALID','Connection requires HTTPS (HTTP permitted only for loopback), without URL credentials, query or fragment');
 if(system==='zabbix'&&!url.pathname.endsWith('/api_jsonrpc.php'))throw new ApiError('CONFIG_INVALID','Zabbix requires the explicit api_jsonrpc.php endpoint');
 return url;
}

export function redact(value,tokens=[]){
 if(typeof value==='string'){
  let result=value;
  for(const token of tokens.filter(t=>typeof t==='string'&&t.length))result=result.split(token).join('[REDACTED]');
  // Export endpoints may return serialized JSON, not an object.
  if(result.trim().startsWith('{')||result.trim().startsWith('[')){
   try{return JSON.stringify(redact(JSON.parse(result),tokens));}catch{}
  }
  return result;
 }
 if(Array.isArray(value))return value.map(v=>redact(v,tokens));
 if(object(value))return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,
  /password|passwd|secret|token|authorization|cookie|credential|api.?key/i.test(key)||(key==='value'&&Object.hasOwn(value,'macro'))?'[REDACTED]':redact(v,tokens)]));
 return value;
}

async function responseJson(response,maxBytes){
 const length=Number(response.headers?.get?.('content-length'));
 if(length>maxBytes)throw new ApiError('RESPONSE_TOO_LARGE','Response exceeds the configured limit');
 let text='';
 if(response.body?.getReader){
  const reader=response.body.getReader();let bytes=0;const chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes){await reader.cancel();throw new ApiError('RESPONSE_TOO_LARGE','Response exceeds the configured limit');}chunks.push(value);}}
  finally{reader.releaseLock();}
  text=Buffer.concat(chunks).toString('utf8');
 }else {text=await response.text();if(Buffer.byteLength(text)>maxBytes)throw new ApiError('RESPONSE_TOO_LARGE','Response exceeds the configured limit');}
 try{return JSON.parse(text);}catch{throw new ApiError('INVALID_RESPONSE','Remote service did not return valid JSON');}
}

export function createApiClient(config={},options={}){
 const fetchImpl=options.fetchImpl||globalThis.fetch;
 const timeoutMs=options.timeoutMs??15000;
 const maxBytes=options.maxBytes??4*1024*1024;
 const tokens=[config.zabbix?.token,config.grafana?.token];
 let sequence=0;
 function connection(system){
  const entry=config[system];
  if(!entry?.url||!entry?.token)throw new ApiError('NOT_CONFIGURED',`${system} connection is not configured`);
  if(typeof entry.token!=='string'||/[\r\n]/.test(entry.token))throw new ApiError('CONFIG_INVALID','Invalid connection credential');
  return {url:validateEndpoint(entry.url,system),token:entry.token};
 }
 async function request(system,route,body,authenticate=true){
  const entry=connection(system);
  const url=route?new URL(entry.url.toString().replace(/\/$/,'')+route):entry.url;
  const headers={'Accept':'application/json'};
  if(authenticate)headers.Authorization=`Bearer ${entry.token}`;
  if(body!==undefined)headers['Content-Type']='application/json';
  const encoded=body===undefined?undefined:JSON.stringify(body);
  if(encoded&&Buffer.byteLength(encoded)>maxBytes)reject('Request exceeds the configured limit');
  try{
   const response=await fetchImpl(url,{method:body===undefined?'GET':'POST',headers,body:encoded,redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
   if(!response.ok){await response.body?.cancel?.();throw new ApiError('HTTP_ERROR',`Remote service returned HTTP ${Number(response.status)||0}; verify permissions and connection`);}
   return await responseJson(response,maxBytes);
  }catch(error){
   if(error instanceof ApiError)throw error;
   throw new ApiError('TRANSPORT_ERROR','Connection failed or timed out; verify network, TLS and credentials. No automatic retry was performed');
  }
 }
 async function zabbix(method,params){
  const id=++sequence;
  const data=await request('zabbix',null,{jsonrpc:'2.0',method,params,id},method!=='apiinfo.version');
  if(!object(data)||data.id!==id||data.jsonrpc!=='2.0')throw new ApiError('INVALID_RESPONSE','Invalid Zabbix response');
  if(data.error)throw new ApiError('ZABBIX_ERROR','Zabbix rejected the request; verify method permissions and parameters');
  if(!Object.hasOwn(data,'result'))throw new ApiError('INVALID_RESPONSE','Zabbix result is missing');
  return redact(data.result,tokens);
 }
 function writes(){if(config.allowWrites!==true)throw new ApiError('READ_ONLY','Writes are disabled in the local connection profile');}
 return {
  status(){return {zabbix:{configured:Boolean(config.zabbix?.url&&config.zabbix?.token)},grafana:{configured:Boolean(config.grafana?.url&&config.grafana?.token)},writeToolsEnabled:config.allowWrites===true,networkChecked:false};},
  async zabbixRead(args){
   keys(args,['method','params']);if(!READ_METHODS.includes(args.method))reject('Unsupported read method');
   const params=args.params??{};if(!object(params))reject();
   if(args.method==='apiinfo.version'&&Object.keys(params).length)reject();
   if(args.method==='configuration.export'){
    keys(params,['format','options']);keys(params.options,['templates']);
    if(params.format!=='json'||!Array.isArray(params.options.templates)||!params.options.templates.length||params.options.templates.some(id=>!/^\d+$/.test(String(id))))reject('Export requires JSON and explicit template IDs');
   }
   return zabbix(args.method,params);
  },
  async grafanaRead(args){
   keys(args,['resource','uid','query']);if(!GRAFANA_RESOURCES.includes(args.resource))reject('Unsupported read resource');
   const routes={health:'/api/health',search:'/api/search',dashboard:'/api/dashboards/uid/',datasources:'/api/datasources',folders:'/api/folders'};
   let route=routes[args.resource];
   if(args.resource==='dashboard'){if(typeof args.uid!=='string'||!/^[-\w]{1,128}$/.test(args.uid))reject('A valid dashboard UID is required');route+=encodeURIComponent(args.uid);}
   else if(args.uid!==undefined)reject();
   if(args.query!==undefined){if(args.resource!=='search'||typeof args.query!=='string'||args.query.length>500)reject();route+='?'+new URLSearchParams({query:args.query});}
   return redact(await request('grafana',route),tokens);
  },
  async importTemplate(args){
   writes();keys(args,['source','rules']);keys(args.source,['zabbix_export']);
   const model=args.source.zabbix_export;
   keys(model,['version','date','template_groups','templates','triggers','graphs']);
   if(typeof model.version!=='string'||!Array.isArray(model.templates)||!model.templates.length||model.templates.some(t=>!object(t)||typeof t.template!=='string'||!t.template.trim()))reject('Template import requires a JSON zabbix_export with version and templates');
   keys(args.rules,Object.keys(ruleFlags));let changes=false;
   for(const [kind,flags] of Object.entries(args.rules)){
    keys(flags,ruleFlags[kind]);
    for(const [flag,value] of Object.entries(flags)){if(typeof value!=='boolean'||(flag==='deleteMissing'&&value))reject('Delete-missing is not supported');if(value)changes=true;}
   }
   if(!changes||(!args.rules.templates?.createMissing&&!args.rules.templates?.updateExisting))reject('Explicit template create/update rules are required');
   return zabbix('configuration.import',{format:'json',source:JSON.stringify(args.source),rules:args.rules});
  },
  async importDashboard(args){
   writes();keys(args,['dashboard','folderUid','rootFolder','overwrite']);
   const model=args.dashboard;
   if(!object(model)||typeof model.title!=='string'||!model.title.trim()||!Array.isArray(model.panels))reject('Dashboard requires title and panels');
   if(model.__inputs!==undefined&&(!Array.isArray(model.__inputs)||model.__inputs.length))reject('Resolve dashboard inputs before importing');
   if(typeof args.folderUid!=='string'||(args.folderUid!==''&&!/^[-\w]{1,128}$/.test(args.folderUid)))reject('An explicit destination folder UID is required');
   if(args.folderUid===''&&args.rootFolder!==true)reject('Root folder must be selected explicitly');
   if(args.rootFolder!==undefined&&typeof args.rootFolder!=='boolean')reject();
   if(args.overwrite!==undefined&&typeof args.overwrite!=='boolean')reject();
   if(args.overwrite===true&&(!/^[-\w]{1,128}$/.test(model.uid||'')||!Number.isInteger(model.version)||model.version<1))reject('Update requires the current destination UID and version');
   if(args.overwrite!==true&&model.id!=null)reject('New dashboards must not reuse a numeric source ID');
   if(args.overwrite!==true&&model.version!==undefined&&model.version!==0)reject('New dashboards must omit version or use zero; updates require explicit overwrite');
   return redact(await request('grafana','/api/dashboards/db',{dashboard:model,folderUid:args.folderUid,overwrite:args.overwrite===true}),tokens);
  }
 };
}
