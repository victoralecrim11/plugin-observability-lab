#!/usr/bin/env node
// Compare published Codex bytes to a freshly generated distribution.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function files(base,rel='') {
 return fs.readdirSync(path.join(base,rel),{withFileTypes:true}).flatMap(e=>{
  const name=path.join(rel,e.name);
  return e.isDirectory()?files(base,name):[name];
 }).sort();
}
const expected=path.join(root,'dist/codex/observability');
const actual=path.join(root,'packages/codex');
const names=files(expected);
if(JSON.stringify(names)!==JSON.stringify(files(actual))) throw Error('Published Codex package file inventory drift');
for(const name of names) if(!fs.readFileSync(path.join(expected,name)).equals(fs.readFileSync(path.join(actual,name)))) throw Error('Published Codex package drift: '+name);
console.log(JSON.stringify({status:'PASS',publishedFiles:names.length}));
