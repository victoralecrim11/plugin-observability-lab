#!/usr/bin/env node
import { flags, required, readJson, writeJsonIfRequested, report, exitWithError, isRecord } from './lib.mjs';
const esc =s=>String(s).replaceAll('~','~0').replaceAll('/','~1');
export function diffJson(before,after,base=''){
  if(JSON.stringify(before)===JSON.stringify(after)) return [];
  if(isRecord(before)&&isRecord(after)){
    const keys=new Set([...Object.keys(before),...Object.keys(after)]);const items=[];
    for(const k of [...keys].sort()) {
      const path=`${base}/${esc(k)}`;
      if(!(k in before)) items.push({op:'added',path});
      else if(!(k in after)) items.push({op:'removed',path});
      else items.push(...diffJson(before[k],after[k],path));
    }
    return items;
  }
  if(Array.isArray(before)&&Array.isArray(after)){
    const items=[];
    for(let i=0;i<Math.max(before.length,after.length);i++){
      const path=`${base}/${i}`;
      if(i>=before.length)items.push({op:'added',path});
      else if(i>=after.length)items.push({op:'removed',path});
      else items.push(...diffJson(before[i],after[i],path));
    }
    return items;
  }
  return [{op:'changed',path:base||'/'}];
}
if(process.argv[1]?.endsWith('diff-json.mjs')){
  try{const a=flags();if(a.help)console.log('Uso: node scripts/diff-json.mjs --before antes.json --after depois.json [--out diff.json]'); else {const changes=diffJson(readJson(required(a,'before')),readJson(required(a,'after')));writeJsonIfRequested(report('PASS',[],{changeCount:changes.length,changes, note:'Valores omitidos intencionalmente para não expor credenciais'}),a.out)}}catch(e){exitWithError(e)}
}
