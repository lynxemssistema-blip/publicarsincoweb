import React, { useState, useEffect } from 'react';

import { 
    Search, Filter, Save, X, Calendar, Edit3, Briefcase, 
    ChevronDown, ChevronUp, AlertCircle, CheckCircle, Maximize2, Minimize2
} from 'lucide-react';

interface EtapasRow {
    IdProjeto: number;
    Projeto: string;
    DataPrevisao: string;
    DataFinal: string;
    Cliente: string;
    EstadoOrigem: string;
    StatusProj: string;
    TotalTags: number;
    FaltaMedicao: number;
    OkMedicao: number;
    FaltaIsometrico: number;
    OkIsometrico: number;
    FaltaEngenharia: number;
    OkEngenharia: number;
    FaltaAprovacao: number;
    OkAprovacao: number;
    FaltaAcabamento: number;
    OkAcabamento: number;
    FaltaExpedicao: number;
    OkExpedicao: number;
}

export default function AcompanhamentoEtapas() {
    const [data, setData] = useState<EtapasRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    // Filtros
    const [filters, setFilters] = useState({
        projeto: '',
        cliente: '',
        estadoOrigem: '',
        dataPrevisaoInicio: '',
        dataPrevisaoFim: '',
        dataFinalInicio: '',
        dataFinalFim: '',
        dataPlanejamentoInicio: '',
        dataPlanejamentoFim: '',
        dataRealizadoInicio: '',
        dataRealizadoFim: ''
    });

    // Modal
    const [selectedProjeto, setSelectedProjeto] = useState<EtapasRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
            const response = await fetch(`/api/acompanhamento-etapas?${queryParams.toString()}`);
            const res = await response.json();
            setData(res.data || []);
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const openEditModal = (row: EtapasRow) => {
        setSelectedProjeto(row);
        // Em um caso real, buscaríamos as datas atuais do projeto.
        // Aqui estamos apenas inicializando vazio para que o usuário insira as novas datas que irão sobrepor em lote
        setEditForm({
            PlanejadoInicioMedicao: '', PlanejadoFinalMedicao: '', RealizadoInicioMedicao: '', RealizadoFinalMedicao: '',
            PlanejadoInicioIsometrico: '', PlanejadoFinalIsometrico: '', RealizadoInicioIsometrico: '', RealizadoFinalIsometrico: '',
            PlanejadoInicioEngenharia: '', PlanejadoFinalEngenharia: '', RealizadoInicioEngenharia: '', RealizadoFinalEngenharia: '',
            PlanejadoInicioAprovacao: '', PlanejadoFinalAprovacao: '', RealizadoInicioAprovacao: '', RealizadoFinalAprovacao: '',
            PlanejadoInicioAcabamento: '', PlanejadoFinalAcabamento: '', RealizadoInicioAcabamento: '', RealizadoFinalAcabamento: '',
            PlanejadoInicioExpedicao: '', PlanejadoFinalExpedicao: '', RealizadoInicioExpedicao: '', realizadoFinalExpedicao: ''
        });
        setIsModalOpen(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!selectedProjeto) return;
        setSaving(true);
        try {
            // Filtra apenas os campos que foram preenchidos (para não apagar os outros caso mande vazio)
            const payload: any = {};
            Object.entries(editForm).forEach(([key, val]) => {
                if (val) payload[key] = val;
            });

            if (Object.keys(payload).length === 0) {
                alert('Preencha ao menos uma data para atualizar as tags deste projeto.');
                setSaving(false);
                return;
            }

            const response = await fetch(`/api/acompanhamento-etapas/projeto/${selectedProjeto.IdProjeto}/bulk-update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao atualizar datas');
            }
            alert('Datas atualizadas com sucesso em todas as tags deste projeto!');
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert('Erro ao atualizar datas: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // Helper para gerar os campos do modal
    const renderFormRow = (titulo: string, sulfixo: string) => (
        <div className="grid grid-cols-5 gap-2 items-center mb-2 border-b border-gray-100 pb-2">
            <div className="font-semibold text-gray-700 text-xs uppercase">{titulo}</div>
            <div className="col-span-2 grid grid-cols-2 gap-2 border-r border-gray-200 pr-2">
                <div>
                    <label className="text-[10px] text-gray-500">Plan. Início</label>
                    <input type="text" placeholder="DD/MM/YYYY" name={`PlanejadoInicio${sulfixo}`} value={editForm[`PlanejadoInicio${sulfixo}`] || ''} onChange={handleEditChange} className="w-full text-xs p-1 border rounded" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500">Plan. Fim</label>
                    <input type="text" placeholder="DD/MM/YYYY" name={`PlanejadoFinal${sulfixo}`} value={editForm[`PlanejadoFinal${sulfixo}`] || ''} onChange={handleEditChange} className="w-full text-xs p-1 border rounded" />
                </div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2 pl-2">
                <div>
                    <label className="text-[10px] text-gray-500">Real. Início</label>
                    <input type="text" placeholder="DD/MM/YYYY" name={`RealizadoInicio${sulfixo}`} value={editForm[`RealizadoInicio${sulfixo}`] || ''} onChange={handleEditChange} className="w-full text-xs p-1 border rounded" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500">Real. Fim</label>
                    <input type="text" placeholder="DD/MM/YYYY" name={sulfixo === 'Expedicao' ? 'realizadoFinalExpedicao' : `RealizadoFinal${sulfixo}`} value={editForm[sulfixo === 'Expedicao' ? 'realizadoFinalExpedicao' : `RealizadoFinal${sulfixo}`] || ''} onChange={handleEditChange} className="w-full text-xs p-1 border rounded" />
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col bg-gray-50 transition-all duration-300 ${isExpanded ? 'fixed inset-0 z-50 overflow-hidden' : 'h-[calc(100vh-4rem)]'}`}>
                
                {/* HEADER & FILTERS */}
                <div className={`bg-white shadow-sm transition-all duration-300 ${(!showFilters && isExpanded) ? 'h-0 overflow-hidden opacity-0 p-0 m-0' : 'p-4 border-b border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-[#32423D] flex items-center gap-2">
                                <Briefcase className="text-[#03624C]" />
                                Acompanhamento de Etapas
                            </h1>
                            <p className="text-xs text-gray-500">Visão Geral de Projetos: Monitoramento de Áreas Complementares</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowFilters(!showFilters)} className="text-xs flex items-center gap-1 text-gray-600 hover:text-[#03624C] transition-colors border px-2 py-1 rounded bg-gray-50">
                                <Filter size={14} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                            </button>
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-gray-500 hover:text-[#03624C] transition-colors rounded border bg-gray-50" title={isExpanded ? "Restaurar" : "Maximizar"}>
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <form onSubmit={handleSearch} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-3">
                                {/* Campos Textuais */}
                                <div>
                                    <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Projeto (Doc)</label>
                                    <input type="text" name="projeto" value={filters.projeto} onChange={handleFilterChange} className="w-full text-xs p-1.5 border rounded focus:border-[#03624C] focus:ring-1 focus:ring-[#03624C] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Cliente / Obra</label>
                                    <input type="text" name="cliente" value={filters.cliente} onChange={handleFilterChange} className="w-full text-xs p-1.5 border rounded focus:border-[#03624C] focus:ring-1 focus:ring-[#03624C] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Estado Origem</label>
                                    <input type="text" name="estadoOrigem" value={filters.estadoOrigem} onChange={handleFilterChange} className="w-full text-xs p-1.5 border rounded focus:border-[#03624C] focus:ring-1 focus:ring-[#03624C] outline-none" />
                                </div>
                            </div>

                            {/* Filtros de Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="border border-gray-200 p-2 rounded bg-white">
                                    <label className="block text-[10px] uppercase font-semibold text-[#03624C] mb-1 flex items-center gap-1"><Calendar size={10}/> Data Previsão</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Início" name="dataPrevisaoInicio" value={filters.dataPrevisaoInicio} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                        <input type="text" placeholder="Fim" name="dataPrevisaoFim" value={filters.dataPrevisaoFim} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                    </div>
                                </div>
                                <div className="border border-gray-200 p-2 rounded bg-white">
                                    <label className="block text-[10px] uppercase font-semibold text-[#03624C] mb-1 flex items-center gap-1"><Calendar size={10}/> Data Final</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Início" name="dataFinalInicio" value={filters.dataFinalInicio} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                        <input type="text" placeholder="Fim" name="dataFinalFim" value={filters.dataFinalFim} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                    </div>
                                </div>
                                <div className="border border-gray-200 p-2 rounded bg-white">
                                    <label className="block text-[10px] uppercase font-semibold text-[#03624C] mb-1 flex items-center gap-1"><Calendar size={10}/> Data Planejamento</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Início" name="dataPlanejamentoInicio" value={filters.dataPlanejamentoInicio} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                        <input type="text" placeholder="Fim" name="dataPlanejamentoFim" value={filters.dataPlanejamentoFim} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                    </div>
                                </div>
                                <div className="border border-gray-200 p-2 rounded bg-white">
                                    <label className="block text-[10px] uppercase font-semibold text-[#03624C] mb-1 flex items-center gap-1"><Calendar size={10}/> Data Realizado</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Início" name="dataRealizadoInicio" value={filters.dataRealizadoInicio} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                        <input type="text" placeholder="Fim" name="dataRealizadoFim" value={filters.dataRealizadoFim} onChange={handleFilterChange} className="w-full text-xs p-1 border rounded outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button type="submit" className="bg-[#03624C] hover:bg-[#024a3a] text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition-colors">
                                    <Search size={16} /> Filtrar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* GRID SECTION */}
                <div className="flex-1 overflow-auto p-4 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#03624C]"></div>
                        </div>
                    ) : (
                        <div className="bg-white shadow-sm border border-gray-200 rounded-md overflow-hidden">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    {/* CABEÇALHO PRINCIPAL */}
                                    <tr className="bg-gray-100 text-gray-700 text-[10px] uppercase tracking-wider border-b-2 border-gray-300">
                                        <th rowSpan={2} className="p-2 border-r border-gray-300 sticky left-0 bg-gray-100 z-10 w-[80px]">Doc/Proj</th>
                                        <th rowSpan={2} className="p-2 border-r border-gray-300 sticky left-[80px] bg-gray-100 z-10 max-w-[200px]">Obra/Cliente</th>
                                        <th rowSpan={2} className="p-2 border-r border-gray-300 text-center">Região</th>
                                        <th rowSpan={2} className="p-2 border-r border-gray-300 text-center">Status</th>
                                        <th rowSpan={2} className="p-2 border-r-4 border-gray-400 text-center">Data Fim</th>
                                        
                                        <th colSpan={2} className="p-2 text-center border-r-2 border-gray-400 bg-blue-50">Medição</th>
                                        <th colSpan={2} className="p-2 text-center border-r-2 border-gray-400 bg-indigo-50">Isométrico</th>
                                        <th colSpan={2} className="p-2 text-center border-r-2 border-gray-400 bg-blue-50">Engenharia</th>
                                        <th colSpan={2} className="p-2 text-center border-r-2 border-gray-400 bg-indigo-50">Aprovação</th>
                                        <th colSpan={2} className="p-2 text-center border-r-2 border-gray-400 bg-blue-50">Acabamento</th>
                                        <th colSpan={2} className="p-2 text-center bg-indigo-50">Expedição</th>
                                        <th rowSpan={2} className="p-2 border-l border-gray-300 text-center sticky right-0 bg-gray-100 z-10">Ações</th>
                                    </tr>
                                    {/* SUB-CABEÇALHO (Falta/Ok) */}
                                    <tr className="text-[10px] uppercase text-gray-600 border-b border-gray-300">
                                        {Array.from({length: 6}).map((_, i) => (
                                            <React.Fragment key={i}>
                                                <th className="p-1.5 text-center border-r border-gray-200 bg-red-50 text-red-700 font-bold w-[50px]">Falta</th>
                                                <th className="p-1.5 text-center border-r-2 border-gray-400 bg-green-50 text-green-700 font-bold w-[50px]">Ok</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-gray-700">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={18} className="p-8 text-center text-gray-500">Nenhum projeto encontrado.</td>
                                        </tr>
                                    ) : (
                                        data.map(row => (
                                            <tr key={row.IdProjeto} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="p-2 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 font-medium text-[#03624C]">{row.Projeto || row.IdProjeto}</td>
                                                <td className="p-2 border-r border-gray-200 sticky left-[80px] bg-white group-hover:bg-gray-50 truncate max-w-[200px]" title={row.Cliente}>{row.Cliente}</td>
                                                <td className="p-2 border-r border-gray-200 text-center">{row.EstadoOrigem}</td>
                                                <td className="p-2 border-r border-gray-200 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.StatusProj?.toUpperCase() === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {row.StatusProj}
                                                    </span>
                                                </td>
                                                <td className="p-2 border-r-4 border-gray-400 text-center whitespace-nowrap">{row.DataFinal}</td>
                                                
                                                {/* MEDIÇÃO */}
                                                <td className="p-2 border-r border-gray-200 text-center font-semibold text-red-600 bg-red-50/30">{row.FaltaMedicao}</td>
                                                <td className="p-2 border-r-2 border-gray-400 text-center font-semibold text-green-600 bg-green-50/30">{row.OkMedicao}</td>
                                                
                                                {/* ISOMETRICO */}
                                                <td className="p-2 border-r border-gray-200 text-center font-semibold text-red-600 bg-red-50/30">{row.FaltaIsometrico}</td>
                                                <td className="p-2 border-r-2 border-gray-400 text-center font-semibold text-green-600 bg-green-50/30">{row.OkIsometrico}</td>
                                                
                                                {/* ENGENHARIA */}
                                                <td className="p-2 border-r border-gray-200 text-center font-semibold text-red-600 bg-red-50/30">{row.FaltaEngenharia}</td>
                                                <td className="p-2 border-r-2 border-gray-400 text-center font-semibold text-green-600 bg-green-50/30">{row.OkEngenharia}</td>
                                                
                                                {/* APROVACAO */}
                                                <td className="p-2 border-r border-gray-200 text-center font-semibold text-red-600 bg-red-50/30">{row.FaltaAprovacao}</td>
                                                <td className="p-2 border-r-2 border-gray-400 text-center font-semibold text-green-600 bg-green-50/30">{row.OkAprovacao}</td>
                                                
                                                {/* ACABAMENTO */}
                                                <td className="p-2 border-r border-gray-200 text-center font-semibold text-red-600 bg-red-50/30">{row.FaltaAcabamento}</td>
                                                <td className="p-2 border-r-2 border-gray-400 text-center font-semibold text-green-600 bg-green-50/30">{row.OkAcabamento}</td>
                                                
                                                {/* EXPEDICAO */}
                                                <td className="p-2 border-r border-gray-200 text-center font-semibold text-red-600 bg-red-50/30">{row.FaltaExpedicao}</td>
                                                <td className="p-2 text-center font-semibold text-green-600 bg-green-50/30">{row.OkExpedicao}</td>

                                                {/* AÇÕES */}
                                                <td className="p-2 border-l border-gray-200 text-center sticky right-0 bg-white group-hover:bg-gray-50">
                                                    <button onClick={() => openEditModal(row)} className="text-[#03624C] hover:text-[#024a3a] p-1 bg-teal-50 hover:bg-teal-100 rounded transition-colors" title="Editar Datas Lote">
                                                        <Edit3 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL DE EDIÇÃO EM LOTE */}
                {isModalOpen && selectedProjeto && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                                <div>
                                    <h3 className="text-lg font-bold text-[#32423D] flex items-center gap-2">
                                        <Edit3 className="text-[#03624C]" size={20} />
                                        Alterar Datas em Lote (Etapas)
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Projeto: <strong className="text-gray-800">{selectedProjeto.Projeto || selectedProjeto.IdProjeto}</strong> - {selectedProjeto.Cliente}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 flex-1 overflow-y-auto">
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded mb-4 flex items-start gap-2">
                                    <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-amber-800">
                                        As datas informadas abaixo serão aplicadas a <strong>todas as {selectedProjeto.TotalTags} Tags</strong> deste projeto, sobrescrevendo valores antigos. Deixe em branco o que não quiser alterar.
                                    </p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-md p-4">
                                    {renderFormRow('Medição', 'Medicao')}
                                    {renderFormRow('Isométrico', 'Isometrico')}
                                    {renderFormRow('Engenharia', 'Engenharia')}
                                    {renderFormRow('Aprovação', 'Aprovacao')}
                                    {renderFormRow('Acabamento', 'Acabamento')}
                                    {renderFormRow('Expedição', 'Expedicao')}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    disabled={saving}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#03624C] hover:bg-[#024a3a] text-white rounded text-sm font-medium shadow flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Salvando...</>
                                    ) : (
                                        <><Save size={16} /> Salvar Datas em Lote</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}
