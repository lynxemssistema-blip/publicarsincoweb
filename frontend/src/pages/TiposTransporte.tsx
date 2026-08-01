import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Truck, Save, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/api';

interface Veiculo {
    IdVeiculo?: number;
    Veiculo: string;
    Placa: string;
    DataCadastro?: string;
}

const emptyForm: Veiculo = {
    Veiculo: '',
    Placa: ''
};

export default function TiposTransportePage() {
    const { token } = useAuth();
    const [items, setItems] = useState<Veiculo[]>([]);
    const [formData, setFormData] = useState<Veiculo>(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/config/veiculo`, { headers });
            const json = await res.json();
            if (json.success) {
                setItems(json.data);
            } else {
                setError(json.message || 'Erro ao carregar dados');
            }
        } catch {
            setError('Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const inputBaseClass = "w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#E0E800]/50 focus:border-[#E0E800] transition-all";
    const inputRequired = `${inputBaseClass} border-gray-300 bg-amber-50/30`;

    const filteredItems = items.filter(item =>
        item.Veiculo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        const value = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const url = isEditing ? `${API_BASE}/config/veiculo/${formData.IdVeiculo}` : `${API_BASE}/config/veiculo`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData),
            });

            const json = await res.json();
            if (json.success) {
                await fetchData();
                resetForm();
            } else {
                setError(json.message || 'Erro ao salvar');
            }
        } catch {
            setError('Erro ao salvar. Verifique a conexão.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: Veiculo) => {
        setFormData(item);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Deseja realmente excluir este veículo?')) return;

        try {
            const res = await fetch(`${API_BASE}/config/veiculo/${id}`, {
                method: 'DELETE',
                headers
            });
            const json = await res.json();
            if (json.success) {
                await fetchData();
            } else {
                setError(json.message || 'Erro ao excluir');
            }
        } catch {
            setError('Erro ao excluir. Verifique a conexão.');
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setIsEditing(false);
        setShowForm(false);
        setError(null);
    };

    return (
        <div className="p-3 sm:p-6 w-full max-w-[1920px] mx-auto animate-fade-in pb-20">
            {/* Cabeçalho principal */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-[#32423D] text-[#E0E800] rounded-xl shadow-lg">
                            <Truck size={24} strokeWidth={2.5} />
                        </div>
                        Tipos de Transporte (Veículos)
                    </h1>
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                        Gerencie os veículos cadastrados no sistema
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center justify-between">
                    {error}
                    <button onClick={() => setError(null)} className="hover:bg-red-100 p-1 rounded-full transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Painel do Formulário Expansível */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-white rounded-xl shadow-lg border border-[#32423D]/10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    {isEditing ? <Edit2 size={18} className="text-[#32423D]" /> : <Plus size={18} className="text-[#32423D]" />}
                                    {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Veículo *</label>
                                        <input
                                            type="text"
                                            name="Veiculo"
                                            required
                                            value={formData.Veiculo}
                                            onChange={handleInputChange}
                                            className={inputRequired}
                                            placeholder="Ex: Caminhão Baú"
                                            maxLength={45}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Placa *</label>
                                        <input
                                            type="text"
                                            name="Placa"
                                            required
                                            value={formData.Placa}
                                            onChange={handleInputChange}
                                            className={inputRequired}
                                            placeholder="Ex: ABC-1234"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 text-xs font-bold text-[#32423D] bg-[#E0E800] hover:bg-[#d4db00] rounded-lg transition-all shadow-md shadow-[#E0E800]/20 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Salvando...' : 'Salvar Veículo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por veículo ou placa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#32423D]/20 focus:border-[#32423D] transition-all bg-white"
                            />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={fetchData}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors tooltip-trigger"
                                title="Atualizar lista"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>

                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#32423D] text-[#E0E800] px-4 py-2 rounded-lg hover:bg-[#2a3833] transition-all shadow-md text-xs font-bold"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                Adicionar Veículo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading && items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                            <Loader2 size={32} className="animate-spin text-[#32423D]" />
                            <p className="text-xs font-medium">Carregando dados...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-white border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                                    <th className="p-4 pl-6">Veículo</th>
                                    <th className="p-4">Placa</th>
                                    <th className="p-4">Data de Cadastro</th>
                                    <th className="p-4 pr-6 w-24 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={item.IdVeiculo} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="p-4 pl-6 font-bold text-gray-800">
                                                {item.Veiculo}
                                            </td>
                                            <td className="p-4 text-gray-600 font-mono">
                                                {item.Placa}
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {item.DataCadastro ? item.DataCadastro.split(' ')[0] : '-'}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => item.IdVeiculo && handleDelete(item.IdVeiculo)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-400">
                                            <Truck size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-medium">Nenhum veículo encontrado</p>
                                            {searchTerm && <p className="text-xs mt-1">Nenhum resultado para "{searchTerm}"</p>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
