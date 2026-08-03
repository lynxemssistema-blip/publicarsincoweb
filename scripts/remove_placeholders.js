const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Projeto.tsx', 'utf8');
c = c.replace(/placeholder="PROJ-00X"/g, '');
c = c.replace(/placeholder="Detalhes..."/g, '');
c = c.replace(/placeholder="ALFATEC, SIEMENS..."/g, '');
c = c.replace(/placeholder="00\.000\.000\/0001-00"/g, '');
fs.writeFileSync('frontend/src/pages/Projeto.tsx', c);
console.log('Done');
