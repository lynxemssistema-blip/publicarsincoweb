import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, X, Activity, Save,
  Loader2, RefreshCw
} from 'lucide-react';

const API_BASE = '/api';

interface ProducaoRecurso {
  id?: number;
  recurso: string;
  limite_minutos: number;
  visivel: string;
}

const emptyForm: ProducaoRecurso = {
  recurso: '',
  limite_minutos: 500,
  visivel: 'SIM'
};

export default function ProducaoDiariaRecursoPage() {
  const [recursos, setRecursos] = useState<ProducaoRecurso[]>([]);
  const [formData, setFormData] = useState<ProducaoRecurso>(emptyForm);
  const [isEditing, setIsEditing] = useState(false); // Used only for modal fallback if needed, but not for row edit
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ProducaoRecurso | null>(null);

  const fetchRecursos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/config/limites-recursos`);
      const json = await res.json();
      if (json.success) {
        setRecursos(json.data);
        
        // Atualiza a memória local para que a tela de apontamento receba o limite atualizado
        const limitsMap: Record<string, number> = {};
        json.data.forEach((r: any) => {
          if (!r.recurso) return;
          const keyWithSpaces = r.recurso.toLowerCase().trim();
          const keyNoSpaces = keyWithSpaces.replace(/\s+/g, '');
          const limit = parseFloat(r.limite_minutos) || 500;
          limitsMap[keyWithSpaces] = limit;
          limitsMap[keyNoSpaces] = limit;
        });
        localStorage.setItem('sinco_limitesTempoSetores', JSON.stringify(limitsMap));
      } else {
        setError(json.message || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursos();
  }, []);

  const filteredRecursos = recursos.filter(r =>
    r.recurso?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editFormData) return;
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev!,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const inputBaseClass = "w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#E0E800]/50 focus:border-[#E0E800] transition-all";
  const inputRequired = `${inputBaseClass} border-gray-300 bg-amber-50/30`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = isEditing ? `${API_BASE}/config/limites-recursos/${formData.id}` : `${API_BASE}/config/limites-recursos`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        await fetchRecursos();
        resetForm();
      } else {
        setError(json.message || 'Erro ao salvar');
      }
    } catch (err) {
      setError('Erro ao salvar. Verifique a conexão.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id: number) => {
    const recursoToEdit = recursos.find(r => r.id === id);
    if (recursoToEdit) {
      setEditingId(id);
      setEditFormData({ ...recursoToEdit });
    }
  };

  const handleInlineSave = async () => {
    if (!editFormData || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/config/limites-recursos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (json.success) {
        setEditingId(null);
        setEditFormData(null);
        await fetchRecursos();
      } else {
        setError(json.message || 'Erro ao salvar edição');
      }
    } catch (err) {
      setError('Erro ao salvar. Verifique a conexão.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este limite?')) return;

    try {
      const res = await fetch(`${API_BASE}/config/limites-recursos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        await fetchRecursos();
      } else {
        setError(json.message || 'Erro ao excluir');
      }
    } catch (err) {
      setError('Erro ao excluir. Verifique a conexão.');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0 p-4 lg:p-6 bg-slate-50/50">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#32423D] flex items-center gap-2 tracking-tight">
            <Activity className="text-[#32423D]" size={24} />
            Produção Diária Recurso
          </h1>
          <p className="text-gray-500 text-xs">Gerencie o limite diário de produção para cada recurso</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchRecursos}
            className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#32423D] text-white font-medium hover:bg-[#3d4f49] transition-colors shadow-sm text-xs"
          >
            <Plus size={15} />
            Novo Limite
          </motion.button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
        >
          {error}
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Buscar por recurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E0E800]/50 focus:border-[#E0E800] transition-all text-xs"
          />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="p-2.5 rounded-lg border border-gray-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors" title="Limpar pesquisa">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-white rounded-md shadow-xl w-full max-w-md my-8"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#32423D] text-white flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-[#32423D]">
                    Novo Limite
                  </h2>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Recurso <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="recurso"
                    value={formData.recurso || ''}
                    onChange={handleInputChange}
                    placeholder="ex: CORTE, SOLDA"
                    className={inputRequired}
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Limite Diário (minutos) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    name="limite_minutos"
                    value={formData.limite_minutos === 0 ? '' : formData.limite_minutos}
                    onChange={handleInputChange}
                    placeholder="Ex: 500"
                    className={inputRequired}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Visível <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    name="visivel"
                    value={formData.visivel || 'SIM'}
                    onChange={(e: any) => handleInputChange(e)}
                    className={inputRequired}
                  >
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-[#32423D] hover:bg-[#3d4f49] rounded-lg transition-colors flex items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Data */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600 w-16 text-center">ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Recurso</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Limite Diário</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-24">Visível</th>
                <th className="px-4 py-3 font-semibold text-gray-600 w-24 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#32423D]" />
                    <p>Carregando dados...</p>
                  </td>
                </tr>
              ) : filteredRecursos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Nenhum recurso encontrado.
                  </td>
                </tr>
              ) : (
                filteredRecursos.map((item) => {
                  const isRowEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">#{item.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {item.recurso}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {isRowEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              name="limite_minutos"
                              value={editFormData?.limite_minutos === 0 ? '' : editFormData?.limite_minutos}
                              onChange={handleInlineChange}
                              className={`${inputRequired} w-24`}
                              min="1"
                            />
                            <span>min</span>
                          </div>
                        ) : (
                          `${item.limite_minutos} min`
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isRowEditing ? (
                          <select
                            name="visivel"
                            value={editFormData?.visivel || 'SIM'}
                            onChange={(e: any) => handleInlineChange(e)}
                            className={`${inputRequired} w-20 text-center`}
                          >
                            <option value="SIM">SIM</option>
                            <option value="NÃO">NÃO</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold ${
                            item.visivel === 'NÃO' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {item.visivel || 'SIM'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {isRowEditing ? (
                            <>
                              <button
                                onClick={handleInlineSave}
                                disabled={saving}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Salvar"
                              >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditFormData(null); }}
                                disabled={saving}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(item.id!)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id!)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination / Footer info */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>Total de {filteredRecursos.length} registro(s)</span>
        </div>
      </div>
    </div>
  );
}
