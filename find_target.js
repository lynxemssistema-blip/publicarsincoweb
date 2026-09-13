const fs = require('fs');
const file = 'frontend/src/pages/OrdemServico.tsx';
const content = fs.readFileSync(file, 'utf8');
const regex1 = /<Layers size=\{14\} \/>[\s\S]*?<\/(?:div|button)>[\s\S]*?\)\}/;
const m = content.match(regex1);
if (m) console.log("Found match at", m.index);
else console.log("Still no match");
