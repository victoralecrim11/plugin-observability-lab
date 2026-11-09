#!/usr/bin/env node
import fs from 'node:fs';
import { flags, required, writeJsonIfRequested, report, exitWithError } from './lib.mjs';

export function parseCsv(source){
  const clean=source.replace(/^\uFEFF/,'');
  const first=clean.split(/\r?\n/,1)[0]||'';
  const delim=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
  const rows=[],row=[];let field='',quoted=false;
  for(let i=0;i<clean.length;i++){
    const c=clean[i],next=clean[i+1];
    if(c==='"'){if(quoted && next==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===delim&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&next==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push([...row]);row.length=0;field='';}
    else field+=c;
  }
  if(quoted)throw new Error('CSV com aspas não fechadas');
  row.push(field);if(row.some(x=>x.trim()))rows.push([...row]);
  return rows;
}
export function planRenames(csv){
  const rows=parseCsv(csv),errors=[],changes=[],skipped=[];
  if(rows.length<2) return report('FAIL',['CSV precisa de cabeçalho e linhas']);
  const head=rows[0].map(x=>x.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s-]/g,'_'));
  const idx=(...names)=>head.findIndex(x=>names.includes(x));
  const idCol=idx('hostid','id'), hostCol=idx('host','nome_tecnico','technical_host'), oldCol=idx('visible_name','nome_visivel','nome_atual','old_name'), newCol=idx('new_visible_name','novo_nome','novo_nome_visivel','new_name'), roleCol=idx('funcao','funcao_servidor','role');
  if(idCol<0 || hostCol<0 || (newCol<0&&roleCol<0))return report('FAIL',['Colunas obrigatórias: hostid, host e (new_visible_name ou funcao)']);
  const seenId=new Set(),seenName=new Map();
  rows.slice(1).forEach((r,i)=>{
    const n=i+2,id=(r[idCol]||'').trim(),host=(r[hostCol]||'').trim(),old=(r[oldCol]||'').trim();
    const newName=newCol>=0?(r[newCol]||'').trim():`${(r[roleCol]||'').trim().toUpperCase()} - ${host}`;
    if(!/^\d+$/.test(id) || !host || !newName){errors.push(`Linha ${n}: hostid, host técnico ou novo nome inválido`);return;}
    if(seenId.has(id)){errors.push(`Linha ${n}: hostid duplicado`);return;} seenId.add(id);
    if(seenName.has(newName)){errors.push(`Linha ${n}: visible name duplicado (${newName})`);return;}seenName.set(newName,n);
    if(old===newName){skipped.push({line:n,hostid:id,reason:'Sem alteração'});return;}
    changes.push({line:n,hostid:id,technicalHost:host,previousVisibleName:old||null,nextVisibleName:newName});
  });
  return report(errors.length?'FAIL':'PASS',errors,{mode:'DRY_RUN_ONLY',changes,skipped, count:changes.length, rollback:'Restaurar previousVisibleName por hostid; exigir inventário da API antes de executar'});
}
if(process.argv[1]?.endsWith('plan-host-renames.mjs')){
  try{const a=flags();if(a.help)console.log('Uso: node scripts/plan-host-renames.mjs --file hosts.csv [--out plano.json]'); else {const file=required(a,'file');if(/\.xlsx?$/i.test(file))throw new Error('XLSX precisa ser exportado para CSV UTF-8 antes de usar esta ferramenta zero-dependências');const result=planRenames(fs.readFileSync(file,'utf8'));writeJsonIfRequested(result,a.out);if(result.status==='FAIL')process.exitCode=1;}}
  catch(e){exitWithError(e)}
}
