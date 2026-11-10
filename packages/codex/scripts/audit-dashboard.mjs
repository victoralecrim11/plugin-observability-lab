#!/usr/bin/env node
import { flags, required, readJson, writeJsonIfRequested, report, exitWithError, isRecord } from './lib.mjs';

export function auditDashboard(raw, datasourceMap) {
  const issues = [], entries=[];
  const dash = isRecord(raw.dashboard)?raw.dashboard:raw;
  if(!isRecord(dash)) return report('FAIL',['Dashboard não é objeto JSON']);
  if(typeof dash.title !== 'string' || !dash.title.trim()) issues.push('Título do dashboard ausente');
  if(typeof dash.uid !== 'string' || !dash.uid.trim()) issues.push('UID ausente; pode ser intencional apenas para criação');
  const names=new Set(); const panelIds=new Set();
  const map = isRecord(datasourceMap)?(datasourceMap.datasources||datasourceMap):null;
  const declared = map ? (Array.isArray(map) ? new Set(map.map(x=>x.uid).filter(Boolean)) : new Set(Object.keys(map))) : null;
  function explore(panels) {
    for(const p of panels||[]) {
      if(!isRecord(p)) continue;
      if(p.id !== undefined) {if(panelIds.has(p.id)) issues.push(`ID de painel duplicado: ${p.id}`); panelIds.add(p.id);}
      if(!p.title && p.type!=='row') issues.push(`Painel ${p.id??'?'} sem título`);
      const targets=Array.isArray(p.targets)?p.targets:[];
      const refs=[];
      for(const t of targets) {
        const ds=t.datasource??p.datasource??dash.datasource;
        let uid=isRecord(ds)?ds.uid:(typeof ds==='string'?ds:null);
        if(uid){refs.push(uid); if(declared && !declared.has(uid) && uid!=='-- Mixed --' && uid!=='default') issues.push(`Datasource UID não reconhecido no mapa: ${uid} (painel ${p.id??'?'})`);}
        else if(p.type!=='row') issues.push(`Datasource UID não resolvido no painel ${p.id??'?'}; verificar herança/variáveis`);
      }
      entries.push({panelId:p.id??null,title:p.title??null,type:p.type??null,targetCount:targets.length,datasourceUids:[...new Set(refs)]});
      if(Array.isArray(p.panels)) explore(p.panels);
    }
  }
  explore(dash.panels);
  for(const v of dash.templating?.list||[]) {if(v.name){if(names.has(v.name)) issues.push(`Variável duplicada: ${v.name}`);names.add(v.name);}}
  return report(issues.length?'WARN':'PASS',issues,{uid:dash.uid??null,title:dash.title??null,panelCount:entries.length,panels:entries,variables:[...names]});
}
if(process.argv[1]?.endsWith('audit-dashboard.mjs')) {
  try {const a=flags();if(a.help) {console.log('Uso: node scripts/audit-dashboard.mjs --file dashboard.json [--datasources datasources.json] [--out relatorio.json]');}
  else {const raw=readJson(required(a,'file'));const ds=a.datasources?readJson(a.datasources):undefined;const result=auditDashboard(raw,ds);writeJsonIfRequested(result,a.out); if(result.status==='FAIL') process.exitCode=1;}}
  catch(e){exitWithError(e)}
}
