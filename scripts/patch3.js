const fs = require('fs');
const file = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
let content = fs.readFileSync(file, 'utf8');

const s1 = `interface ApontamentoItem {
 IdOrdemServicoItem: number;`;
const r1 = `interface ApontamentoItem {
 IdMaterialProcesso?: number;
 IdProcesso?: number;
 IdOrdemServicoItem: number;`;
content = content.replace(s1, r1);

const s2 = ` // Use different route for mapa and mapaproducao
 const url = (setorAtivo === 'mapa' || setorAtivo === 'mapaproducao')
 ? \`\${API_BASE}/apontamento/mapa/producao?\${params}\`
 : \`\${API_BASE}/apontamento/\${setorAtivo}?\${params}\`;`;
const r2 = ` // Use different route for mapa and mapaproducao
 let url = '';
 if (setorAtivo === 'mapa' || setorAtivo === 'mapaproducao') {
  url = \`\${API_BASE}/apontamento/mapa/producao?\${params}\`;
 } else {
  url = \`\${API_BASE}/material-processo/apontamentos/\${setorAtivo}?\${params}\`;
 }`;
content = content.replace(s2, r2);

const s3 = ` const res = await fetch(\`\${API_BASE}/apontamento\`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 IdOrdemServicoItem: selectedItem.IdOrdemServicoItem,
 IdOrdemServico: selectedItem.IdOrdemServico,
 Processo: modalSetor,
 RecursoOrigem: recursoOrigemRef.current || '', // informa qual recurso estava ativo ao abrir MAPA
 QtdeProduzida: finalQtde,
 TipoApontamento: finalTipoApontamento,
 LimiteDiario: limiteDiarioPost, // campo auxiliar diário — validado no backend
 CriadoPor: (user as any)?.NomeCompleto || (user as any)?.name || 'Sistema'
 })
 });`;
const r3 = ` let apiURL = \`\${API_BASE}/apontamento\`;
 let payload: any = {
  IdOrdemServicoItem: selectedItem.IdOrdemServicoItem,
  IdOrdemServico: selectedItem.IdOrdemServico,
  Processo: modalSetor,
  RecursoOrigem: recursoOrigemRef.current || '', // informa qual recurso estava ativo ao abrir MAPA
  QtdeProduzida: finalQtde,
  TipoApontamento: finalTipoApontamento,
  LimiteDiario: limiteDiarioPost, // campo auxiliar diário — validado no backend
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
content = content.replace(s3, r3);

fs.writeFileSync(file, content, 'utf8');
console.log('Frontend patched.');
