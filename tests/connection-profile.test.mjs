import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadConnectionConfig,defaultProfilePath} from '../scripts/connection-profile.mjs';

async function fixture(run) {
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'observability-profile-'));
 const profile=path.join(dir,'connections.json');
 try {await run(profile);} finally {await fs.rm(dir,{recursive:true,force:true});}
}
test('unconfigured profile is offline and read-only',()=>fixture(async profile=>{
 assert.deepEqual(await loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile}}),{allowWrites:false});
}));
test('environment auth requires complete pair and never mixes a destination with another token',()=>fixture(async profile=>{
 await fs.writeFile(profile,JSON.stringify({version:1,zabbix:{url:'https://old.example/api_jsonrpc.php',tokenDpapi:'cipher'}}));
 await assert.rejects(loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile,ZABBIX_URL:'https://new.example/api_jsonrpc.php'},decrypt:()=>assert.fail('should not decrypt')}),/incompleta/);
 const config=await loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile,ZABBIX_URL:'https://new.example/api_jsonrpc.php',ZABBIX_API_TOKEN:'synthetic'},decrypt:()=>assert.fail('should not decrypt')});
 assert.equal(config.zabbix.token,'synthetic');assert.equal(config.allowWrites,false);
}));
test('write flag must be explicit, boolean and can be disabled by environment',()=>fixture(async profile=>{
 await fs.writeFile(profile,JSON.stringify({version:1,allowWrites:true}));
 assert.equal((await loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile,OBSERVABILITY_ALLOW_WRITES:'false'}})).allowWrites,false);
 await assert.rejects(loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile,OBSERVABILITY_ALLOW_WRITES:'yes'}}),/true ou false/);
}));
test('malformed or foreign protected profiles fail without disclosing their contents',()=>fixture(async profile=>{
 await fs.writeFile(profile,'secret-sentinel-invalid-json');
 await assert.rejects(loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile}}),error=>!error.message.includes('sentinel')&&/inválido/.test(error.message));
 await fs.writeFile(profile,JSON.stringify({version:1,zabbix:{url:'https://zabbix.example/api_jsonrpc.php',tokenDpapi:'cipher'}}));
 await assert.rejects(loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile},platform:'linux'}),/DPAPI requer Windows/);
}));
test('user profile lives outside plugin checkout and follows the selected profile',()=>{
 assert.equal(defaultProfilePath({LOCALAPPDATA:'C:/test-local'},'win32','C:/test-home'),path.join('C:/test-local','ObservabilityDevToolkit','connections.json'));
 assert.equal(defaultProfilePath({OBSERVABILITY_PROFILE:'custom.json'}),path.resolve('custom.json'));
});
test('Windows DPAPI roundtrip with a synthetic token', {skip:process.platform!=='win32'},()=>fixture(async profile=>{
 const powershell=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
 const cipher=execFileSync(powershell,['-NoProfile','-NonInteractive','-Command',"ConvertFrom-SecureString (ConvertTo-SecureString 'synthetic-roundtrip-token' -AsPlainText -Force)"],{env:{...process.env,PSModulePath:path.join(path.dirname(powershell),'Modules')},encoding:'utf8',windowsHide:true}).trim();
 await fs.writeFile(profile,JSON.stringify({version:1,zabbix:{url:'https://zabbix.example/api_jsonrpc.php',tokenDpapi:cipher}}));
 const config=await loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile}});
 assert.equal(config.zabbix.token,'synthetic-roundtrip-token');
 assert.equal((await fs.readFile(profile,'utf8')).includes('synthetic-roundtrip-token'),false);
}));

test('Windows wizard creates and atomically replaces an isolated protected profile', {skip:process.platform!=='win32'},()=>fixture(async temporaryProfile=>{
 const directory=path.dirname(temporaryProfile);
 const wrapper=path.join(directory,'wizard-fixture.ps1');
 const wizard=fileURLToPath(new URL('../scripts/configurar-conexoes.ps1',import.meta.url));
 const powershell=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
 await fs.writeFile(wrapper,`
$ErrorActionPreference = 'Stop'
$global:fixtureAnswers = [Collections.Generic.Queue[string]]::new()
if ($env:FIXTURE_REPLACE -eq 'true') { $global:fixtureAnswers.Enqueue('SIM') }
$global:fixtureAnswers.Enqueue('https://zabbix.example/api_jsonrpc.php')
$global:fixtureAnswers.Enqueue($env:FIXTURE_TOKEN)
$global:fixtureAnswers.Enqueue('https://grafana.example/grafana')
$global:fixtureAnswers.Enqueue($env:FIXTURE_TOKEN)
function Read-Host {
    param([string]$Prompt, [switch]$AsSecureString)
    $answer = $global:fixtureAnswers.Dequeue()
    if ($AsSecureString) { return ConvertTo-SecureString $answer -AsPlainText -Force }
    return $answer
}
if ($env:FIXTURE_REPLACE -eq 'true') {
    $existing = Join-Path $env:LOCALAPPDATA 'ObservabilityDevToolkit/connections.json'
    $existingAcl = [IO.File]::GetAccessControl($existing)
    $everyone = [Security.Principal.SecurityIdentifier]::new('S-1-1-0')
    $existingAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($everyone,'Read','Allow'))
    [IO.File]::SetAccessControl($existing,$existingAcl)
    & $env:FIXTURE_WIZARD -PermitirImportacoes
}
else { & $env:FIXTURE_WIZARD }
if ($global:fixtureAnswers.Count -ne 0) { throw 'Wizard did not consume the expected fixture answers' }
$file = Join-Path $env:LOCALAPPDATA 'ObservabilityDevToolkit/connections.json'
$acl = [IO.File]::GetAccessControl($file)
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
if (-not $acl.AreAccessRulesProtected) { throw 'Profile ACL is not protected' }
if ($acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]).Count -ne 1) { throw 'Expected one current-user access rule' }
foreach ($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])) {
    if ($rule.IdentityReference.Value -ne $sid) { throw 'Unexpected profile ACL principal' }
}
`, 'utf8');
 const profile=path.join(directory,'ObservabilityDevToolkit','connections.json');
 for(const replace of [false,true]){
  const token=replace?'synthetic-replacement-token':'synthetic-initial-token';
  execFileSync(powershell,['-NoProfile','-NonInteractive','-File',wrapper],{
   env:{...process.env,PSModulePath:path.join(path.dirname(powershell),'Modules'),LOCALAPPDATA:directory,OBSERVABILITY_PROFILE:'',FIXTURE_WIZARD:wizard,FIXTURE_REPLACE:String(replace),FIXTURE_TOKEN:token},
   encoding:'utf8',windowsHide:true,timeout:15000
  });
  const loaded=await loadConnectionConfig({env:{OBSERVABILITY_PROFILE:profile}});
  assert.equal(loaded.zabbix.token,token);
  assert.equal(loaded.grafana.token,token);
  assert.equal(loaded.allowWrites,replace);
  const saved=await fs.readFile(profile,'utf8');
  assert.equal(saved.includes(token),false);
  assert.deepEqual(await fs.readdir(path.dirname(profile)),['connections.json']);
 }
}));
