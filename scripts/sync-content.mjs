#!/usr/bin/env node
// Canonical workflows are copied byte-for-byte: commands and contextual references.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const names=fs.readdirSync(path.join(root,'workflows')).filter(n=>n.endsWith('.md')).sort();
for(const rel of ['commands','skills/observability/references/workflows']) {
 const dir=path.join(root,rel);
 fs.mkdirSync(dir,{recursive:true});
 for(const name of fs.readdirSync(dir)) if(name.endsWith('.md')&&!names.includes(name)) fs.unlinkSync(path.join(dir,name));
 for(const name of names) fs.copyFileSync(path.join(root,'workflows',name),path.join(dir,name));
}
console.log(JSON.stringify({workflows:names.length,commands:names.length,contextualReferences:names.length}));
