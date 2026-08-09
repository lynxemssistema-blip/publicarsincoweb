const fs = require('fs');

// Fix frontend
const file = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix dynamic sector title
content = content.replace(
  'const setorInfo = setores.find(s => s.id === setorAtivo) || setores[0];',
  'const setorInfo = setores.find(s => s.id === setorAtivo) || { id: setorAtivo as any, label: String(setorAtivo).charAt(0).toUpperCase() + String(setorAtivo).slice(1), icon: Settings2, color: "bg-gray-500" };'
);

// 2. Fix casing for IdMaterialProcesso in frontend check
const oldCheck = `if (modalSetor !== 'mapa' && modalSetor !== 'mapaproducao' && selectedItem.IdMaterialProcesso) {`;
const newCheck = `if (modalSetor !== 'mapa' && modalSetor !== 'mapaproducao' && (selectedItem.IdMaterialProcesso || (selectedItem as any).idmaterialprocesso || (selectedItem as any).idMaterialProcesso)) {`;
content = content.replace(oldCheck, newCheck);

// Also apply the casing fix to the payload building
const oldPayload = `payload.IdMaterialProcesso = selectedItem.IdMaterialProcesso;`;
const newPayload = `payload.IdMaterialProcesso = selectedItem.IdMaterialProcesso || (selectedItem as any).idmaterialprocesso || (selectedItem as any).idMaterialProcesso;`;
content = content.replace(oldPayload, newPayload);

fs.writeFileSync(file, content, 'utf8');

// Fix backend
const serverFile = 'src/server.js';
let serverContent = fs.readFileSync(serverFile, 'utf8');
serverContent = serverContent.replace(
    'mp.IdMaterialProcesso,',
    'mp.IdMaterialProcesso AS IdMaterialProcesso,'
);
fs.writeFileSync(serverFile, serverContent, 'utf8');

console.log('Fixed!');
