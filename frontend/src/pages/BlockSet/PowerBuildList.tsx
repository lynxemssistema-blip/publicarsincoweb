import React, { useEffect, useState } from 'react';
import { 
    FileSpreadsheet, Search, Filter, Calendar, 
    ChevronRight, ArrowRight, RefreshCw, Loader2,
    Database, Tag as TagIcon, LayoutGrid, CheckSquare, 
    Square, Trash2, Save, AlertCircle, FileText
} from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';

interface Projeto {
    IdProjeto: number;
    Projeto: string;
}

interface Tag {
    IdTag: number;
    NomeTag: string;
}

interface ProcessableItem {
    IdDado: number;
    TabelaOrigem: string;
    PD_qty: number;
    Part_Reference: string;
    Part_total_qty: number;
    Revisao: number;
    IdProjeto: number;
    IdTag: number;
    NomeProjeto: string;
    NomeTag: string;
    NomePlanilha: string;
    IdOrdemServico: number;
    DescricaoOS: string;
    selected?: boolean;
}

interface OSDestino {
    IdOrdemServico: number;
    DescricaoOS: string;
}

interface PowerBuildListProps {
    onNavigate: (pageId: string) => void;
}

const PowerBuildList: React.FC<PowerBuildListProps> = ({ onNavigate }) => {
    const { showAlert } = useAlert();
    const { user } = useAuth();
    
    // Filter states
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [planilhas, setPlanilhas] = useState<string[]>([]);
    const [revisoes, setRevisoes] = useState<number[]>([]);
    const [osDestinoList, setOsDestinoList] = useState<OSDestino[]>([]);

    const [selectedProjeto, setSelectedProjeto] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [selectedPlanilha, setSelectedPlanilha] = useState('');
    const [selectedRevisao, setSelectedRevisao] = useState<number | string>(-1);
    const [selectedOS, setSelectedOS] = useState('');
    const [codMatFilter, setCodMatFilter] = useState('');

    // Data states
    const [items, setItems] = useState<ProcessableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Initial Load: Projects
    useEffect(() => {
        const fetchProjetos = async () => {
            try {
                const res = await fetch('/api/blockset/projetos');
                const data = await res.json();
                if (data.success) setProjetos(data.data);
            } catch (error) {
                console.error('Erro ao buscar projetos:', error);
            }
        };
        fetchProjetos();
    }, []);

    // Load Tags when Project changes
    useEffect(() => {
        if (!selectedProjeto) {
            setTags([]);
            return;
        }
        const fetchTags = async () => {
            try {
                const res = await fetch(`/api/blockset/tags/${selectedProjeto}`);
                const data = await res.json();
                if (data.success) setTags(data.data);
            } catch (error) {
                console.error('Erro ao buscar tags:', error);
            }
        };
        fetchTags();
    }, [selectedProjeto]);

    // Load Planilhas when Tag changes
    useEffect(() => {
        if (!selectedProjeto || !selectedTag) {
            setPlanilhas([]);
            return;
        }
        const fetchPlanilhas = async () => {
            try {
                const res = await fetch(`/api/blockset/planilhas/${selectedProjeto}/${selectedTag}`);
                const data = await res.json();
                if (data.success) setPlanilhas(data.data.map((p: any) => p.NomePlanilha));
            } catch (error) {
                console.error('Erro ao buscar planilhas:', error);
            }
        };
        const fetchOS = async () => {
            try {
                // OS not liberated, not finished, for the selected tag
                const res = await fetch(`/api/blockset/ordens-servico/tag/${selectedTag}`);
                const data = await res.json();
                // Filter further if needed (backend might already do it)
                if (data.success) {
                    setOsDestinoList(data.data.map((os: any) => ({
                        IdOrdemServico: os.IdOrdemServico,
                        DescricaoOS: `${os.IdOrdemServico} - ${os.Descricao || ''}`
                    })));
                }
            } catch (error) {
                console.error('Erro ao buscar OS:', error);
            }
        };
        fetchPlanilhas();
        fetchOS();
    }, [selectedProjeto, selectedTag]);

    // Load Revisions when Planilha changes
    useEffect(() => {
        if (!selectedProjeto || !selectedTag || !selectedPlanilha) {
            setRevisoes([]);
            return;
        }
        const fetchRevisions = async () => {
            try {
                const res = await fetch('/api/blockset/revisions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idProjeto: selectedProjeto, idTag: selectedTag, nomePlanilha: selectedPlanilha })
                });
                const data = await res.json();
                if (data.success) setRevisoes(data.data.map((r: any) => r.Revisao));
            } catch (error) {
                console.error('Erro ao buscar revisões:', error);
            }
        };
        fetchRevisions();
    }, [selectedProjeto, selectedTag, selectedPlanilha]);

    const handleSearch = async () => {
        if (!selectedProjeto || !selectedTag || !selectedPlanilha) {
            showAlert('Selecione Projeto, Tag e Planilha.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/blockset/processable-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idProjeto: selectedProjeto,
                    idTag: selectedTag,
                    nomePlanilha: selectedPlanilha,
                    revisao: selectedRevisao === 'Todas' ? -1 : selectedRevisao,
                    codMatFilter: codMatFilter
                })
            });
            const data = await res.json();
            if (data.success) {
                setItems(data.data.map((item: any) => ({ ...item, selected: false })));
                if (data.data.length === 0) {
                    showAlert('Nenhum item encontrado para os filtros selecionados.', 'info');
                }
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            showAlert('Erro ao buscar itens.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelectAll = (select: boolean) => {
        setItems(prev => prev.map(item => ({ ...item, selected: select })));
    };

    const handleToggleItem = (id: number) => {
        setItems(prev => prev.map(item => item.IdDado === id ? { ...item, selected: !item.selected } : item));
    };

    const handleSave = async () => {
        const selectedItems = items.filter(i => i.selected);
        if (selectedItems.length === 0) {
            showAlert('Nenhum item selecionado.', 'warning');
            return;
        }
        if (!selectedOS) {
            showAlert('Selecione uma Ordem de Serviço de destino.', 'warning');
            return;
        }

        // Confirmation (Aglutinado Mode)
        const confirmMsg = "Atenção: Todos os itens existentes nesta OS serão EXCLUÍDOS e substituídos pelos itens selecionados. Deseja continuar?";
        if (!window.confirm(confirmMsg)) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/blockset/process-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idOSDestino: selectedOS,
                    items: selectedItems,
                    usuario: user?.nome || 'Sistema'
                })
            });
            const data = await res.json();
            if (data.success) {
                showAlert(data.message, 'success');
                if (data.missingMaterials?.length > 0) {
                    showAlert(`${data.missingMaterials.length} materiais não cadastrados foram enviados para a lista de pendentes.`, 'warning');
                }
                // Refresh list
                handleSearch();
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            showAlert('Erro no processamento.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleClear = () => {
        setSelectedProjeto('');
        setSelectedTag('');
        setSelectedPlanilha('');
        setSelectedRevisao(-1);
        setSelectedOS('');
        setCodMatFilter('');
        setItems([]);
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="bg-blue-500/20 text-blue-400 p-2.5 rounded-xl border border-blue-500/30">
                                <FileSpreadsheet className="w-8 h-8" />
                            </span>
                            Lista Itens da Planilha
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Visualize, aglutine e inclua itens importados em Ordens de Serviço.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onNavigate('powerbuild-import')}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 transition-all flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Nova Importação
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Projeto</label>
                            <select 
                                value={selectedProjeto}
                                onChange={e => { setSelectedProjeto(e.target.value); setSelectedTag(''); }}
                                className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition-all text-sm"
                            >
                                <option value="">Selecione o Projeto</option>
                                {projetos.map(p => <option key={p.IdProjeto} value={p.IdProjeto}>{p.Projeto}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tag / OS</label>
                            <select 
                                value={selectedTag}
                                onChange={e => setSelectedTag(e.target.value)}
                                disabled={!selectedProjeto}
                                className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition-all text-sm disabled:opacity-50"
                            >
                                <option value="">Selecione a Tag</option>
                                {tags.map(t => <option key={t.IdTag} value={t.IdTag}>{t.NomeTag}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Planilha</label>
                            <select 
                                value={selectedPlanilha}
                                onChange={e => setSelectedPlanilha(e.target.value)}
                                disabled={!selectedTag}
                                className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition-all text-sm disabled:opacity-50"
                            >
                                <option value="">Selecione a Planilha</option>
                                {planilhas.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Revisão</label>
                            <select 
                                value={selectedRevisao}
                                onChange={e => setSelectedRevisao(e.target.value)}
                                disabled={!selectedPlanilha}
                                className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition-all text-sm disabled:opacity-50"
                            >
                                <option value="-1">Todas</option>
                                {revisoes.map(r => <option key={r} value={r}>Revisão {r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filtrar por Código</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    placeholder="Ex: 1SVR405622R0000"
                                    value={codMatFilter}
                                    onChange={e => setCodMatFilter(e.target.value)}
                                    className="w-full bg-[#0B1120] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 focus:border-blue-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button 
                                onClick={handleSearch}
                                disabled={loading || !selectedPlanilha}
                                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Pesquisar
                            </button>
                            <button 
                                onClick={handleClear}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl font-medium border border-gray-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Processing Controls (Visible after search) */}
                {items.length > 0 && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                            <div className="space-y-2 w-full md:w-80">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">OS de Destino</label>
                                <select 
                                    value={selectedOS}
                                    onChange={e => setSelectedOS(e.target.value)}
                                    className="w-full bg-[#0B1120] border border-blue-500/30 rounded-xl px-4 py-2.5 focus:border-blue-400 outline-none transition-all text-sm text-white"
                                >
                                    <option value="">Selecione a OS Destino</option>
                                    {osDestinoList.map(os => <option key={os.IdOrdemServico} value={os.IdOrdemServico}>{os.DescricaoOS}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleToggleSelectAll(true)}
                                    className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <CheckSquare className="w-4 h-4" /> Marcar Todos
                                </button>
                                <button 
                                    onClick={() => handleToggleSelectAll(false)}
                                    className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Square className="w-4 h-4" /> Desmarcar Todos
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={processing || !selectedOS}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20 active:scale-95"
                        >
                            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Processar e Salvar na OS
                        </button>
                    </div>
                )}

                {/* Grid */}
                <div className="bg-[#111827] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#1F2937] border-b border-gray-700">
                                    <th className="py-4 px-6 w-12">
                                        <div className="flex items-center justify-center">
                                            <Filter className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-gray-300">Cod. Mat. Fabricante</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-gray-300 text-center">Única</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-gray-300 text-center">Total</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-gray-300 text-center">Rev</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-gray-300">OS Associada</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-gray-300">Descrição OS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-gray-500">
                                                <LayoutGrid className="w-12 h-12 opacity-20" />
                                                <p>Realize uma busca para visualizar os itens.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr 
                                            key={item.IdDado} 
                                            className={`group transition-colors ${item.selected ? 'bg-blue-500/10' : 'hover:bg-[#1F2937]/50'}`}
                                            onClick={() => handleToggleItem(item.IdDado)}
                                        >
                                            <td className="py-3 px-6 text-center">
                                                <div className="flex items-center justify-center">
                                                    {item.selected ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-500" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-700 group-hover:text-gray-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-mono font-bold text-white tracking-wider">{item.Part_Reference}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium">{item.TabelaOrigem}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-center font-medium text-sm">{item.PD_qty}</td>
                                            <td className="py-3 px-6 text-center font-bold text-sm text-blue-400">{item.Part_total_qty}</td>
                                            <td className="py-3 px-6 text-center">
                                                <span className="text-[10px] font-bold bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                                                    R{item.Revisao}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6">
                                                {item.IdOrdemServico > 0 ? (
                                                    <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                                        {item.IdOrdemServico}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-600 italic">Nenhuma</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className="text-xs text-gray-400 truncate max-w-[200px] inline-block" title={item.DescricaoOS}>
                                                    {item.DescricaoOS || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                {items.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                        <div className="flex gap-4">
                            <span>Total de Itens: <strong className="text-white">{items.length}</strong></span>
                            <span>Selecionados: <strong className="text-blue-400">{items.filter(i => i.selected).length}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 italic">
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                            <span>Itens rosa indicam material não cadastrado no sistema.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PowerBuildList;
