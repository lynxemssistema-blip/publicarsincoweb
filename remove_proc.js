const fs = require('fs');
const file = 'frontend/src/pages/OrdemServico.tsx';
let content = fs.readFileSync(file, 'utf8');

const procRegex = /\{\/\* Processos \*\/\}[\s\S]*?<\/div>(\s*)\{\/\* Se[^]*?o Finaliza[^]*?o/i;
content = content.replace(procRegex, '{/* Seção Finalização');

fs.writeFileSync(file, content, 'utf8');
if (!content.includes('{/* Processos */}')) console.log("Removed!");
else console.log("Still failed");
