const fs = require('fs');
const file = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
let content = fs.readFileSync(file, 'utf8');

const s2 = ` // Use different route for mapa and mapaproducao
 const url = (setorAtivo === 'mapa' || setorAtivo === 'mapaproducao')
 ? \`\${API_BASE}/apontamento/mapa/producao?\${params}\`
 : \`\${API_BASE}/apontamento/\${setorAtivo}?\${params}\`;`;

const r2 = ` // Use different route for mapa and mapaproducao
 const url = (setorAtivo === 'mapa' || setorAtivo === 'mapaproducao')
 ? \`\${API_BASE}/apontamento/mapa/producao?\${params}\`
 : \`\${API_BASE}/material-processo/apontamentos/\${setorAtivo}?\${params}\`;`;

content = content.replace(s2, r2);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed URL');
