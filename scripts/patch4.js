const fs = require('fs');
const file = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const res = await fetch\(`\$\{API_BASE\}\/apontamento`, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{[\s\S]*?CriadoPor: [^\}]*\}\s*\)\s*\}\);/;

const r3 = ` let apiURL = \`\${API_BASE}/apontamento\`;
 let payload: any = {
  IdOrdemServicoItem: selectedItem.IdOrdemServicoItem,
  IdOrdemServico: selectedItem.IdOrdemServico,
  Processo: modalSetor,
  RecursoOrigem: recursoOrigemRef.current || '',
  QtdeProduzida: finalQtde,
  TipoApontamento: finalTipoApontamento,
  LimiteDiario: limiteDiarioPost,
  CriadoPor: (user as any)?.NomeCompleto || (user as any)?.name || 'Sistema'
 };

 if (modalSetor !== 'mapa' && modalSetor !== 'mapaproducao' && selectedItem.IdMaterialProcesso) {
  apiURL = \`\${API_BASE}/material-processo/apontar\`;
  payload.IdMaterialProcesso = selectedItem.IdMaterialProcesso;
 }

 const res = await fetch(apiURL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
 });`;

if (regex.test(content)) {
    content = content.replace(regex, r3);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Frontend patched!');
} else {
    console.log('Regex did not match!');
}
