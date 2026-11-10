#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv;
const ix=args.indexOf('--path');
const root=path.resolve(ix>=0 ? (args[ix+1]||'.') : '.');
const allowExt=/\.(md|json|mjs|js|ts|yaml|yml|txt|csv|example)$/i;
const skipDirs=new Set(['.git','node_modules','dist','.next','.cache']);
const decoded=[
'6669656d67','70726f7468657573','746f747673','676f6275796572',
'706f7274616c636f6d70726173','6c67',
'7a6162626978617673','766d2d6272','63616e64696461746f',
'6c756761722064652067656e7465'
].map(hex=>Buffer.from(hex,'hex').toString('utf8'));
const escape=s=>s.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
const names=new RegExp('(?:^|[^a-z0-9])(?:'+decoded.map(escape).join('|')+')(?:$|[^a-z0-9])','i');
const ip=/(?:^|[^\d])(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})(?:$|[^\d])/;
const key=/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|(?:sk-proj-|ghp_)[a-z0-9]{16,}/i;
let checked=0;
const violations=[];
function scan(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.isDirectory() && skipDirs.has(e.name))continue;
  const file=path.join(dir,e.name);
  const rel=path.relative(root,file).replace(/\\/g,'/');
  if(e.isDirectory()){scan(file);continue}
  if(!allowExt.test(e.name))continue;
  if(rel==='scripts/security-scan.mjs')continue;
  checked++;
  const data=fs.readFileSync(file,'utf8');
  if(names.test(rel)||names.test(data))violations.push({file:rel,rule:'corporate-identifier'});
  if(ip.test(data))violations.push({file:rel,rule:'private-ip'});
  if(key.test(data))violations.push({file:rel,rule:'credential-pattern'});
 }
}
scan(root);
console.log(JSON.stringify({status:violations.length?'FAIL':'PASS',checked,violations},null,2));
if(violations.length)process.exitCode=1;
