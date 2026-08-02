const fs = require('fs');
const file = 'frontend/src/pages/VisaoGeralProducao.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Clock to lucide-react if not there
if (!content.includes('Clock,')) {
    content = content.replace('import { ', 'import { Clock, ');
}

// 2. Add State for Tempos Producao
const stateAnchor = 'const [actionModal, setActionModal] = useState<string | null>(null);';
const stateCode = `
  const [temposProducaoRecursos, setTemposProducaoRecursos] = useState<any[]>([]);
  const [temposProducaoSelId, setTemposProducaoSelId] = useState('');
  const [temposProducaoValores, setTemposProducaoValores] = useState({ setup: 0, padrao: 0, total: 0 });

  useEffect(() => {
    if (actionModal === 'temposProducao') {
      fetch(\`\${API_BASE}/recursos\`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const list = data.data.filter((r:any) => r.Fabrica === 'SIM' || r.Fabrica === 'S' || r.Fabrica === true);
            setTemposProducaoRecursos(list);
            setTemposProducaoSelId('');
            setTemposProducaoValores({ setup: 0, padrao: 0, total: 0 });
          }
        })
        .catch(console.error);
    }
  }, [actionModal]);

  const handleSelectRecursoTempos = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const recId = e.target.value;
    setTemposProducaoSelId(recId);
    const rec = temposProducaoRecursos.find(r => String(r.IdProcessoFabricacao) === String(recId));
    if (rec && selTag) {
      try {
        const res = await fetch(\`\${API_BASE}/ordemservico/\${selTag.IdTag}/tempos-producao?recurso=\${encodeURIComponent(rec.processofabricacao)}\`, { headers: getHeaders() });
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
if (!content.includes('setTemposProducaoRecursos')) {
    content = content.replace(stateAnchor, stateAnchor + '\\n' + stateCode);
}

// 3. Add Button next to Finalizar Tag
const buttonAnchor = `className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 transition-colors"
                    title="Alterar Qtde Liberada"
                  >
                    <Edit3 size={11} /> Qtde Lib.
                  </button>`;
const newButton = `
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelTag(t); setMsg(null); setActionModal('temposProducao'); }}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 transition-colors"
                    title="Exibir Produção em Minutos"
                  >
                    <Clock size={11} /> Tempo Prod.
                  </button>`;
if (!content.includes('Tempo Prod.')) {
    content = content.replace(buttonAnchor, buttonAnchor + newButton);
}

// 4. Add Modal UI at the end, right before </Layout>
const layoutEndAnchor = '</Layout>';
const modalCode = `
        {actionModal === 'temposProducao' && selTag && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Produção em Minutos</h3>
                    <p className="text-[11px] text-slate-500">Visualizar tempos da OS {selTag.Tag}</p>
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
                      onChange={handleSelectRecursoTempos}
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

if (!content.includes('Visualizar tempos da OS')) {
    content = content.replace(layoutEndAnchor, modalCode + '\\n      ' + layoutEndAnchor);
}

fs.writeFileSync(file, content, 'utf8');
console.log('UI patched!');
