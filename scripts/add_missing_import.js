const fs = require('fs');
const path = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/frontend/src/pages/VisaoGeralProducao.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import ProdSetoresModal')) {
    code = "import ProdSetoresModal from '../components/ProdSetoresModal';\n" + code;
    fs.writeFileSync(path, code);
    console.log('Import added successfully.');
} else {
    console.log('Import already exists.');
}
