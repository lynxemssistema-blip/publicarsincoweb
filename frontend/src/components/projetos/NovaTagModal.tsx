import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag as TagIcon, X, Plus, Eye, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TipoProdutoPage from '../../pages/TipoProduto';
import UnidadeMedidaPage from '../../pages/UnidadeMedida';
import { useToast } from '../../contexts/ToastContext';
import { isDateInPast } from '../../utils/dateUtils';

interface Tag {
  IdTag?: number;
  Tag?: string;
  DataPrevisao?: string;
  TipoProduto?: string;
  UnidadeProduto?: string;
  QtdeTag?: string;
  QtdeLiberada?: string;
  SaldoTag?: string;
  Medida?: string;
  DescTag?: string;
  Finalizado?: string;
}

interface NovaTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projetoId: string | number;
  projetoNome: string;
  dataPrevisaoProjeto?: string;
  tagToEdit?: Tag | null;
  API_BASE: string;
  isProjetoFinalizado?: boolean;
}

const normalizeToBRDate = (val?: string | null): string => {
  if (!val) return '';
  const trimmed = val.trim();
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[1]}/${brMatch[2]}/${brMatch[3]}`;
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  return trimmed;
};

const parseToInputDate = (val?: string | null): string => {
  if (!val) return '';
  const trimmed = val.trim();
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  return '';
};

export default function NovaTagModal({
  isOpen,
  onClose,
  onSuccess,
  projetoId,
  projetoNome,
  dataPrevisaoProjeto,
  tagToEdit,
  API_BASE,
  isProjetoFinalizado = false
}: NovaTagModalProps) {
  const { user } = useAuth();
  const { showAlert } = useToast();
  const isEditingTag = !!tagToEdit;
  
  const emptyTagForm: Tag = {
    Tag: '', DataPrevisao: '', TipoProduto: '', UnidadeProduto: '', QtdeTag: '', QtdeLiberada: '', SaldoTag: '', Medida: '', DescTag: ''
  };

  const [tagFormData, setTagFormData] = useState<Tag>(emptyTagForm);
  const [showTipoProdutoModal, setShowTipoProdutoModal] = useState(false);
  const [showUnidadeMedidaModal, setShowUnidadeMedidaModal] = useState(false);
  const [tipoProdutoOptions, setTipoProdutoOptions] = useState<{ id: string | number; label: string; Unidade?: string }[]>([]);
  const [medidaOptions, setMedidaOptions] = useState<{ id: string | number; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (tagToEdit) {
        const initialMedida = tagToEdit.UnidadeProduto || tagToEdit.Medida || '';
        setTagFormData({
          ...tagToEdit,
          Medida: initialMedida,
          UnidadeProduto: initialMedida,
          DataPrevisao: normalizeToBRDate(tagToEdit.DataPrevisao || dataPrevisaoProjeto)
        });
      } else {
        const initialDate = normalizeToBRDate(dataPrevisaoProjeto);
        setTagFormData({
          ...emptyTagForm,
          DataPrevisao: initialDate
        });

        // Se dataPrevisaoProjeto não veio nas props mas temos projetoId, busca do backend
        if (!initialDate && projetoId) {
          fetchProjetoDataPrevisao(projetoId);
        }
      }
      fetchOptions();
      fetchMedidaOptions();
    }
  }, [isOpen, tagToEdit, dataPrevisaoProjeto, projetoId]);

  const fetchProjetoDataPrevisao = async (projId: string | number) => {
    try {
      let token = localStorage.getItem('sinco_token') || localStorage.getItem('superadmin_token');
      if (token === 'null' || token === 'undefined') token = null;
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/projeto/${projId}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        const pDate = normalizeToBRDate(json.data.DataPrevisao || json.data.PrazoEntrega || '');
        if (pDate) {
          setTagFormData(prev => ({
            ...prev,
            DataPrevisao: prev.DataPrevisao || pDate
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching project date:', err);
    }
  };

  const fetchOptions = async (selectValue?: string) => {
    try {
      let token = localStorage.getItem('sinco_token') || localStorage.getItem('superadmin_token');
      if (token === 'null' || token === 'undefined') token = null;
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/tipoproduto/options`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTipoProdutoOptions(json.data);
        if (selectValue) {
          const matched = json.data.find((opt: any) => opt.label?.toUpperCase() === selectValue.toUpperCase());
          const unit = matched?.Unidade || '';
          setTagFormData(prev => ({
            ...prev,
            TipoProduto: matched ? matched.label : selectValue,
            ...(unit ? { Medida: unit, UnidadeProduto: unit } : {})
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching type options:', err);
    }
  };

  const fetchMedidaOptions = async (selectValue?: string) => {
    try {
      let token = localStorage.getItem('sinco_token') || localStorage.getItem('superadmin_token');
      if (token === 'null' || token === 'undefined') token = null;
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/medida/options`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMedidaOptions(json.data);
        if (selectValue) {
          const matched = json.data.find((opt: any) =>
            String(opt.id).toUpperCase() === selectValue.toUpperCase() ||
            String(opt.label).toUpperCase().startsWith(selectValue.toUpperCase())
          );
          const val = matched ? String(matched.id) : selectValue;
          setTagFormData(prev => ({
            ...prev,
            Medida: val,
            UnidadeProduto: val
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching medida options:', err);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'Tag' || name === 'DescTag' || name.toLowerCase().includes('desc')) {
      value = value.toUpperCase();
    }
    if (name === 'TipoProduto') {
      const selected = tipoProdutoOptions.find(opt => opt.label === value);
      const unit = selected?.Unidade || '';
      setTagFormData(prev => ({
        ...prev,
        [name]: value,
        ...(unit ? { Medida: unit, UnidadeProduto: unit } : {})
      }));
      return;
    }
    if (name === 'Medida' || name === 'UnidadeProduto') {
      setTagFormData(prev => ({
        ...prev,
        Medida: value,
        UnidadeProduto: value
      }));
      return;
    }
    setTagFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProjetoFinalizado) return;
    setSaving(true);

    try {
      const hoje = new Date();
      const dataHoje = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
      const loginUsuario = (user as any)?.Login || (user as any)?.login || (user as any)?.NomeCompleto || (user as any)?.nome || 'Sistema';

      const unitVal = tagFormData.UnidadeProduto || tagFormData.Medida || null;

      const payload = {
        ...tagFormData,
        Medida: unitVal,
        UnidadeProduto: unitVal,
        IdProjeto: projetoId,
        Projeto: projetoNome,
        ...(!isEditingTag ? { CriadoPor: loginUsuario, DataEntrada: dataHoje } : {})
      };

      const url = isEditingTag ? `${API_BASE}/tag/${tagFormData.IdTag}` : `${API_BASE}/tag`;
      const method = isEditingTag ? 'PUT' : 'POST';

      let token = localStorage.getItem('sinco_token') || localStorage.getItem('superadmin_token');
      if (token === 'null' || token === 'undefined') token = null;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showAlert('Tag salva com sucesso!', 'success');
        onSuccess();
        onClose();
      } else {
        showAlert(json.message || 'Erro ao salvar tag', 'error');
      }
    } catch {
      showAlert('Erro ao salvar. Verifique a conexão.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputRequired = 'w-full border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs';
  const inputOptional = 'w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs text-gray-600';
  const selectClass = 'w-full border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs bg-white';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-white rounded-md shadow-xl w-full max-w-2xl my-8 relative z-[101]"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#32423D] text-white flex items-center justify-center">
                <TagIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#32423D]">
                    {isProjetoFinalizado ? 'Visualizar Tag' : isEditingTag ? 'Editar Tag' : 'Nova Tag'}
                  </h2>
                  {isProjetoFinalizado && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                      Finalizado
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Projeto: {projetoNome}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {isProjetoFinalizado && (
            <div className="mx-5 mt-4 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded flex items-center gap-2 font-medium">
              <Lock size={14} className="shrink-0 text-amber-600" />
              <span>Projeto finalizado: este registro está em modo de somente visualização (nenhuma alteração permitida).</span>
            </div>
          )}

          <form onSubmit={handleTagSubmit} className="p-5 space-y-4">
            <fieldset disabled={isProjetoFinalizado} className="space-y-4 border-0 p-0 m-0 min-w-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição Tag <span className="text-red-500">*</span></label>
                <input type="text" name="Tag" value={tagFormData.Tag || ''} onChange={handleTagInputChange} className={inputRequired} required />
              </div>
              <div>
                {(() => {
                  const isPrevisaoPast = isDateInPast(tagFormData.DataPrevisao);
                  return (
                    <>
                      <label className={`block text-xs font-medium mb-1 ${isPrevisaoPast ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        Data Prev. Entrega
                      </label>
                      <input
                        type="date"
                        name="DataPrevisao"
                        value={parseToInputDate(tagFormData.DataPrevisao)}
                        onChange={e => {
                          const [y, m, d] = (e.target.value || '').split('-');
                          const br = y && m && d ? `${d}/${m}/${y}` : '';
                          setTagFormData(prev => ({ ...prev, DataPrevisao: br }));
                        }}
                        className={isPrevisaoPast
                          ? 'w-full border border-red-400 bg-red-50 text-red-600 font-semibold rounded px-2 py-1.5 focus:ring-1 focus:ring-red-500 text-xs shadow-sm'
                          : inputOptional
                        }
                      />
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTipoProdutoModal(true)}
                  className="inline-flex items-center justify-center w-4 h-4 rounded bg-gray-100 text-gray-500 hover:bg-[#32423D] hover:text-white transition-colors border border-gray-200"
                  title="Novo Tipo Produto"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
                Tipo Produto
              </label>
              <select name="TipoProduto" value={tagFormData.TipoProduto || ''} onChange={handleTagInputChange} className={selectClass}>
                <option value="">Selecione...</option>
                {tipoProdutoOptions.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade</label>
                <input type="text" name="QtdeTag" value={tagFormData.QtdeTag || ''} onChange={handleTagInputChange} className={inputOptional} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Qt. Liberada</label>
                <input type="text" name="QtdeLiberada" value={tagFormData.QtdeLiberada || ''} readOnly className={`${inputOptional} bg-gray-100 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Saldo</label>
                <input type="text" name="SaldoTag" value={tagFormData.SaldoTag || ''} readOnly className={`${inputOptional} bg-gray-100 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUnidadeMedidaModal(true)}
                    disabled={isProjetoFinalizado}
                    className="inline-flex items-center justify-center w-4 h-4 rounded bg-gray-100 text-gray-500 hover:bg-[#32423D] hover:text-white transition-colors border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Nova Unidade de Medida"
                  >
                    <Plus size={10} strokeWidth={3} />
                  </button>
                  Unidade de Medida
                </label>
                <select
                  name="Medida"
                  value={tagFormData.Medida || tagFormData.UnidadeProduto || ''}
                  onChange={handleTagInputChange}
                  className={selectClass}
                  disabled={isProjetoFinalizado}
                >
                  <option value="">Selecione...</option>
                  {tagFormData.Medida && !medidaOptions.some(opt => opt.id === tagFormData.Medida) && (
                    <option value={tagFormData.Medida}>{tagFormData.Medida}</option>
                  )}
                  {medidaOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descrição</label>
              <textarea name="DescTag" value={tagFormData.DescTag || ''} onChange={handleTagInputChange} rows={3} className={inputOptional} />
            </div>
            </fieldset>
            
            <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded font-medium transition-colors text-xs"
              >
                Fechar
              </button>
              {!isProjetoFinalizado && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#32423D] hover:bg-emerald-800 text-white rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-xs"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
        
        {showTipoProdutoModal && (
          <div className="fixed inset-0 z-[110]">
            <TipoProdutoPage
              isModal
              onCloseModal={(createdItem) => {
                setShowTipoProdutoModal(false);
                fetchOptions(createdItem?.TipoProduto);
              }}
            />
          </div>
        )}

        {showUnidadeMedidaModal && (
          <div className="fixed inset-0 z-[110]">
            <UnidadeMedidaPage
              isModal
              onCloseModal={(createdItem) => {
                setShowUnidadeMedidaModal(false);
                fetchMedidaOptions(createdItem?.TipoMedida);
              }}
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
