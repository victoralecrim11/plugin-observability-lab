#!/usr/bin/env node
// Installs only into an ephemeral profile; no user plugin configuration is changed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const executable=process.argv[2]||'codex';
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'observability-catalog-'));
const home=path.join(fixture,'profile');
const market=path.join(fixture,'marketplace');
fs.mkdirSync(home,{recursive:true});
fs.mkdirSync(path.join(market,'.agents/plugins'),{recursive:true});
fs.cpSync(path.join(root,'packages/codex'),path.join(market,'observability'),{recursive:true});
fs.writeFileSync(path.join(market,'.agents/plugins/marketplace.json'),JSON.stringify({name:'observability-runtime-test',plugins:[{name:'observability',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,source:'./observability'}]}));
const safeEnv={OBSERVABILITY_PROFILE:path.join(fixture,'absent.json'),OBSERVABILITY_ALLOW_WRITES:'false',ZABBIX_URL:'',ZABBIX_API_TOKEN:'',GRAFANA_URL:'',GRAFANA_SERVICE_ACCOUNT_TOKEN:''};
const manifest=path.join(market,'observability','.mcp.json');
const config=JSON.parse(fs.readFileSync(manifest));
config.mcpServers['observability-api'].env=safeEnv;
fs.writeFileSync(manifest,JSON.stringify(config));
const env={...process.env,...safeEnv,CODEX_HOME:home};
function run(bin,args){
 const result=spawnSync(bin,args,{env,encoding:'utf8',windowsHide:true,timeout:60000});
 if(result.error||result.status!==0)throw Error(`Runtime command failed: ${result.error?.message||result.stderr||result.stdout}`);
 return result.stdout;
}
try {
 run(executable,['plugin','marketplace','add',market,'--json']);
 run(executable,['plugin','add','observability@observability-runtime-test','--json']);
 process.stdout.write(run(process.execPath,[path.join(root,'scripts/test-runtime-catalog.mjs'),'--codex',executable,'--home',home,'--marketplace-path',market,'--cwd',fixture]));
} finally {
 fs.rmSync(fixture,{recursive:true,force:true});
}
