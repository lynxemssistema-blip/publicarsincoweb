import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, Loader } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('sinco_token') || localStorage.getItem('jwt') || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const tenant = localStorage.getItem('tenant_domain') || localStorage.getItem('sincoweb_tenant');
  if (tenant) {
    headers['x-tenant-domain'] = tenant;
  }
  return headers;
};

const SECTORS = [
  { id: 'Corte', txtField: 'txtCORTE', planIni: 'PlanejadoInicioCorte', planFim: 'PlanejadoFinalCorte', label: 'Corte' },
  { id: 'Dobra', txtField: 'txtDOBRA', planIni: 'PlanejadoInicioDobra', planFim: 'PlanejadoFinalDobra', label: 'Dobra' },
  { id: 'Solda', txtField: null, planIni: 'PlanejadoInicioSolda', planFim: 'PlanejadoFinalSolda', label: 'Solda' },
  { id: 'Pintura', txtField: 'txtPINTURA', planIni: 'PlanejadoInicioPintura', planFim: 'PlanejadoFinalPintura', label: 'Pintura' },
  { id: 'Montagem', txtField: null, planIni: 'PlanejadoInicioMontagem', planFim: 'PlanejadoFinalMontagem', label: 'Montagem' },
  { id: 'Punsionadeira', txtField: 'txtPUNSIONADEIRA', planIni: 'PlanejadoInicioPUNSIONADEIRA', planFim: 'PlanejadoFinalPUNSIONADEIRA', label: 'Punsionadeira' },
  { id: 'CorteaLaser', txtField: 'txtCorteaLaser', planIni: 'PlanejadoInicioCorteaLaser', planFim: 'PlanejadoFinalCorteaLaser', label: 'Corte a Laser' },
  { id: 'Galvanizar', txtField: 'txtGALVANIZAR', planIni: 'PlanejadoInicioGALVANIZAR', planFim: 'PlanejadoFinalGALVANIZAR', label: 'Galvanizar' },
];

const isoToBr = (isoStr: string) => {
  if (!isoStr) return '';
  try {
    if (isoStr.includes('T') || isoStr.includes(' ')) {
      const d = new Date(isoStr);
      return format(d, 'yyyy-MM-dd');
    }
    if (isoStr.includes('/')) {
        const [d,m,y] = isoStr.split('/');
        return `${y}-${m}-${d}`;
    }
    return isoStr;
  } catch(e) { return isoStr; }
};

export default function ProdSetoresModal({ onClose, projeto, selectedTagsIds, osAlvo }: any) {
  const [loading, setLoading] = useState(true);
  const [projectTags, setProjectTags] = useState<any[]>([]);
  const [osItems, setOsItems] = useState<any[]>([]);
  const [sectorDates, setSectorDates] = useState<any>({});
  
  useEffect(() => {
    if (!projeto && !osAlvo) return;
    setLoading(true);
    if (osAlvo) {
      // Busca itens da OS
      axios.get(`/api/visao-geral/tag/${osAlvo.IdTag}/itens?t=${new Date().getTime()}&limit=500`, { headers: getAuthHeaders() })
        .then(res => {
           const itemsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
           // Filtrar os itens que pertencem a esta OS
           const myItems = itemsData.filter((i:any) => i.IdOrdemServico === osAlvo.IdOrdemServico);
           setOsItems(myItems);
           setLoading(false);
        })
        .catch(err => {
           console.error('Erro ao buscar itens da OS:', err);
           setLoading(false);
        });
    } else {
      // Busca todas as tags do projeto
      axios.get(`/api/acompanhamento/projeto/${projeto.IdProjeto}/tags?t=${new Date().getTime()}&limit=500`, { headers: getAuthHeaders() })
        .then(res => {
           const tagsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
           setProjectTags(tagsData);
           setLoading(false);
        })
        .catch(err => {
           console.error('Erro ao buscar tags do projeto:', err);
           setLoading(false);
        });
    }
  }, [projeto, osAlvo]);

  const targetTags = selectedTagsIds && selectedTagsIds.length > 0 
    ? projectTags.filter(t => selectedTagsIds.includes(t.IdTag)) 
    : projectTags;

  useEffect(() => {
    if (loading) return;
    if (!osAlvo && targetTags.length === 0) return;
    if (osAlvo && osItems.length === 0) return;

    const newDates: any = {};
    SECTORS.forEach(sec => {
      let minDate = '';
      let maxDate = '';

      const dataSource = osAlvo ? osItems : targetTags;

      dataSource.forEach(t => {
         const ini = isoToBr(t[sec.planIni]);
         const fim = isoToBr(t[sec.planFim]);
         
         if (ini && (!minDate || ini < minDate)) minDate = ini;
         if (fim && (!maxDate || fim > maxDate)) maxDate = fim;
      });

      newDates[sec.id] = { ini: minDate, fim: maxDate };
    });

    setSectorDates(newDates);
  }, [targetTags, osItems, loading, osAlvo]);

  const handleSave = async () => {
      if (!osAlvo && targetTags.length === 0) return;
      try {
          const payload: any = { datas: sectorDates };
          if (osAlvo) {
            payload.osIds = [osAlvo.IdOrdemServico];
          } else {
            payload.tagIds = targetTags.map(t => t.IdTag);
          }
          await axios.put(`/api/projetos/${projeto.IdProjeto}/datas-planejamento`, payload, { headers: getAuthHeaders() });
          alert('Datas de planejamento atualizadas com sucesso em cascata!');
          onClose();
      } catch (err) {
          console.error(err);
          alert('Erro ao salvar as datas de planejamento.');
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="bg-[#32423D] text-white px-5 py-4 rounded-t-xl flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={20} />
              Planejamento de Setores (Prod. Recursos)
            </h2>
            <p className="text-xs text-white/70 mt-1">
              {projeto && `Projeto: ${projeto.NomeProjeto || projeto.DescricaoProjeto || projeto.IdProjeto}`}
              {targetTags.length > 0 && ` - Editando ${targetTags.length} tag(s).`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 relative">
          {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3"><Loader className="animate-spin" size={28} /> <span className="text-xs font-bold">Carregando tags...</span></div>
          ) : Object.keys(sectorDates).length === 0 ? (
            <div className="text-center text-slate-500 py-10 font-bold">
              Nenhum setor produtivo ativo encontrado nas tags avaliadas.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200">
                    <th className="py-1.5 px-3 text-[11px] font-bold text-slate-600 uppercase">Recurso Produtivo</th>
                    <th className="py-1.5 px-3 text-[11px] font-bold text-slate-600 uppercase">Menor Planejado Início</th>
                    <th className="py-1.5 px-3 text-[11px] font-bold text-slate-600 uppercase">Maior Planejado Final</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(sectorDates).map(sectorId => {
                    const secDef = SECTORS.find(s => s.id === sectorId);
                    const dates = sectorDates[sectorId];

                    return (
                      <tr key={sectorId} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-1.5 px-3 align-middle">
                          <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                            {secDef?.label}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 align-middle">
                          <input 
                            type="date" 
                            value={dates.ini}
                            onChange={(e) => setSectorDates(prev => ({...prev, [sectorId]: {...prev[sectorId], ini: e.target.value}}))}
                            className="w-full max-w-[180px] bg-white border border-slate-200 rounded-lg text-xs p-1.5 text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                          />
                        </td>
                        <td className="py-1.5 px-3 align-middle">
                          <input 
                            type="date" 
                            value={dates.fim}
                            onChange={(e) => setSectorDates(prev => ({...prev, [sectorId]: {...prev[sectorId], fim: e.target.value}}))}
                            className="w-full max-w-[180px] bg-white border border-slate-200 rounded-lg text-xs p-1.5 text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors">
            Cancelar
          </button>
          <button type="button" disabled={loading || targetTags.length === 0} onClick={handleSave} className="px-5 py-2 bg-[#32423D] hover:bg-[#2a3733] disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-sm">
            <Save size={16} /> Salvar e Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
