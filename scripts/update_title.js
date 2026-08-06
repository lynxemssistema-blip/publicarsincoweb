const fs = require('fs');
const path = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/frontend/src/pages/VisaoGeralProducao.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = 'title="Alterar planejamento das tags do projeto"';
const replaceStr = 'title="Ao selecionar esta opção todas as tags terão suas datas de planejamento modificadas em seus recursos ativos, propagando em efeito cascata para os OS e itens da OS"';

code = code.replaceAll(targetStr, replaceStr);

fs.writeFileSync(path, code);
console.log('Title updated.');
