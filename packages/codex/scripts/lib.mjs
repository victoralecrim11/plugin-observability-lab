import fs from 'node:fs';

export function flags(args = process.argv.slice(2)) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) throw new Error(`Argumento não reconhecido: ${a}`);
    const key = a.slice(2);
    if (key === 'help') {result.help = true; continue;}
    const next = args[i+1];
    if (!next || next.startsWith('--')) result[key] = true;
    else {result[key] = next; i++;}
  }
  return result;
}
export function required(options,key) {
  if(typeof options[key] !== 'string') throw new Error(`Parâmetro obrigatório: --${key} <arquivo>`);
  return options[key];
}
export function readJson(path) {return JSON.parse(fs.readFileSync(path,'utf8'));}
export function writeJsonIfRequested(data,path) {
  if (path) fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
  else process.stdout.write(JSON.stringify(data,null,2)+'\n');
}
export function report(status,issues=[],details={}) {
  return {status, issues, details, disclaimer:'Validação offline; nenhuma API remota foi chamada e nenhuma alteração foi efetuada.'};
}
export function exitWithError(e) {
  process.stderr.write(`ERRO: ${e.message}\n`);
  process.exitCode=1;
}
export function isRecord(v) { return v !== null && typeof v==='object' && !Array.isArray(v); }
