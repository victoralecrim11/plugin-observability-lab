import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const scriptDir=path.dirname(fileURLToPath(import.meta.url));
export function defaultProfilePath(env=process.env,platform=process.platform,home=os.homedir()) {
 if(env.OBSERVABILITY_PROFILE)return path.resolve(env.OBSERVABILITY_PROFILE);
 const base=platform==='win32'?(env.LOCALAPPDATA||path.join(home,'AppData','Local')):(env.XDG_CONFIG_HOME||path.join(home,'.config'));
 return path.join(base,'ObservabilityDevToolkit','connections.json');
}

async function decryptWindows(ciphertext) {
 if(process.platform!=='win32')throw Error('Perfil DPAPI requer o mesmo usuário Windows; use variáveis de ambiente neste sistema.');
 return new Promise((resolve,reject)=>{
  const executable=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  const child=spawn(executable,['-NoProfile','-NonInteractive','-File',path.join(scriptDir,'decrypt-connection-secret.ps1')],{env:{...process.env,PSModulePath:path.join(path.dirname(executable),'Modules')},windowsHide:true,stdio:['pipe','pipe','pipe']});
  let output='';let settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
  const timer=setTimeout(()=>{child.kill();finish(Error('Não foi possível desbloquear a credencial local.'));},10000);
  child.stdout.on('data',data=>{output+=data.toString('utf8');if(output.length>65536){child.kill();finish(Error('Credencial local inválida.'));}});
  child.stderr.resume();
  child.stdin.on('error',()=>{});
  child.on('error',()=>finish(Error('Não foi possível iniciar a leitura protegida da credencial.')));
  child.on('close',code=>finish(code===0?null:Error('Não foi possível desbloquear a credencial local.'),output));
  child.stdin.end(ciphertext);
 });
}

// No network calls, no persisted plaintext, no logging of endpoints or credentials.
export async function loadConnectionConfig({env=process.env,platform=process.platform,home=os.homedir(),decrypt=decryptWindows}={}) {
 let profile={};
 try {
  const text=await fs.readFile(defaultProfilePath(env,platform,home),'utf8');
  if(text.length>131072)throw Error('profile too large');
  profile=JSON.parse(text.replace(/^\uFEFF/,''));
  if(profile.version!==1||typeof profile!=='object'||Array.isArray(profile))throw Error('invalid profile');
 } catch(error) {
  if(error.code!=='ENOENT')throw Error('Perfil local inválido ou inacessível; revise a configuração sem expor credenciais.');
 }
 const config={allowWrites:false};
 for(const [system,urlKey,tokenKey] of [['zabbix','ZABBIX_URL','ZABBIX_API_TOKEN'],['grafana','GRAFANA_URL','GRAFANA_SERVICE_ACCOUNT_TOKEN']]) {
  const url=env[urlKey];const token=env[tokenKey];
  // Never pair a new endpoint with a token from a different source/profile.
  if(url||token){
   if(!url||!token)throw Error('Configuração incompleta: URL e token devem ser fornecidos juntos para '+system+'.');
   config[system]={url,token};continue;
  }
  const entry=profile[system];
  if(!entry)continue;
  if(typeof entry.url!=='string'||!entry.url||typeof entry.tokenDpapi!=='string'||!entry.tokenDpapi)throw Error('Conexão local incompleta para '+system+'.');
  if(platform!=='win32')throw Error('Perfil DPAPI requer Windows; configure as variáveis de ambiente.');
  const secret=await decrypt(entry.tokenDpapi);
  if(!secret||/[\r\n]/.test(secret))throw Error('Credencial local inválida para '+system+'.');
  config[system]={url:entry.url,token:secret};
 }
 if(env.OBSERVABILITY_ALLOW_WRITES!==undefined&&env.OBSERVABILITY_ALLOW_WRITES!=='') {
  if(!['true','false'].includes(env.OBSERVABILITY_ALLOW_WRITES))throw Error('OBSERVABILITY_ALLOW_WRITES deve ser true ou false.');
  config.allowWrites=env.OBSERVABILITY_ALLOW_WRITES==='true';
 } else config.allowWrites=profile.allowWrites===true;
 return config;
}
