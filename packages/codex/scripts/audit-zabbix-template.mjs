#!/usr/bin/env node
import fs from 'node:fs';
import { flags, required, writeJsonIfRequested, report, exitWithError } from './lib.mjs';

export function auditTemplate(text) {
  const issues=[];
  if(!/^\s*zabbix_export\s*:/m.test(text)) issues.push('Chave raiz zabbix_export ausente');
  const ver=text.match(/^\s{2}version:\s*['"]?([^'"\s#]+)/m)?.[1]??null;
  if(!ver) issues.push('Versão do arquivo exportado não identificada');
  else if(!ver.startsWith('7.4')) issues.push(`Versão de export ${ver}; alvo esperado 7.4 (exige confirmação)`);
  const hasTemplates=/^\s{2}(templates|hosts):\s*$/m.test(text);
  if(!hasTemplates) issues.push('Não localizei seção templates/hosts (heurística textual)');
  const plainSecret=/^\s*(?:token|password|api[_-]?key|secret):\s*(?!\$|['"]?\{|['"]?$)[^\n#]+/im.test(text);
  if(plainSecret) issues.push('Possível segredo literal em campo sensível; rever antes de compartilhar');
  return report(issues.length?'WARN':'PASS',issues,{exportVersion:ver,lines:text.split(/\r?\n/).length,format:'Verificação textual heurística; NÃO é parser YAML nem teste de importação Zabbix'});
}
if(process.argv[1]?.endsWith('audit-zabbix-template.mjs')){
  try{const a=flags();if(a.help)console.log('Uso: node scripts/audit-zabbix-template.mjs --file template.yaml [--out auditoria.json]'); else {const v=auditTemplate(fs.readFileSync(required(a,'file'),'utf8'));writeJsonIfRequested(v,a.out)}}catch(e){exitWithError(e)}
}
