const fs = require('fs');

function patchServer() {
    let file = 'src/server.js';
    let code = fs.readFileSync(file, 'utf8');

    if (!code.includes('/api/ordemservico/projetos/:id/tempos-producao')) {
        const routeCode = `
// GET /api/ordemservico/projetos/:id/tempos-producao
app.get('/api/ordemservico/projetos/:id/tempos-producao', tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { recurso } = req.query;
        if (!id || !recurso) {
            return res.status(400).json({ success: false, message: 'Faltam dados: id ou recurso' });
        }
        const recursoLimpo = recurso.trim().replace(/\\s+/g, '');
        const colSetup = \`\${recursoLimpo}TempoSetup\`;
        const colPadrao = \`\${recursoLimpo}TempoPadrao\`;
        const colTotal = \`\${recursoLimpo}TotalTempo\`;
        
        try {
            const query = 'SELECT ?? AS Setup, ?? AS Padrao, ?? AS Total FROM projetos WHERE IdProjeto = ? LIMIT 1';
            const [rows] = await req.tenantDbPool.query(query, [colSetup, colPadrao, colTotal, id]);
            if (rows.length > 0) {
                return res.json({ success: true, data: rows[0] });
            }
        } catch (colErr) {
            console.log(\`Colunas de tempo não encontradas para o recurso \${recursoLimpo} em projetos\`);
        }
        return res.json({ success: true, data: { Setup: 0, Padrao: 0, Total: 0 } });
    } catch (error) {
        console.error('Erro ao buscar tempos de producao do projeto:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao buscar tempos' });
    }
});
`;
        code = code.replace('// Start Server', routeCode + '\n// Start Server');
        fs.writeFileSync(file, code, 'utf8');
        console.log("Patched server.js");
    }
}

function patchFrontend() {
    let file = 'frontend/src/pages/VisaoGeralProducao.tsx';
    let code = fs.readFileSync(file, 'utf8');

    // 1. Update actionModal types
    if (!code.includes('\'temposProducaoProj\'')) {
        code = code.replace(
            /'temposProducaoOs' \| null>\(null\);/g,
            "'temposProducaoOs' | 'temposProducaoProj' | null>(null);"
        );
    }

    // 2. Add 'temposProducaoProj' to useEffect
    if (!code.includes('|| actionModal === \'temposProducaoProj\'')) {
        code = code.replace(
            /if \(actionModal === 'temposProducao' \|\| actionModal === 'temposProducaoOs'\)/g,
            "if (actionModal === 'temposProducao' || actionModal === 'temposProducaoOs' || actionModal === 'temposProducaoProj')"
        );
    }

    // 3. Add handleSelectRecursoTemposProj
    if (!code.includes('const handleSelectRecursoTemposProj')) {
        const handler = `
  const handleSelectRecursoTemposProj = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const recId = e.target.value;
    setTemposProducaoSelId(recId);
    const rec = temposProducaoRecursos.find(r => String(r.IdProcessoFabricacao) === String(recId));
    if (rec && selProj) {
      try {
        const res = await fetch(\`\${API_BASE}/ordemservico/projetos/\${selProj.IdProjeto}/tempos-producao?recurso=\${encodeURIComponent(rec.processofabricacao)}\`, { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success) {
          setTemposProducaoValores({
            setup: json.data.Setup || 0,
            padrao: json.data.Padrao || 0,
            total: json.data.Total || 0
          });
        }
      } catch(err) {
        console.error(err);
      }
    } else {
        setTemposProducaoValores({ setup: 0, padrao: 0, total: 0 });
    }
  };
`;
        code = code.replace(
            /const handleSelectRecursoTemposOs = async/g,
            handler + "\n  const handleSelectRecursoTemposOs = async"
        );
    }

    // 4. Render Modal for temposProducaoProj
    if (!code.includes('actionModal === \'temposProducaoProj\'')) {
        const modalHtml = `
  {actionModal === 'temposProducaoProj' && selProj && (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Produção em Minutos</h3>
              <p className="text-[11px] text-slate-500">Visualizar tempos do Projeto {selProj.Projeto}</p>
            </div>
          </div>
          <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Processo de Fabricação</label>
              <select
                value={temposProducaoSelId}
                onChange={handleSelectRecursoTemposProj}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecione um recurso...</option>
                {temposProducaoRecursos.map(r => (
                  <option key={r.IdProcessoFabricacao} value={r.IdProcessoFabricacao}>
                    {r.processofabricacao}
                  </option>
                ))}
              </select>
            </div>
            
            {temposProducaoSelId && (
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Setup</div>
                  <div className="text-lg font-bold text-slate-800">{temposProducaoValores.setup}</div>
                  <div className="text-[10px] text-slate-400">min</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Padrão</div>
                  <div className="text-lg font-bold text-slate-800">{temposProducaoValores.padrao}</div>
                  <div className="text-[10px] text-slate-400">min</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Total</div>
                  <div className="text-lg font-bold text-blue-800">{temposProducaoValores.total}</div>
                  <div className="text-[10px] text-blue-400">min</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setActionModal(null)}
            className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )}
`;
        code = code.replace(
            /\{actionModal === 'temposProducaoOs' && selOs && \(/g,
            modalHtml + "\n  {actionModal === 'temposProducaoOs' && selOs && ("
        );
    }

    // 5. Update the project actions UI
    if (!code.includes('setActionModal(\'temposProducaoProj\')')) {
        code = code.replace(
            /<div className="grid grid-cols-2 gap-1.5 text-\[9px\] font-bold uppercase">/g,
            `<div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold uppercase">
                                  <button type="button" onClick={() => { setSelProj(p); setMsg(null); setActionModal('temposProducaoProj'); setTemposProducaoSelId(''); setTemposProducaoValores({setup:0,padrao:0,total:0}); }} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-1 py-1.5 rounded-lg transition-colors border border-blue-100 shadow-sm flex items-center justify-center gap-1" title="Exibir Produção em Minutos">
                                    <Clock size={12} className="pointer-events-none" /> T.Prod
                                  </button>`
        );
    }

    fs.writeFileSync(file, code, 'utf8');
    console.log("Patched VisaoGeralProducao.tsx");
}

patchServer();
patchFrontend();
