import { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, Check, CheckCircle, Wrench, Trash2 } from 'lucide-react';
import ModalMontagemProcessoFabricacao from './ModalMontagemProcessoFabricacao';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface Material {
  CodMatFabricante: string;
  DescResumo: string;
  acabamento?: string;
  [key: string]: any;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  osId: number | string;
  osContext: any;
  onSuccess: (count?: number) => void;
  token: string | null;
}

function mapProcessToKey(name: string): { key: string, label: string } {
  const norm = (name || '').trim().toUpperCase().replace(/\s+/g, '');
  if (norm.includes('CORTEALASER') || norm.includes('CORTELASER') || norm.includes('LASER')) {
    return { key: 'CorteaLaser', label: 'Corte a Laser' };
  }
  if (norm.includes('PUNSIONADEIRA') || norm.includes('PUNCIONADEIRA')) {
    return { key: 'Punsionadeira', label: 'Punsionadeira' };
  }
  if (norm.includes('GALVANIZAR')) {
    return { key: 'Galvanizar', label: 'Galvanizar' };
  }
  if (norm.includes('ENGENHARIA')) {
    return { key: 'Engenharia', label: 'Engenharia' };
  }
  if (norm.includes('CORTE')) {
    return { key: 'Corte', label: 'Corte' };
  }
  if (norm.includes('DOBRA')) {
    return { key: 'Dobra', label: 'Dobra' };
  }
  if (norm.includes('SOLDA')) {
    return { key: 'Solda', label: 'Solda' };
  }
  if (norm.includes('PINTURA')) {
    return { key: 'Pintura', label: 'Pintura' };
  }
  if (norm.includes('MONTAGEM')) {
    return { key: 'Montagem', label: 'Montagem' };
  }
  const cleanKey = (name || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  return { key: cleanKey || 'Processo', label: name || 'Processo' };
}

export default function ModalIncluirMaterialOS({ isOpen, onClose, osId, osContext, onSuccess, token }: ModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [existingOsCodigos, setExistingOsCodigos] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ 
    [cod: string]: { 
      qtde: number, 
      fator: number,
      acabamento: string, 
      tempoSetup: number, 
      tempoPadrao: number,
      recursoTempos: Record<string, { tempoSetup: number, tempoPadrao: number }>
      alreadyInOS?: boolean,
      desc?: string
    } 
  }>({});
  const [itemProcessos, setItemProcessos] = useState<{ [cod: string]: { key: string, label: string, tempoSetup: number, tempoPadrao: number }[] }>({});
  const [loadingProcessos, setLoadingProcessos] = useState<{ [cod: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalAcabamento, setGlobalAcabamento] = useState('');
  const [acabamentos, setAcabamentos] = useState<{ id: string | number, label: string }[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [totalAdded, setTotalAdded] = useState(0);
  const [montarRecursoCod, setMontarRecursoCod] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recursosVisible, setRecursosVisible] = useState<{ [cod: string]: boolean }>({});

  const toggleRecursos = (cod: string) => setRecursosVisible(prev => ({ ...prev, [cod]: !prev[cod] }));


  const fetchExistingOsItems = async () => {
    try {
      let qs = [];
      if (osContext?.IdProjeto) qs.push(`idProjeto=${osContext.IdProjeto}`);
      if (osContext?.IdTag) qs.push(`idTag=${osContext.IdTag}`);
      const qsString = qs.length ? `?${qs.join('&')}` : '';
      
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const res = await fetch(`${API_BASE}/ordemservico/${osId}/materiais-em-processo${qsString}`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const newSelected: any = {};
        const newProcessos: any = {};
        json.data.forEach((m: any) => {
            const cod = m.codmatfabricante;
            newSelected[cod] = {
                qtde: m.qtde,
                fator: 1,
                acabamento: '',
                tempoSetup: 0,
                tempoPadrao: 0,
                recursoTempos: m.recursoTempos || {},
                alreadyInOS: true,
                desc: m.desc
            };
            const procs: any[] = [];
            Object.keys(m.recursoTempos || {}).forEach(k => {
                procs.push({
                    key: k,
                    label: m.recursoTempos[k].label || k,
                    tempoSetup: m.recursoTempos[k].tempoSetup,
                    tempoPadrao: m.recursoTempos[k].tempoPadrao
                });
            });
            newProcessos[cod] = procs;
        });
        setSelectedItems(prev => ({...prev, ...newSelected}));
        setItemProcessos(prev => ({...prev, ...newProcessos}));
      }
    } catch (e) {
      console.error('Erro ao buscar materiais da OS', e);
    }
  };


  const fetchMateriaisNaOS = async () => {
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      let url = `${API_BASE}/ordemservico/${osId}/materiais-em-processo`;
      const queryParams = new URLSearchParams();
      if (osContext?.IdProjeto) queryParams.append('idProjeto', osContext.IdProjeto.toString());
      if (osContext?.IdTag) queryParams.append('idTag', osContext.IdTag.toString());
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
      const res = await fetch(url, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const loaded: any = {};
        const codigos: string[] = [];
        json.data.forEach((m: any) => {
          if (m.codmatfabricante) {
            loaded[m.codmatfabricante] = {
              desc: m.desc || '',
              qtde: m.qtde || 1,
              fator: 1,
              acabamento: '',
              tempoSetup: 0,
              tempoPadrao: 0,
              recursoTempos: m.recursoTempos || {}
            };
            codigos.push(m.codmatfabricante);
          }
        });
        setSelectedItems(loaded);
        setExistingOsCodigos(codigos);
        return codigos;
      }
    } catch (e) {
      console.error('Erro ao carregar materiais na OS', e);
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setAllMaterials([]);
      setExistingOsCodigos([]);
      setSelectedItems({});
      setItemProcessos({});
      setLoadingProcessos({});
      setGlobalAcabamento('');
      setSuccessMsg(null);
      setTotalAdded(0);
      fetchAcabamentos();

      fetchMateriaisNaOS().then(codsExistentes => {
        fetchInitialMaterials(codsExistentes);
      });
    }
  }, [isOpen, osId]);

  const fetchInitialMaterials = async (codsExistentes?: string[]) => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const res = await fetch(`${API_BASE}/material/busca-livre?q=`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const cods = codsExistentes || [];
        const disponiveis = json.data.filter((m: any) => !cods.includes(m.CodMatFabricante));
        setAllMaterials(disponiveis);
        setSearchResults(disponiveis);
      }
    } catch (e) {
      console.error('Erro na busca inicial', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcabamentos = async () => {
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const res = await fetch(`${API_BASE}/acabamento`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((a: any) => ({
          id: a.IDAcabamento,
          label: a.DescAcabamento
        }));
        setAcabamentos(mapped);
      }
    } catch (e) {
      console.error('Erro ao buscar acabamentos', e);
    }
  };

  const fetchMaterialProcessos = async (cod: string, forceRefresh = false) => {
    setLoadingProcessos(prev => ({ ...prev, [cod]: true }));
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const res = await fetch(`${API_BASE}/material/processos/${encodeURIComponent(cod)}`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list = json.data.map((proc: any) => {
          const { key, label } = mapProcessToKey(proc.processofabricacao);
          return {
            key,
            label,
            tempoSetup: Math.max(0, parseInt(String(proc.tempoSetup), 10) || 0),
            tempoPadrao: Math.max(0, parseInt(String(proc.tempoPadrao), 10) || 0)
          };
        });

        setItemProcessos(prev => ({ ...prev, [cod]: list }));

        setSelectedItems(prev => {
          const item = prev[cod];
          if (!item) return prev;
          const initialRecs: Record<string, { tempoSetup: number, tempoPadrao: number }> = forceRefresh ? {} : { ...item.recursoTempos };
          list.forEach((p: any) => {
            if (forceRefresh || !initialRecs[p.key]) {
              initialRecs[p.key] = {
                tempoSetup: p.tempoSetup,
                tempoPadrao: p.tempoPadrao
              };
            }
          });
          return {
            ...prev,
            [cod]: {
              ...item,
              recursoTempos: initialRecs
            }
          };
        });
      } else {
        setItemProcessos(prev => ({ ...prev, [cod]: [] }));
      }
    } catch (e) {
      console.error(`Erro ao carregar processos do material ${cod}`, e);
      setItemProcessos(prev => ({ ...prev, [cod]: [] }));
    } finally {
      setLoadingProcessos(prev => ({ ...prev, [cod]: false }));
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSelectedItems({});
    setItemProcessos({});
    setRecursosVisible({});
    setTotalAdded(0);
    if (!searchTerm.trim()) {
      setSearchResults(allMaterials);
      return;
    }
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const res = await fetch(`${API_BASE}/material/busca-livre?q=${encodeURIComponent(searchTerm)}`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const disponiveis = json.data.filter((m: Material) => !existingOsCodigos.includes(m.CodMatFabricante));
        setSearchResults(disponiveis);
      }
    } catch (e) {
      console.error('Erro na busca', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults(allMaterials);
  };

  const toggleSelection = (mat: Material) => {
    const cod = mat.CodMatFabricante;
    const isCurrentlySelected = !!selectedItems[cod];

    if (isCurrentlySelected) {
      setSelectedItems(prev => {
        const novo = { ...prev };
        delete novo[cod];
        return novo;
      });
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [cod]: {
          qtde: 1,
          fator: 1,
          acabamento: globalAcabamento || mat.acabamento || '',
          tempoSetup: 0,
          tempoPadrao: 0,
          recursoTempos: {}
        }
      }));
      fetchMaterialProcessos(cod);
    }
  };


  const handleSaveQuantity = async (cod: string) => {
    try {
        const item = selectedItems[cod];
        if (!item) return;
        const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || localStorage.getItem('supabase.auth.token') || '';
        
        const qtde = Math.max(1, item.qtde || 1);
        
        const res = await fetch(`${API_BASE}/material-processo/quantidade`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
            },
            body: JSON.stringify({
                codmatFabricante: cod,
                osId: osId,
                idProjeto: osContext?.IdProjeto || null,
                idTag: osContext?.IdTag || null,
                qtde: qtde
            })
        });
        
        const json = await res.json();
        if (json.success) {
            setSuccessMsg('Quantidade total (TotalExecutar) atualizada com sucesso!');
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            console.error('Erro:', json);
            setSuccessMsg('Erro ao salvar quantidade');
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    } catch (e) {
        console.error('Erro ao salvar quantidade', e);
    }
  };

  const handleSaveRecurso = async (cod: string, secKey: string) => {
    try {
        const item = selectedItems[cod];
        if (!item) return;
        const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || localStorage.getItem('supabase.auth.token') || '';
        
        const procsList = itemProcessos[cod] || [];
        const proc = procsList.find(p => p.key === secKey);
        if(!proc) return;
        
        const recVal = item.recursoTempos?.[secKey] || { tempoSetup: proc.tempoSetup, tempoPadrao: proc.tempoPadrao };
        const qtde = Math.max(1, item.qtde || 1);
        
        const res = await fetch(`${API_BASE}/material-processo/tempos`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
            },
            body: JSON.stringify({
                codmatFabricante: cod,
                osId: osId,
                idProjeto: osContext?.IdProjeto || null,
                idTag: osContext?.IdTag || null,
                labelProcesso: proc.label,
                tempoSetup: parseInt(recVal.tempoSetup) || 0,
                tempoPadrao: parseInt(recVal.tempoPadrao) || 0,
                qtde: qtde
            })
        });
        
        const json = await res.json();
        if (json.success) {
            setSuccessMsg('Tempos e Quantidade atualizados com sucesso!');
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            console.error('Erro:', json);
            setSuccessMsg('Erro ao salvar recursos');
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    } catch (e) {
        console.error('Erro ao salvar recursos', e);
    }
  };

  const updateItem = (cod: string, field: 'qtde' | 'fator' | 'acabamento' | 'tempoSetup' | 'tempoPadrao', value: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [cod]: { ...prev[cod], [field]: value }
    }));
  };

  const updateRecursoTempo = (cod: string, secKey: string, field: 'tempoSetup' | 'tempoPadrao', val: number) => {
    setSelectedItems(prev => {
      const item = prev[cod];
      if (!item) return prev;
      const currentRec = item.recursoTempos?.[secKey] || { tempoSetup: 0, tempoPadrao: 0 };
      return {
        ...prev,
        [cod]: {
          ...item,
          recursoTempos: {
            ...item.recursoTempos,
            [secKey]: {
              ...currentRec,
              [field]: Math.max(0, val)
            }
          }
        }
      };
    });
  };

  const handleSubmit = async () => {
    setValidationError(null);

    // Validação: cada item deve ter pelo menos 1 recurso ativo
    const semRecurso = Object.keys(selectedItems).filter(cod => {
      const procs = itemProcessos[cod];
      return !procs || procs.length === 0;
    });

    if (semRecurso.length > 0) {
      const nomes = semRecurso.map(cod => {
        const mat = searchResults.find(m => m.CodMatFabricante === cod);
        return mat ? `${cod} – ${mat.DescResumo}` : cod;
      });
      setValidationError(
        `Os seguintes materiais não possuem nenhum recurso/processo cadastrado e não podem ser incluídos:\n• ${nomes.join('\n• ')}\n\nCadastre ao menos 1 recurso via "Montar Recursos" antes de confirmar.`
      );
      return;
    }

  const itensArray = Object.keys(selectedItems).filter(cod => !selectedItems[cod].alreadyInOS).map(cod => {
      const item = selectedItems[cod];
      const qtde = Math.max(1, parseInt(String(item.qtde), 10) || 1);
      const fator = Math.max(1, parseInt(String(item.fator), 10) || 1);
      const tempoSetup = Math.max(0, parseInt(String(item.tempoSetup), 10) || 0);
      const tempoPadrao = Math.max(0, parseInt(String(item.tempoPadrao), 10) || 0);
      const totalTempo = (((tempoPadrao * qtde) + tempoSetup) * fator);

      const recursoTemposCalculados: Record<string, { tempoSetup: number, tempoPadrao: number, totalTempo: number, totalSetup: number, totalPadrao: number }> = {};

      if (item.recursoTempos) {
        Object.keys(item.recursoTempos).forEach(secKey => {
          const rec = item.recursoTempos[secKey];
          const setup = Math.max(0, parseInt(String(rec.tempoSetup), 10) || 0);
          const padrao = Math.max(0, parseInt(String(rec.tempoPadrao), 10) || 0);
          const tot = ((padrao * qtde) + setup) * fator;
            recursoTemposCalculados[secKey] = {
              tempoSetup: setup,
              totalSetup: setup,
              tempoPadrao: padrao,
              totalPadrao: padrao * qtde,
              totalTempo: tot
            };
        });
      }

      return {
        codmatfabricante: cod,
        qtde,
        fator,
        acabamento: item.acabamento,
        tempoSetup,
        tempoPadrao,
        totalTempo,
        recursoTempos: recursoTemposCalculados
      };
    });

    if (itensArray.length === 0) {
      alert('Selecione pelo menos um material.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    try {
      const activeToken = token || localStorage.getItem('sinco_token') || localStorage.getItem('token') || localStorage.getItem('superadmin_token') || '';
      const res = await fetch(`${API_BASE}/ordemservico/${osId}/incluir-materiais-dinamico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          itensSelecionados: itensArray,
          osContext
        })
      });

      const json = await res.json();
      if (json.success) {
        const qtdAdded = itensArray.length;
        setTotalAdded(prev => prev + qtdAdded);

        setSelectedItems({});
        setItemProcessos({});
        setSearchTerm('');
        
        const novosCodigos = await fetchExistingOsCodigos();
        fetchInitialMaterials(novosCodigos);

        setSuccessMsg(`✓ ${qtdAdded} material(is) incluído(s) na OS. Selecione mais ou clique em Concluir.`);

        onSuccess(qtdAdded);
      } else {
        alert('Erro: ' + json.message);
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar itens.');
    } finally {
      setSaving(false);
    }
  };

  const handleConcluir = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const totalSelected = Object.keys(selectedItems).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#32423D] text-white rounded-t-lg">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Plus size={20} /> Incluir Materiais na O.S. #{osId}
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Busque e selecione materiais. Os recursos cadastrados para cada material são carregados automaticamente das tabelas <i>material_processo</i> e <i>processofabricacao</i>.
              {totalAdded > 0 && <span className="ml-2 font-bold text-[#E0E800]">({totalAdded} material(is) já incluído(s))</span>}
            </p>
          </div>
          <button
            onClick={handleConcluir}
            className="px-3 py-1.5 bg-white/10 hover:bg-red-600/80 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Fechar Modal"
          >
            <X size={16} /> Fechar e Retornar
          </button>
        </div>

        {/* Toast de sucesso */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-emerald-700 text-xs font-medium">
            <CheckCircle size={14} className="shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Banner de erro de validação */}
        {validationError && (
          <div className="bg-red-50 border-b border-red-300 px-4 py-3 flex gap-3 items-start">
            <span className="text-red-500 text-lg leading-none shrink-0">🚫</span>
            <div className="flex-1">
              <p className="text-red-700 font-bold text-xs mb-1">Inclusão bloqueada — recursos ausentes</p>
              <pre className="text-red-600 text-[10.5px] whitespace-pre-wrap font-medium leading-relaxed">{validationError}</pre>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0 mt-0.5"
              title="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left panel - Search */}
          <div className="flex-1 flex flex-col border-r border-gray-200 min-w-0">
            <div className="p-3 border-b bg-gray-50 flex flex-col gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Buscar por código ou descrição..."
                    className="w-full px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-[#32423D] pr-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button type="submit" className="bg-[#32423D] text-white px-3 py-1.5 rounded hover:bg-[#E0E800]/90 hover:text-black transition-colors">
                  <Search size={16} />
                </button>
              </form>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Acabamento Geral:</label>
                <select 
                   className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:border-[#32423D]"
                   value={globalAcabamento}
                   onChange={e => setGlobalAcabamento(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {acabamentos.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-2 bg-gray-50">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#32423D]" size={30} /></div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.filter(mat => !selectedItems[mat.CodMatFabricante]?.alreadyInOS).map(mat => {
                    const isSelected = !!selectedItems[mat.CodMatFabricante];
                    const currentItem = selectedItems[mat.CodMatFabricante];
                    const currentQtde = currentItem?.qtde || 1;

                    return (
                      <div 
                        key={mat.CodMatFabricante}
                        onClick={() => toggleSelection(mat)}
                        className={`px-3 py-2 bg-white border rounded-lg shadow-xs cursor-pointer transition-all hover:border-[#32423D] ${isSelected ? 'border-[#E0E800] ring-1 ring-[#E0E800] bg-[#FAFAEE]' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0 flex items-center">
                            <span 
                              className="text-xs font-bold text-gray-800 whitespace-nowrap"
                              title={(() => {
                                const res: {name: string, seq: number}[] = [];
                                const check = (txtField: string, name: string, seqField: string) => {
                                    const val = String(mat[txtField] || '').trim().toUpperCase();
                                    if (val === '1' || val === 'S') {
                                        res.push({ name, seq: parseInt(mat[seqField]) || 999 });
                                    }
                                };
                                check('txtCorte', 'Corte', 'CorteSequencia');
                                check('txtDobra', 'Dobra', 'DobraSequencia');
                                check('txtSolda', 'Solda', 'SoldaSequencia');
                                check('txtPintura', 'Pintura', 'PinturaSequencia');
                                check('TxtMontagem', 'Montagem', 'MontagemSequencia');
                                check('txtmontagem', 'Montagem', 'MontagemSequencia');
                                check('txtCorteaLaser', 'Corte a Laser', 'CorteaLaserSequencia');
                                check('txtPUNSIONADEIRA', 'Punsionadeira', 'PunsionadeiraSequencia');
                                check('txtGALVANIZAR', 'Galvanizar', 'GalvanizarSequencia');
                                check('txtENGENHARIA', 'Engenharia', 'EngenhariaSequencia');
                                check('txtMEDICAO', 'Medição', 'MedicaoSequencia');
                                check('txtISOMETRICO', 'Isométrico', 'IsometricoSequencia');
                                check('txtACABAMENTO', 'Acabamento', 'AcabamentoSequencia');
                                check('txtAPROVACAO', 'Aprovação', 'AprovacaoSequencia');
                                
                                res.sort((a, b) => a.seq - b.seq);
                                if (res.length > 0) {
                                    return res.map(r => `${r.seq === 999 ? '-' : r.seq}º: ${r.name}`).join(' | ');
                                }
                                return 'Nenhum recurso definido';
                              })()}
                            >
                              {mat.CodMatFabricante}
                            </span>
                            <span className="text-[10px] text-gray-600 ml-2 truncate text-ellipsis">{mat.DescResumo}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-bold text-gray-500">Qtd:</label>
                              <input 
                                type="number" min="1" step="1"
                                className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs font-bold text-center focus:outline-none focus:border-[#32423D] bg-white"
                                value={currentQtde}
                                onChange={e => {
                                  const v = Math.max(1, parseInt(e.target.value) || 1);
                                  if (isSelected) {
                                    updateItem(mat.CodMatFabricante, 'qtde', v);
                                  } else {
                                    toggleSelection(mat);
                                    updateItem(mat.CodMatFabricante, 'qtde', v);
                                  }
                                }}
                              />
                            </div>

                            {isSelected ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                                <Check size={12} /> Selecionado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleSelection(mat)}
                                className="p-1 text-gray-400 hover:text-[#32423D] hover:bg-gray-100 rounded transition-colors"
                                title="Incluir material"
                              >
                                <Plus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {existingOsCodigos.length > 0 ? 'Nenhum material disponível para incluir (materiais existentes na OS foram ocultados).' : 'Nenhum resultado encontrado.'}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Selected Items */}
          <div className="w-full md:w-[410px] shrink-0 flex flex-col bg-white">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-700 text-sm">Itens Selecionados ({totalSelected})</h3>
                {totalSelected > 0 && (
                  <span className="text-[10px] text-slate-500">Recursos via material_processo</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-3">
              {totalSelected === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Nenhum item selecionado na lista à esquerda.</div>
              ) : (
                Object.keys(selectedItems).map(cod => {
                  const item = selectedItems[cod];
                  const mat = searchResults.find(m => m.CodMatFabricante === cod) || { DescResumo: item.desc || 'Desconhecido' };
                  const itemQtde = item.qtde || 1;
                  const itemFator = Math.max(1, item.fator || 1);
                  const isProcLoading = !!loadingProcessos[cod];
                  const procsList = itemProcessos[cod];

                  return (
                    <div key={cod} className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs flex flex-col gap-2">
                      {/* Card Header com Codigo, Descricao, Qtd, Fator e Botao de Remover */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-xs font-black text-slate-800">{cod}</span>
                          <span className="text-[10.5px] text-slate-500 block truncate">{mat.DescResumo}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 border rounded">
                            <span className="text-[10px] font-bold text-slate-500">Qtd:</span>
                            <input
                              type="number" min="1" step="1"
                              className="w-12 px-1 py-0.5 border border-slate-300 rounded text-xs font-bold text-center focus:outline-none focus:border-[#32423D]"
                              value={item.qtde}
                              onChange={e => updateItem(cod, 'qtde', parseInt(e.target.value) || 1)}
                            />
                            <button
                              onClick={() => handleSaveQuantity(cod)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded p-1 shadow-sm transition-colors ml-1"
                              title="Salvar TotalExecutar"
                            >
                              <Check size={14} className="stroke-[3]" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 ml-2">
                            {isProcLoading && <Loader2 size={12} className="animate-spin text-[#32423D]" />}
                            <button
                              type="button"
                              onClick={() => toggleRecursos(cod)}
                              className="text-[9.5px] font-bold text-[#32423D] hover:text-black bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300 flex items-center transition-colors"
                            >
                              {recursosVisible[cod] ? 'Ocultar Recursos' : 'Exibir Recursos'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMontarRecursoCod(cod)}
                              className="text-[9.5px] font-bold text-[#32423D] hover:text-black bg-slate-100 hover:bg-[#E0E800]/40 px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1 transition-colors"
                              title="Abrir tela de Montagem Processo Fabricação para este item"
                            >
                              <Wrench size={11} /> Montar Recursos
                            </button>
                          </div>

                          <button onClick={() => toggleSelection({ CodMatFabricante: cod } as any)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors shrink-0 ml-1" title="Remover item">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="pt-0">
                        {recursosVisible[cod] && (
                          <>
                            {isProcLoading ? (
                              <div className="flex items-center gap-2 py-4 justify-center text-[10.5px] text-slate-500 bg-slate-50 rounded">
                                <Loader2 size={14} className="animate-spin text-[#32423D]" />
                                <span>Buscando recursos em material_processo...</span>
                              </div>
                            ) : procsList && procsList.length > 0 ? (
                              <div className="space-y-2 max-h-60 overflow-auto pr-1 mt-2">
                            {procsList.map(sec => {
                              const recVal = item.recursoTempos?.[sec.key] || { tempoSetup: sec.tempoSetup, tempoPadrao: sec.tempoPadrao };
                              const recSetup = recVal.tempoSetup;
                              const recPadrao = recVal.tempoPadrao;
                              const recTotal = ((recPadrao * itemQtde) + recSetup) * itemFator;

                              return (
                                <div key={sec.key} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[9.5px] flex flex-col gap-1">
                                  <div className="flex items-center justify-between font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                                      <span className="w-2 h-2 rounded-full bg-[#32423D]" />
                                      {sec.label}
                                    </span>
                                    <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded">
                                      Tempo Total: {recTotal} min
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div>
                                      <span className="text-slate-500 font-bold block mb-0.5">Setup (min):</span>
                                      <input
                                        type="number" min="0" step="1"
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-[#32423D] bg-white shadow-xs"
                                        value={recSetup}
                                        onChange={e => updateRecursoTempo(cod, sec.key, 'tempoSetup', parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block mb-0.5">Padrão (min):</span>
                                      <input
                                        type="number" min="0" step="1"
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-[#32423D] bg-white shadow-xs"
                                        value={recPadrao}
                                        onChange={e => updateRecursoTempo(cod, sec.key, 'tempoPadrao', parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                        <div className="col-span-2 flex justify-end mt-1">
                          <button
                            onClick={() => handleSaveRecurso(cod, sec.key)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded px-2 py-1 flex items-center gap-1 shadow-sm transition-colors text-[9px]"
                            title="Salvar Tempos e Quantidade"
                          >
                            <Check size={12} className="stroke-[3]" /> Salvar
                          </button>
                        </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : procsList && procsList.length === 0 ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[10.5px] text-amber-800 font-medium text-center">
                            ⚠️ Não encontrou recurso/processo para este material.
                          </div>
                        ) : null}
                        </>
                      )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
          </div>
          
        </div>
      </div>

      {/* Modal de Montagem Processo Fabricacao */}
      <ModalMontagemProcessoFabricacao
        isOpen={!!montarRecursoCod}
        codmatfabricante={montarRecursoCod || undefined}
        osId={osId}
        osContext={osContext}
        qtdSelecionada={montarRecursoCod ? selectedItems[montarRecursoCod]?.qtde : undefined}
        onClose={async () => {
          const cod = montarRecursoCod;
          setMontarRecursoCod(null);
          if (cod) {
            await fetchMaterialProcessos(cod, true);
          }
        }}
      />
    </div>
  );
}
