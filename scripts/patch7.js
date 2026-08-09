const fs = require('fs');
const file = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Use different route for mapa and mapaproducao')) {
        // we replace lines i+1 and i+2 and i+3
        lines[i+1] = " const url = (setorAtivo === 'mapa' || setorAtivo === 'mapaproducao')";
        lines[i+2] = " ? `${API_BASE}/apontamento/mapa/producao?${params}`";
        lines[i+3] = " : `${API_BASE}/material-processo/apontamentos/${setorAtivo}?${params}`;";
        break;
    }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Fixed URL line by line');
