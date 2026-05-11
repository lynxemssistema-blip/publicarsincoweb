import React, { useState, useEffect } from 'react';
import { 
    FilePlus, Upload, ShieldAlert, Clock, 
    Database, Tag as TagIcon, CheckCircle2, 
    AlertTriangle, Loader2, FileSpreadsheet,
    Layers, Trash2, Settings2
} from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';

interface Projeto {
    IdProjeto: number;
    Projeto: string;
}

interface Tag {
    IdTag: number;
    Tag: string;
}

interface PlanilhaMaster {
    NomeArquivo: string;
}

const PowerBuildImport: React.FC = () => {
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    
    // Form States
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedProjeto, setSelectedProjeto] = useState<string>('');
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isRevision, setIsRevision] = useState(false);
    const [masterPlanilhas, setMasterPlanilhas] = useState<PlanilhaMaster[]>([]);
    const [selectedMaster, setSelectedMaster] = useState('');
    const [showTruncate, setShowTruncate] = useState(false);

    useEffect(() => {
        fetchProjetos();
        // Check structure on mount
        handleInitDB();
    }, []);

    useEffect(() => {
        if (selectedProjeto) {
            fetchTags(parseInt(selectedProjeto));
            fetchMasterPlanilhas(parseInt(selectedProjeto));
        } else {
            setTags([]);
            setMasterPlanilhas([]);
        }
    }, [selectedProjeto]);

    const fetchProjetos = async () => {
        try {
            // Aplicar filtros: Liberado='S' e Não Finalizado
            const res = await fetch('/api/projeto?liberado=S&finalizado=N');
            const data = await res.json();
            if (data.success) setProjetos(data.data);
        } catch (e) {
            console.error('Erro ao buscar projetos:', e);
            showAlert('Erro ao carregar lista de projetos.', 'error');
        }
    };

    const fetchTags = async (idProj: number) => {
        try {
            const res = await fetch(`/api/projeto/${idProj}/tags`);
            const data = await res.json();
            if (data.success) setTags(data.data);
        } catch (e) {
            console.error('Erro ao buscar tags:', e);
            showAlert('Erro ao carregar lista de tags.', 'error');
        }
    };

    const fetchMasterPlanilhas = async (idProj: number) => {
        try {
            const res = await fetch('/api/blockset/files');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const data = await res.json();
            if (data.success) {
                // Filter planilhas for this project
                const filtered = data.data
                    .filter((p: any) => p.IdProjeto === idProj)
                    .map((p: any) => ({ NomeArquivo: p.NomeArquivo }));
                
                // Unique file names
                const unique = Array.from(new Set(filtered.map((p: any) => p.NomeArquivo)))
                    .map(name => ({ NomeArquivo: name as string }));
                
                setMasterPlanilhas(unique);
            }
        } catch (e) {
            console.error('Erro ao buscar planilhas mestre:', e);
            showAlert('Erro ao carregar histórico de planilhas.', 'error');
        }
    };

    const handleInitDB = async () => {
        setInitializing(true);
        try {
            const res = await fetch('/api/blockset/init-db', { method: 'POST' });
            
            if (res.status === 401) {
                showAlert('Sessão expirada. Por favor, faça login novamente.', 'error');
                return;
            }

            if (!res.ok) {
                const text = await res.text();
                console.error('Init DB Error:', text);
                showAlert(`Erro no servidor (${res.status}).`, 'error');
                return;
            }

            const data = await res.json();
            if (!data.success) {
                showAlert(data.message || 'Falha ao inicializar estrutura.', 'error');
            }
        } catch (e) {
            console.error('Connection Error:', e);
            showAlert('Erro de conexão ao servidor.', 'error');
        } finally {
            setInitializing(false);
        }
    };

    const handleTruncate = async () => {
        if (!window.confirm('ATENÇÃO: Isso apagará TODOS os dados de importação de planilhas. Deseja continuar?')) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/blockset/truncate', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showAlert('Tabelas limpas com sucesso!', 'success');
            } else {
                showAlert(data.message, 'error');
            }
        } catch (e) {
            showAlert('Erro de conexão.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjeto || !selectedTag || !file) {
            showAlert('Preencha todos os campos e selecione um arquivo.', 'warning');
            return;
        }

        if (isRevision && !selectedMaster) {
            showAlert('Selecione a planilha mestre para vincular a revisão.', 'warning');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idProjeto', selectedProjeto);
        formData.append('idTag', selectedTag);
        
        const projName = (Array.isArray(projetos) ? projetos : []).find(p => p.IdProjeto?.toString() === selectedProjeto)?.Projeto || '';
        const tagName = (Array.isArray(tags) ? tags : []).find(t => t.IdTag?.toString() === selectedTag)?.Tag || '';
        
        formData.append('nomeProjeto', projName);
        formData.append('nomeTag', tagName);
        formData.append('isRevision', isRevision.toString());
        formData.append('masterFileName', selectedMaster);

        try {
            const res = await fetch('/api/blockset/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showAlert(data.message, 'success');
                // Reset file
                setFile(null);
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            showAlert('Erro ao realizar importação.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="bg-blue-500/20 text-blue-400 p-2.5 rounded-xl border border-blue-500/30">
                                <FilePlus className="w-8 h-8" />
                            </span>
                            Leitura de Dados (Power Build)
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Importe planilhas BlockSet (data) ou PixEasy (bom) para o sistema.
                        </p>
                    </div>

                    {user?.dbName === 'lynxlocal' && (
                        <button 
                            onClick={handleTruncate}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all text-sm font-bold"
                        >
                            <Trash2 className="w-4 h-4" />
                            Limpar Base (Truncate)
                        </button>
                    )}
                </div>

                {initializing && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3 text-blue-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Verificando estrutura do banco de dados...</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-[#111827] rounded-3xl border border-gray-800 p-8 shadow-2xl space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>

                            {/* Step 1: Context Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
                                    <Layers className="w-4 h-4" />
                                    1. Definir Contexto
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Projeto</label>
                                        <select 
                                            value={selectedProjeto}
                                            onChange={e => setSelectedProjeto(e.target.value)}
                                            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition-all text-sm"
                                        >
                                            <option value="">Selecione o Projeto</option>
                                            {Array.isArray(projetos) && projetos.map(p => (
                                                <option key={p?.IdProjeto} value={p?.IdProjeto}>{p?.Projeto}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tag / OS</label>
                                        <select 
                                            value={selectedTag}
                                            onChange={e => setSelectedTag(e.target.value)}
                                            disabled={!selectedProjeto}
                                            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition-all text-sm disabled:opacity-50"
                                        >
                                            <option value="">Selecione a Tag</option>
                                            {Array.isArray(tags) && tags.map(t => (
                                                <option key={t?.IdTag} value={t?.IdTag}>{t?.Tag}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Revision Logic */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
                                    <Settings2 className="w-4 h-4" />
                                    2. Opções de Importação
                                </div>
                                <div className="bg-[#0B1120] p-4 rounded-2xl border border-gray-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-white">Modo de Inclusão</p>
                                            <p className="text-[10px] text-gray-500">Defina se esta planilha é uma nova importação ou revisão.</p>
                                        </div>
                                        <div className="flex bg-[#1F2937] p-1 rounded-lg">
                                            <button 
                                                type="button"
                                                onClick={() => setIsRevision(false)}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isRevision ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Nova (Rev 0)
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setIsRevision(true)}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isRevision ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Revisão
                                            </button>
                                        </div>
                                    </div>

                                    {isRevision && (
                                        <div className="animate-fade-in space-y-2 pt-2 border-t border-gray-800">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Vincular à Planilha Mestre</label>
                                            {masterPlanilhas.length === 0 ? (
                                                <div className="text-xs text-amber-500 flex items-center gap-2 bg-amber-500/10 p-2 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Nenhuma planilha anterior encontrada para este Projeto/Tag.
                                                </div>
                                            ) : (
                                                <select 
                                                    value={selectedMaster}
                                                    onChange={e => setSelectedMaster(e.target.value)}
                                                    className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 focus:border-blue-500 outline-none transition-all text-xs"
                                                >
                                                    <option value="">Selecione o arquivo mestre...</option>
                                                    {masterPlanilhas.map(p => <option key={p.NomeArquivo} value={p.NomeArquivo}>{p.NomeArquivo}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: File Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                                    <Upload className="w-4 h-4" />
                                    3. Selecionar Arquivo
                                </div>
                                <div className="relative group cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-700 bg-gray-800/20 group-hover:border-blue-500/50 group-hover:bg-blue-500/5'}`}>
                                        <div className={`p-4 rounded-2xl ${file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            <FileSpreadsheet className="w-10 h-10" />
                                        </div>
                                        <div className="text-center">
                                            <p className={`font-bold ${file ? 'text-emerald-400' : 'text-white'}`}>
                                                {file ? file.name : 'Clique ou arraste a planilha Excel'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Formato suportado: .xlsx, .xls</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Processando Importação...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Iniciar Processamento
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Info Column */}
                    <div className="space-y-6">
                        <div className="bg-[#111827] rounded-3xl border border-gray-800 p-6 shadow-xl space-y-4">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Importante
                            </h2>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        <strong className="text-gray-200">Aba "data":</strong> O sistema buscará automaticamente por esta aba para importar dados do tipo <strong className="text-blue-400">BlockSet</strong>.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        <strong className="text-gray-200">Aba "bom":</strong> Use esta aba para importar listas de materiais do tipo <strong className="text-cyan-400">PixEasy</strong>.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        O sistema valida automaticamente as colunas obrigatórias antes de salvar os dados no banco.
                                    </p>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-blue-600/10 rounded-3xl border border-blue-600/20 p-6 shadow-xl">
                            <h2 className="text-white font-bold mb-4">Resumo da Revisão</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Próxima Revisão:</span>
                                    <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
                                        {isRevision ? 'Auto-calculado' : 'Rev 0 (Inicial)'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Vínculo:</span>
                                    <span className="text-gray-300 font-medium truncate ml-4" title={selectedMaster || 'Nenhum'}>
                                        {selectedMaster || 'Nenhum'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerBuildImport;
