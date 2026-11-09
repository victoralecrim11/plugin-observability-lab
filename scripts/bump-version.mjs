#!/usr/bin/env node
/**
 * Sincroniza a versão do plugin entre package.json, manifestos, marketplaces,
 * metadados de build e frontmatter de skills.
 * Uso: node scripts/bump-version.mjs patch|minor|major|--check
 * Não executa git commit/push; o mantenedor revisa o diff.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv[2] || '--check';
const pathAt=(p)=>path.join(root,p);
const get=(p)=>JSON.parse(fs.readFileSync(pathAt(p),'utf8'));
const write=(p,j)=>fs.writeFileSync(pathAt(p),JSON.stringify(j,null,2)+'\n','utf8');
const pkg=get('package.json');
const current=pkg.version;
const match=/^(\d+)\.(\d+)\.(\d+)$/.exec(current);
if(!match)throw Error('Versão não é semver: '+current);
const [major,minor,patch]=match.slice(1).map(Number);
const version=mode==='patch'?[major,minor,patch+1].join('.'):
  mode==='minor'?[major,minor+1,0].join('.'):
  mode==='major'?[major+1,0,0].join('.'):
  mode==='--check'?current:null;
if(!version)throw Error('Uso: node scripts/bump-version.mjs patch|minor|major|--check');

const targets=[
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  'BUILD-INFO.json'
];
let updates=0,fail=0;
for(const file of targets){
  const obj=get(file);
  const versions=[];
  if(Object.hasOwn(obj,'version'))versions.push(obj.version);
  if(Array.isArray(obj.plugins))for(const entry of obj.plugins){
    if(Object.hasOwn(entry,'version'))versions.push(entry.version);
  }
  if(mode==='--check'){
    for(const v of versions)if(v!==version){console.error(file+': '+v+' != '+version);fail++;}
  }else{
    if(Object.hasOwn(obj,'version'))obj.version=version;
    if(Array.isArray(obj.plugins))for(const entry of obj.plugins)entry.version=version;
    write(file,obj);updates++;
  }
}
for(const dirName of ['skills','codex-skills']){
  const base=pathAt(dirName);
  if(!fs.existsSync(base))continue;
  for(const entry of fs.readdirSync(base,{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    const f=path.join(base,entry.name,'SKILL.md');
    if(!fs.existsSync(f))continue;
    const text=fs.readFileSync(f,'utf8');
    const rx=/(metadata:\s*\r?\n\s*version:\s*")([^"]+)(")/;
    const m=rx.exec(text);
    if(!m)continue;
    if(mode==='--check'){
      if(m[2]!==version){console.error(path.relative(root,f)+': '+m[2]+' != '+version);fail++;}
    }else{
      fs.writeFileSync(f,text.replace(rx,(_,a,old,c)=>a+version+c),'utf8');
      updates++;
    }
  }
}
if(mode!=='--check'){
  pkg.version=version;
  write('package.json',pkg);
  updates++;
}
console.log(JSON.stringify({mode,version,filesUpdated:updates,errors:fail}));
if(fail)process.exitCode=1;
