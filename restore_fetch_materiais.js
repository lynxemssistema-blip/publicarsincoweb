const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'frontend/src/components/ModalIncluirMaterialOS.tsx');
let c = fs.readFileSync(p, 'utf8');

const target1 = `  const fetchExistingOsCodigos = async () => {`;
const inject1 = `  const fetchMateriaisEmProcesso = async (codsExistentes: string[]) => {
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      let url = \`\${API_BASE}/ordemservico/\${osId}/materiais-em-processo?\`;
      if (osContext?.IdProjeto) url += \`idProjeto=\${osContext.IdProjeto}&\`;
      if (osContext?.IdTag) url += \`idTag=\${osContext.IdTag}&\`;
      
      const res = await fetch(url, {
        headers: activeToken ? { 'Authorization': \`Bearer \${activeToken}\` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Only load if they are not already in ordemservicoitem
        const pendentes = json.data.filter((m: any) => !codsExistentes.includes(m.codmatfabricante));
        
        const newSelected = {} as any;
        const newProcessos = {} as any;
        let totalAdded = 0;
        
        pendentes.forEach((m: any) => {
            newSelected[m.codmatfabricante] = {
                codmatfabricante: m.codmatfabricante,
                qtde: m.qtde,
                fator: 1,
                acabamento: globalAcabamento,
                recursoTempos: m.recursoTempos,
                tempoSetup: 0,
                tempoPadrao: 0,
                totalTempo: 0
            };
            
            const list = Object.keys(m.recursoTempos).map(k => ({
                key: k,
                processofabricacao: k,
                tempoSetup: m.recursoTempos[k].tempoSetup,
                tempoPadrao: m.recursoTempos[k].tempoPadrao
            }));
            newProcessos[m.codmatfabricante] = list;
            totalAdded += 1;
        });
        
        if (totalAdded > 0) {
            setSelectedItems(prev => ({...prev, ...newSelected}));
            setItemProcessos(prev => ({...prev, ...newProcessos}));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar materiais em processo', e);
    }
  };

  const fetchExistingOsCodigos = async () => {`;

c = c.replace(target1, inject1);

const target2 = `      fetchExistingOsCodigos().then((codsExistentes) => {
        fetchInitialMaterials(codsExistentes);
      });`;
const inject2 = `      fetchExistingOsCodigos().then((codsExistentes) => {
        fetchInitialMaterials(codsExistentes);
        fetchMateriaisEmProcesso(codsExistentes);
      });`;

c = c.replace(target2, inject2);

fs.writeFileSync(p, c, 'utf8');
console.log('Restored fetchMateriaisEmProcesso in ModalIncluirMaterialOS.tsx');
