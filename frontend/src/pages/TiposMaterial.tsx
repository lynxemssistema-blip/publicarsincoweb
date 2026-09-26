import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Layers, Save, Loader2, RefreshCw, Lock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Tipos protegidos: nao podem ser editados nem excluidos
const TIPOS_PROTEGIDOS = ['PA', 'PI', 'MP', 'DE'];

interface TipoMaterial {
  IdTipoMaterial?: number;
  TipoMaterial: string;
  Descricao?: string;
  UsuarioCriacao?: string;
}

const emptyForm: TipoMaterial = { TipoMaterial: '', Descricao: '' };

interface Props {
  isModal?: boolean;
  onCloseModal?: (createdItem?: { TipoMaterial: string }) => void;
}

const getAuthHeaders = () => {
  let token = localStorage.getItem('sinco_token') || localStorage.getItem('superadmin_token');
  if (token === 'null' || token === 'undefined') token = null;
  return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
};

export default function TiposMaterialPage({ isModal = false, onCloseModal }: Props = {}) {
  const [items, setItems] = useState<TipoMaterial[]>([]);
  const [formData, setFormData] = useState<TipoMaterial>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(isModal);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputTipoRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/tipomaterial`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setItems(json.data);
      else setError(json.message || 'Erro ao carregar dados');
    } catch { setError('Erro de conexao com o servidor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Limpa mensagem de sucesso apos 4s
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Foca no campo TipoMaterial sempre que o modal abre ou o form e resetado
  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => inputTipoRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  const inputBaseClass = "w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#E0E800]/50 focus:border-[#E0E800] transition-all";
  const inputRequired = `${inputBaseClass} border-gray-300 bg-amber-50/30`;
  const inputOptional = `${inputBaseClass} border-gray-200`;

  const filteredItems = items.filter(item =>
    item.TipoMaterial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isProtected = (tipo: string) => TIPOS_PROTEGIDOS.includes(tipo?.toUpperCase());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'TipoMaterial') v = v.toUpperCase().slice(0, 2);
    if (name === 'Descricao') v = v.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const url = isEditing ? `${API_BASE}/tipomaterial/${formData.IdTipoMaterial}` : `${API_BASE}/tipomaterial`;
      const payload = {
        ...formData,
        TipoMaterial: (formData.TipoMaterial || '').trim().toUpperCase(),
        Descricao: (formData.Descricao || '').trim().toUpperCase()
      };
      // Validação de duplicidade no frontend
      const dupFound = items.some(t =>
        t.TipoMaterial.toUpperCase() === payload.TipoMaterial &&
        (!isEditing || t.IdTipoMaterial !== formData.IdTipoMaterial)
      );
      if (dupFound) {
        setError(`Tipo de material "${payload.TipoMaterial}" já existe.`);
        setSaving(false);
        return;
      }
      const res = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) {
        await fetchData();
        if (isEditing) {
          // Ao editar: fecha o modal
          closeForm(true);
        } else {
          // Ao incluir: fica na tela, limpa o form para novo registro e refoca
          setFormData(emptyForm);
          setSuccessMsg(`Tipo "${payload.TipoMaterial}" salvo! Voce pode incluir outro ou fechar.`);
          setTimeout(() => inputTipoRef.current?.focus(), 80);
          // Nao fecha o sub-modal - usuario clica Sair quando quiser
        }
      } else {
        setError(json.message || 'Erro ao salvar');
      }
    } catch { setError('Erro ao salvar. Verifique a conexao.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/tipomaterial`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        const item = json.data.find((i: TipoMaterial) => i.IdTipoMaterial === id);
        if (item) { setFormData(item); setIsEditing(true); setShowForm(true); setSuccessMsg(null); setError(null); }
      }
    } catch (err) { console.error('Fetch error:', err); }
  };

  const handleDelete = async (id: number, tipo: string) => {
    if (isProtected(tipo)) return;
    if (!confirm('Deseja realmente excluir este tipo de material?')) return;
    try {
      const res = await fetch(`${API_BASE}/tipomaterial/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) await fetchData();
      else setError(json.message || 'Erro ao excluir');
    } catch { setError('Erro ao excluir. Verifique a conexao.'); }
  };


  const closeForm = (fromSave = false) => {
    setFormData(emptyForm); setIsEditing(false); setShowForm(false); setError(null);
    if (!fromSave) setSuccessMsg(null);
    // Notifica o pai para remover o wrapper de overlay (fix: div fixed inset-0 ficava bloqueando)
    if (isModal && onCloseModal) onCloseModal();
    if (new URLSearchParams(window.location.search).get('action') === 'new') window.close();
  };

  const isActionNew = new URLSearchParams(window.location.search).get('action') === 'new';

  const modalContent = (
    <AnimatePresence>
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto ${isActionNew ? 'bg-[#f4f7f6]' : 'bg-black/40'}`}
          onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white rounded-md shadow-xl w-full max-w-md my-8">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#32423D] text-white flex items-center justify-center"><Layers size={20} /></div>
                <h2 className="text-lg font-semibold text-[#32423D]">{isEditing ? 'Editar Tipo Material' : 'Novo Tipo Material'}</h2>
              </div>
              <button onClick={() => closeForm()} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Feedback */}
            {error && <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}
            {successMsg && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tipo Material <span className="text-red-500 font-bold">*</span>
                  <span className="text-[10px] font-normal text-gray-400 ml-1">(Max 2 caracteres)</span>
                </label>
                <input
                  ref={inputTipoRef}
                  type="text" name="TipoMaterial" value={formData.TipoMaterial || ''} onChange={handleInputChange}
                  placeholder="Ex: CH" className={`${inputRequired} uppercase`}
                  style={{ textTransform: 'uppercase' }} maxLength={2} required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descricao</label>
                <input
                  type="text" name="Descricao" value={formData.Descricao || ''} onChange={handleInputChange}
                  placeholder="Ex: CHAPARIA" className={`${inputOptional} uppercase`}
                  style={{ textTransform: 'uppercase' }} maxLength={200}
                />
              </div>
              <p className="text-xs text-gray-400"><span className="text-red-500 font-bold">*</span> Campos obrigatorios</p>
              <div className="pt-2 flex items-center justify-between">
                <button type="button" onClick={() => closeForm()}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors">
                  Sair
                </button>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#32423D] text-white font-medium text-xs hover:bg-[#3d4f49] transition-colors disabled:opacity-50"
                  disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isEditing ? 'Atualizar' : 'Salvar e continuar'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isModal || isActionNew) { if (!showForm) return null; return modalContent; }

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0">
      {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</motion.div>)}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-gray-500 text-xs">Gerencie os tipos de material do sistema</p>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchData}
            className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setFormData(emptyForm); setIsEditing(false); setSuccessMsg(null); setError(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#32423D] text-white font-medium hover:bg-[#3d4f49] transition-colors shadow-sm">
            <Plus size={15} />Novo Tipo
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Buscar por tipo ou descricao..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E0E800]/50 focus:border-[#E0E800] transition-all" />
        </div>
        {searchTerm && (<button onClick={() => setSearchTerm('')} className="p-2.5 rounded-lg border border-gray-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"><X size={15} /></button>)}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400"><Loader2 size={32} className="animate-spin" /><p className="text-xs">Carregando dados...</p></div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-[#567469] text-white">
                <tr className="border-b border-white/20">
                  <th className="px-2 py-0.5 text-left text-xs font-semibold text-white uppercase tracking-wider w-24">Tipo</th>
                  <th className="px-2 py-0.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Descricao</th>
                  <th className="px-2 py-0.5 text-right text-xs font-semibold text-white uppercase tracking-wider w-28">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3 text-gray-400"><Layers size={40} strokeWidth={1.5} /><p className="text-xs">Nenhum tipo de material encontrado</p></div></td></tr>
                ) : filteredItems.map((item, idx) => {
                  const prot = isProtected(item.TipoMaterial);
                  return (
                    <motion.tr key={item.IdTipoMaterial} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className={`hover:bg-gray-50/50 transition-colors ${prot ? 'bg-gray-50/30' : ''}`}>
                      <td className="px-2 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-9 h-6 rounded bg-[#32423D]/10 text-[#32423D] text-xs font-bold tracking-wide">{item.TipoMaterial}</span>
                          {prot && <Lock size={11} className="text-gray-400" title="Registro protegido - nao pode ser alterado" />}
                        </div>
                      </td>
                      <td className="px-2 py-0.5 text-xs text-gray-600 truncate max-w-[300px]">{item.Descricao || '-'}</td>
                      <td className="px-2 py-0.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => !prot && item.IdTipoMaterial && handleEdit(item.IdTipoMaterial)}
                            disabled={prot}
                            className={`p-2 rounded-lg transition-colors ${prot ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700 hover:bg-[#E0E800]/20'}`}
                            title={prot ? 'Registro protegido' : 'Editar'}>
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => !prot && item.IdTipoMaterial && handleDelete(item.IdTipoMaterial, item.TipoMaterial)}
                            disabled={prot}
                            className={`p-2 rounded-lg transition-colors ${prot ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                            title={prot ? 'Registro protegido' : 'Excluir'}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (<div className="px-2 py-0.5 bg-gray-50 border-t border-gray-100"><p className="text-xs text-gray-500">Mostrando <span className="font-medium">{filteredItems.length}</span> de <span className="font-medium">{items.length}</span> tipos</p></div>)}
      </div>

      {modalContent}
    </div>
  );
}
