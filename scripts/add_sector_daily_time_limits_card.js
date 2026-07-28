const fs = require('fs');

const configPage = 'frontend/src/pages/Configuracao.tsx';
let content = fs.readFileSync(configPage, 'utf8');

// 1. Ensure Clock icon imported from lucide-react
if (!content.includes('Clock')) {
  content = content.replace(
    "import { Shield, Save, Lock, User, Settings2, CheckCircle, Menu, Trash2, ChevronUp, ChevronDown, ChevronRight, Edit2, FolderPlus, X, ChevronLeft, Eye, EyeOff, Database, Server, ArrowRight, List } from 'lucide-react';",
    "import { Shield, Save, Lock, User, Settings2, CheckCircle, Menu, Trash2, ChevronUp, ChevronDown, ChevronRight, Edit2, FolderPlus, X, ChevronLeft, Eye, EyeOff, Database, Server, ArrowRight, List, Clock } from 'lucide-react';"
  );
}

// 2. Add state for limitesSetores
const stateDef = `  const DEFAULT_SECTOR_LIMITS: Record<string, number> = {
    corte: 500,
    dobra: 500,
    solda: 500,
    pintura: 500,
    montagem: 500,
    cortealaser: 500,
    pulsionadeira: 500,
    galvanizar: 500
  };
  const [limitesSetores, setLimitesSetores] = useState<Record<string, number>>(DEFAULT_SECTOR_LIMITS);`;

if (!content.includes('const [limitesSetores,')) {
  content = content.replace(
    'const [maxRegistrosCustom, setMaxRegistrosCustom] = useState<string>(\'\');',
    `const [maxRegistrosCustom, setMaxRegistrosCustom] = useState<string>('');\n${stateDef}`
  );
}

// 3. Update fetchConfig to load limitesSetores from localStorage
const loadLimites = `
    const limitesSalvos = localStorage.getItem('sinco_limitesTempoSetores');
    if (limitesSalvos) {
      try {
        setLimitesSetores(prev => ({ ...prev, ...JSON.parse(limitesSalvos) }));
      } catch { /* ignore */ }
    }`;

if (!content.includes('sinco_limitesTempoSetores')) {
  content = content.replace(
    'setMostrarPowerBuild(powerBuildSalvo);',
    `setMostrarPowerBuild(powerBuildSalvo);\n${loadLimites}`
  );
}

// 4. Handler for saving limits
const saveLimitesHandler = `
  const handleSaveLimitesSetores = () => {
    localStorage.setItem('sinco_limitesTempoSetores', JSON.stringify(limitesSetores));
    addToast({ type: 'success', title: 'Sucesso', message: 'Limites de tempo diário dos setores salvos com sucesso!' });
  };`;

if (!content.includes('const handleSaveLimitesSetores =')) {
  content = content.replace(
    'const handleSaveRegras = async () => {',
    `${saveLimitesHandler}\n\n  const handleSaveRegras = async () => {`
  );
}

// 5. Add the JSX card in activeTab === 'regras'
const sectorLimitsCardJSX = `
        {/* NOVO CARD: Limites de Tempo Diário de Produção por Setor/Recurso */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <Clock size={16} className="text-[#32423D]" />
                Limites de Tempo Diário de Produção por Setor / Recurso
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Defina o limite diário padrão em minutos para cada setor (padrão de <strong>500 min</strong>).
              </p>
            </div>
            <button 
              onClick={handleSaveLimitesSetores} 
              className="flex items-center gap-1.5 bg-[#32423D] text-[#E0E800] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2a3833] transition-colors shadow-sm"
            >
              <Save size={13} /> Salvar Limites
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { key: 'corte', label: 'Corte', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { key: 'dobra', label: 'Dobra', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { key: 'solda', label: 'Solda', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { key: 'pintura', label: 'Pintura', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { key: 'montagem', label: 'Montagem', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { key: 'cortealaser', label: 'Corte a Laser', color: 'bg-rose-50 text-rose-700 border-rose-200' },
              { key: 'pulsionadeira', label: 'Pulsionadeira', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
              { key: 'galvanizar', label: 'Galvanizar', color: 'bg-teal-50 text-teal-700 border-teal-200' },
            ].map(sec => {
              const minVal = limitesSetores[sec.key] ?? 500;
              return (
                <div key={sec.key} className="p-3.5 border border-slate-200 rounded-xl bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-800 tracking-wide">{sec.label}</span>
                    <span className={\`px-2 py-0.5 rounded text-[10px] font-bold border \${sec.color}\`}>
                      Ativo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Limite:</span>
                    <input
                      type="number"
                      min="1"
                      step="10"
                      value={minVal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 500;
                        setLimitesSetores(prev => ({ ...prev, [sec.key]: val }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-black text-slate-900 text-xs text-center focus:border-[#32423D] outline-none shadow-inner"
                    />
                    <span className="text-[11px] font-extrabold text-slate-700 shrink-0">min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>`;

if (!content.includes('Limites de Tempo Diário de Produção por Setor')) {
  content = content.replace(
    '</div>\n\n  <div className="mt-8 border-t border-gray-100 pt-6">\n  <h3 className="font-medium text-gray-900 mb-4">Setores/Processos Visíveis</h3>',
    `${sectorLimitsCardJSX}\n\n  </div>\n\n  <div className="mt-8 border-t border-gray-100 pt-6">\n  <h3 className="font-medium text-gray-900 mb-4">Setores/Processos Visíveis</h3>`
  );
}

fs.writeFileSync(configPage, content, 'utf8');
console.log(`✅ Added Sector Daily Time Limits card to ${configPage}`);
