import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, Save, Loader2, Trash2, Link as LinkIcon, Globe, FileText, Download,
  Plus, CheckCircle2, AlertCircle
} from 'lucide-react';
import TiposMaterialPage from '../pages/TiposMaterial';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface MaterialFormData {
  IdMaterial?: number;
  CodMatFabricante: string;
  DescResumo?: string;
  DescDetal?: string;
  PecaManufat?: string;
  TxtTipoDesenho?: string;
  TipoMaterial?: string;
  NumeroRP?: string;
  FamiliaMat?: number | string;
  DescFamilia?: string;
  CodigoJuridicoMat?: number | string;
  Fornecedor?: string;
  Peso?: string;
  Unidade?: string;
  Altura?: string;
  Largura?: string;
  Profundidade?: string;
  Valor?: string;
  PercICMS?: string;
  vICMS?: string;
  PercIPI?: string;
  vIPI?: string;
  vLiquido?: string;
  acabamento?: string;
  ImagemProduto?: string | null;
  Autor?: string;
  Palavrachave?: string;
  Titulo?: string;
  SubTitulo?: string;
  Notas?: string;
  AreaPintura?: string;
  NumeroDobras?: string;
  UnidadeSW?: string;
  ValorSW?: string;
  Imagem?: string;
  StatusMat?: string;
  IdValor?: string;
  TotalValor?: string;
  EnderecoArquivo?: string;
  MaterialSW?: string;
  ConfiguracaoArquivo?: string;
  txtItemEstoque?: string;
}

interface Option {
  id: number | string;
  label: string;
}

interface TipoMaterialOption {
  id: number;
  value: string;
  label: string;
}

interface ModalNovoMaterialProps {
  isOpen: boolean;
  onClose: () => void;
  onMaterialCreated?: (material: any) => void;
  initialCode?: string;
}

const emptyForm: MaterialFormData = {
  CodMatFabricante: '',
  DescResumo: '',
  DescDetal: '',
  NumeroRP: '',
  Peso: '',
  Unidade: '',
  Altura: '',
  Largura: '',
  Profundidade: '',
  Valor: '',
  PercICMS: '',
  vICMS: '',
  PercIPI: '',
  vIPI: '',
  vLiquido: '',
  ImagemProduto: '',
  acabamento: '',
  Autor: '',
  Palavrachave: '',
  Titulo: '',
  SubTitulo: '',
  Notas: '',
  AreaPintura: '',
  NumeroDobras: '',
  UnidadeSW: '',
  ValorSW: '',
  Imagem: '',
  StatusMat: 'A',
  IdValor: '',
  TotalValor: '',
  EnderecoArquivo: '',
  MaterialSW: '',
  ConfiguracaoArquivo: '',
  txtItemEstoque: ''
};

export default function ModalCadastrarMaterial({
  isOpen,
  onClose,
  onMaterialCreated,
  initialCode = ''
}: ModalNovoMaterialProps) {
  const [formData, setFormData] = useState<MaterialFormData>(emptyForm);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cadastradosNestaSessao, setCadastradosNestaSessao] = useState<any[]>([]);

  // Dropdown options
  const [familiaOptions, setFamiliaOptions] = useState<Option[]>([]);
  const [fornecedorOptions, setFornecedorOptions] = useState<Option[]>([]);
  const [unidadeOptions, setUnidadeOptions] = useState<Option[]>([]);
  const [acabamentoOptions, setAcabamentoOptions] = useState<Option[]>([]);
  const [tipoMaterialOptions, setTipoMaterialOptions] = useState<TipoMaterialOption[]>([]);
  const [showTipoMaterialModal, setShowTipoMaterialModal] = useState(false);

  const inputCodRef = useRef<HTMLInputElement>(null);

  const inputBaseClass = "w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#E0E800]/50 focus:border-[#E0E800] transition-all";
  const inputRequired = `${inputBaseClass} border-gray-300 bg-amber-50/30`;
  const inputOptional = `${inputBaseClass} border-gray-200`;
  const selectClass = `${inputOptional} appearance-none bg-white`;

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      ...emptyForm,
      CodMatFabricante: initialCode ? initialCode.toUpperCase().trim() : ''
    });
    setPendingPdfFile(null);
    setShowUrlInput(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    const fetchOptions = async () => {
      const token = localStorage.getItem('sinco_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      try {
        const [famRes, fornRes, unidRes, acabRes, tipoMatRes] = await Promise.all([
          fetch(`${API_BASE}/familia/options`, { headers }).catch(() => null),
          fetch(`${API_BASE}/pj/options`, { headers }).catch(() => null),
          fetch(`${API_BASE}/medida/options`, { headers }).catch(() => null),
          fetch(`${API_BASE}/acabamento/options`, { headers }).catch(() => null),
          fetch(`${API_BASE}/tipomaterial/options`, { headers }).catch(() => null)
        ]);

        if (famRes && famRes.ok) {
          const famJson = await famRes.json();
          if (famJson.success && Array.isArray(famJson.data)) setFamiliaOptions(famJson.data);
        }
        if (fornRes && fornRes.ok) {
          const fornJson = await fornRes.json();
          if (fornJson.success && Array.isArray(fornJson.data)) setFornecedorOptions(fornJson.data);
        }
        if (unidRes && unidRes.ok) {
          const unidJson = await unidRes.json();
          if (unidJson.success && Array.isArray(unidJson.data)) setUnidadeOptions(unidJson.data);
        }
        if (acabRes && acabRes.ok) {
          const acabJson = await acabRes.json();
          if (acabJson.success && Array.isArray(acabJson.data)) setAcabamentoOptions(acabJson.data);
        }
        if (tipoMatRes && tipoMatRes.ok) {
          const tipoMatJson = await tipoMatRes.json();
          if (tipoMatJson.success && Array.isArray(tipoMatJson.data)) setTipoMaterialOptions(tipoMatJson.data);
        }
      } catch (err) {
        console.error('Erro ao carregar opções para novo material:', err);
      } finally {
        setTimeout(() => {
          inputCodRef.current?.focus();
        }, 150);
      }
    };

    fetchOptions();
  }, [isOpen, initialCode]);

  // Limpa mensagem de sucesso após 5 segundos
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = e.target.name;
    const value = name.toLowerCase().includes('desc') ? e.target.value.toUpperCase() : e.target.value;
    const finalValue = (name === 'DescResumo' || name === 'DescDetal' || name === 'CodMatFabricante') ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleUploadArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const codLimpo = formData.CodMatFabricante?.trim().toUpperCase();
    if (!codLimpo) {
      setErrorMsg('Código do material é obrigatório');
      inputCodRef.current?.focus();
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('sinco_token');
      const res = await fetch(`${API_BASE}/material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          CodMatFabricante: codLimpo,
          DescResumo: formData.DescResumo?.trim().toUpperCase() || codLimpo,
          DescDetal: formData.DescDetal?.trim().toUpperCase() || null
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Erro ao cadastrar material');
      }

      const newId = json.id || json.data?.IdMaterial;

      // Upload do PDF pendente se houver
      if (pendingPdfFile && newId) {
        const uploadFormData = new FormData();
        uploadFormData.append('arquivo', pendingPdfFile);
        try {
          await fetch(`${API_BASE}/materiais/${newId}/arquivos`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: uploadFormData
          });
        } catch (errPdf) {
          console.error('Falha ao subir PDF anexado:', errPdf);
        }
      }

      const materialCriado = {
        IdMaterial: newId || Date.now(),
        CodMatFabricante: codLimpo,
        DescResumo: formData.DescResumo?.trim().toUpperCase() || codLimpo,
        Unidade: formData.Unidade || 'PC',
        Peso: formData.Peso || null,
        PecaManufat: formData.PecaManufat || 'N',
        Espessura: formData.Espessura || null
      };

      // Adiciona à lista de cadastrados nesta sessão
      setCadastradosNestaSessao(prev => [materialCriado, ...prev]);

      // Feedback de sucesso
      setSuccessMsg(`Material "${codLimpo}" salvo com sucesso! Você pode incluir outro material ou sair.`);

      // Notifica o componente pai
      if (onMaterialCreated) {
        onMaterialCreated(materialCriado);
      }

      // Prepara o formulário para o próximo item, mantendo a tela aberta!
      setFormData(prev => ({
        ...emptyForm,
        // Mantém unidade e família como conveniência para inclusões sucessivas
        Unidade: prev.Unidade,
        FamiliaMat: prev.FamiliaMat,
        Fornecedor: prev.Fornecedor,
        acabamento: prev.acabamento
      }));
      setPendingPdfFile(null);
      setShowUrlInput(false);

      setTimeout(() => {
        inputCodRef.current?.focus();
      }, 100);

    } catch (err: any) {
      console.error('Erro ao salvar material:', err);
      setErrorMsg(err.message || 'Erro ao salvar material. Verifique a conexão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-white rounded-md shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[88vh] overflow-hidden border border-slate-200"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          
          {/* Cabeçalho do Modal (Tela 1) */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#32423D] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#32423D] flex items-center gap-2">
                  Novo Material
                  {cadastradosNestaSessao.length > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {cadastradosNestaSessao.length} cadastrado(s)
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Preencha os dados e clique em Salvar para incluir na tabela material. Clique em Cancelar ou no X para voltar aos recursos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Fechar e Voltar para Recursos"
            >
              <X size={20} />
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span className="flex-1 font-medium">{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span className="flex-1 font-semibold">{successMsg}</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">Pronto para o próximo</span>
            </div>
          )}

          {/* Corpo dos Campos (Idêntico à Tela 1) */}
          <div className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">

            {/* Imagem / Anexos (Opcional) */}
            <div className="flex flex-row items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded bg-gray-100 border border-gray-200 flex items-center justify-center relative group shrink-0">
                {formData.ImagemProduto ? (
                  <>
                    <div className="w-full h-full rounded overflow-hidden relative">
                      <img src={formData.ImagemProduto} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, ImagemProduto: '' }))} className="p-1 bg-white/20 rounded-full hover:bg-white/40 text-white transition-colors" title="Remover imagem">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Image on Hover */}
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] hidden group-hover:flex pointer-events-none bg-white p-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-200 animate-in zoom-in-95 duration-200">
                      <img src={formData.ImagemProduto} alt="Zoom" className="w-auto h-auto max-w-[80vw] max-h-[80vh] object-contain rounded" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Package size={20} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex flex-row gap-2 items-center">
                  <span className="text-xs font-semibold text-gray-700 mr-2">Imagem / Anexo:</span>
                  
                  <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className={`p-1.5 rounded border transition-colors ${showUrlInput ? 'bg-[#32423D] text-white border-[#32423D]' : 'border-gray-200 hover:bg-gray-50 text-[#32423D]'}`} title="Link Web">
                    <LinkIcon size={14} />
                  </button>
                  <button type="button" onClick={() => {
                    const query = encodeURIComponent((formData.CodMatFabricante || '') + ' ' + (formData.DescResumo || ''));
                    window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
                    setShowUrlInput(true);
                  }} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-[#32423D]" title="Pesquisar WEB">
                    <Globe size={14} />
                  </button>
                  <label className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer text-[#32423D]" title="Anexar PDF">
                    <input type="file" accept="application/pdf" onChange={handleUploadArquivo} className="hidden" />
                    <FileText size={14} className={pendingPdfFile ? "text-green-500" : ""} />
                  </label>
                </div>
                {pendingPdfFile && (
                  <div className="text-[10px] text-green-600 font-semibold bg-green-50 p-1 rounded inline-block mt-1">
                    PDF na fila: {pendingPdfFile.name} (será salvo com o material)
                    <button type="button" onClick={() => setPendingPdfFile(null)} className="ml-2 text-red-500 hover:text-red-700 font-bold">X</button>
                  </div>
                )}
                {showUrlInput && (
                  <input type="text" value={formData.ImagemProduto || ''} onChange={(e) => setFormData(prev => ({ ...prev, ImagemProduto: e.target.value }))} placeholder="URL da imagem (https://...)" className={inputOptional + " py-1 text-xs"} />
                )}
              </div>
            </div>

            {/* Identificação */}
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Código Material <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    ref={inputCodRef}
                    type="text"
                    name="CodMatFabricante"
                    value={formData.CodMatFabricante || ''}
                    onChange={handleInputChange}
                    placeholder="Código único do material"
                    className={inputRequired}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Numero RP <span className="text-[10px] font-normal text-gray-400 ml-1">(Máx 45)</span>
                  </label>
                  <input
                    type="text"
                    name="NumeroRP"
                    value={formData.NumeroRP || ''}
                    onChange={handleInputChange}
                    maxLength={45}
                    placeholder="Máx 45 caracteres"
                    className={inputOptional}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    name="StatusMat"
                    value={formData.StatusMat || 'A'}
                    onChange={handleInputChange}
                    className={selectClass + " py-1 text-xs"}
                  >
                    <option value="A">Ativo</option>
                    <option value="I">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="border-b border-gray-100 pb-2 mt-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Descrição</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descrição Resumo</label>
                  <input
                    type="text"
                    name="DescResumo"
                    value={formData.DescResumo || ''}
                    onChange={handleInputChange}
                    placeholder="Descrição breve do item"
                    className={inputOptional}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descrição Detalhada</label>
                  <textarea
                    name="DescDetal"
                    value={formData.DescDetal || ''}
                    onChange={handleInputChange}
                    rows={1}
                    placeholder="Especificações completas"
                    className={inputOptional}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Título</label>
                  <input type="text" name="Titulo" value={formData.Titulo || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Subtítulo</label>
                  <input type="text" name="SubTitulo" value={formData.SubTitulo || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Autor</label>
                  <input type="text" name="Autor" value={formData.Autor || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Palavra-chave</label>
                  <input type="text" name="Palavrachave" value={formData.Palavrachave || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Notas</label>
                  <input type="text" name="Notas" value={formData.Notas || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Item Estoque (txt)</label>
                  <input type="text" name="txtItemEstoque" value={formData.txtItemEstoque || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
              </div>
            </div>

            {/* Classificação */}
            <div className="border-b border-gray-100 pb-2 mb-2 mt-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Classificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-gray-500 mb-0.5">
                    Família
                    <button type="button" onClick={() => window.open('/familia?action=new', '_blank')} className="text-[#03624C] hover:text-[#0b3a2d] hover:bg-[#eaf4f1] rounded p-0.5 transition-colors" title="Adicionar Família">
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </label>
                  <select name="FamiliaMat" value={formData.FamiliaMat || ''} onChange={handleInputChange} className={selectClass + " py-1 text-xs"}>
                    <option value="">Selecione...</option>
                    {familiaOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-gray-500 mb-0.5">
                    Fornecedor
                    <button type="button" onClick={() => window.open('/cadastro-pj?action=new', '_blank')} className="text-[#03624C] hover:text-[#0b3a2d] hover:bg-[#eaf4f1] rounded p-0.5 transition-colors" title="Adicionar Fornecedor">
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </label>
                  <select name="Fornecedor" value={formData.Fornecedor || ''} onChange={handleInputChange} className={selectClass + " py-1 text-xs"}>
                    <option value="">Selecione...</option>
                    {fornecedorOptions.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">Código Jurídico Mat.</label>
                  <input type="number" name="CodigoJuridicoMat" value={formData.CodigoJuridicoMat || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-gray-500 mb-0.5">
                    Tipo Material
                    <button
                      type="button"
                      onClick={() => setShowTipoMaterialModal(true)}
                      className="text-[#03624C] hover:text-[#0b3a2d] hover:bg-[#eaf4f1] rounded p-0.5 transition-colors"
                      title="Adicionar Tipo de Material"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </label>
                  <select
                    name="TipoMaterial"
                    value={formData.TipoMaterial || ''}
                    onChange={handleInputChange}
                    className={selectClass + " py-1 text-xs"}
                  >
                    <option value="">Selecione...</option>
                    {tipoMaterialOptions.map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dados Equipamento */}
            <div className="border-b border-gray-100 pb-2 mb-2 mt-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">Dados Equipamento</h3>
              <div className="grid grid-cols-3 md:grid-cols-8 gap-4 mb-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Peso</label>
                  <input type="text" maxLength={5} name="Peso" value={formData.Peso || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-1">
                  <label className="flex items-center justify-between text-[10px] font-medium text-gray-500 mb-0.5">
                    Unidade
                    <button type="button" onClick={() => window.open('/unidades-medida?action=new', '_blank')} className="text-[#03624C] hover:text-[#0b3a2d] hover:bg-[#eaf4f1] rounded p-0.5 transition-colors" title="Adicionar Unidade">
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </label>
                  <select name="Unidade" value={formData.Unidade || ''} onChange={handleInputChange} className={selectClass + " py-1 text-xs"}>
                    <option value="">-</option>
                    {unidadeOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.id}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Altura</label>
                  <input type="text" maxLength={5} name="Altura" value={formData.Altura || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Largura</label>
                  <input type="text" maxLength={5} name="Largura" value={formData.Largura || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Profundidade</label>
                  <input type="text" maxLength={5} name="Profundidade" value={formData.Profundidade || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="col-span-2">
                  <label className="flex items-center justify-between text-[10px] font-medium text-gray-500 mb-0.5">
                    Acabamento
                    <button type="button" onClick={() => window.open('/acabamento?action=new', '_blank')} className="text-[#03624C] hover:text-[#0b3a2d] hover:bg-[#eaf4f1] rounded p-0.5 transition-colors" title="Adicionar Acabamento">
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </label>
                  <select name="acabamento" value={formData.acabamento || ''} onChange={handleInputChange} className={selectClass + " py-1 text-xs"}>
                    <option value="">Selecione...</option>
                    {acabamentoOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Área de Pintura</label>
                  <input type="text" maxLength={5} name="AreaPintura" value={formData.AreaPintura || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Nº de Dobras</label>
                  <input type="text" maxLength={5} name="NumeroDobras" value={formData.NumeroDobras || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
              </div>
            </div>

            {/* Dados SolidWorks */}
            <div className="border-b border-gray-100 pb-2 mb-2 mt-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">Dados SolidWorks (SW) / Integração - Opcional</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Material SW</label>
                  <input type="text" name="MaterialSW" value={formData.MaterialSW || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Unidade SW</label>
                  <input type="text" name="UnidadeSW" value={formData.UnidadeSW || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Valor SW</label>
                  <input type="text" name="ValorSW" value={formData.ValorSW || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Imagem (Ref)</label>
                  <input type="text" name="Imagem" value={formData.Imagem || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Endereço do Arquivo</label>
                  <input type="text" name="EnderecoArquivo" value={formData.EnderecoArquivo || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Configuração Arquivo</label>
                  <input type="text" name="ConfiguracaoArquivo" value={formData.ConfiguracaoArquivo || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
              </div>
            </div>

            {/* Dados Fiscais */}
            <div className="pb-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">Dados Fiscais</h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Valor Unit.</label>
                  <input type="text" name="Valor" value={formData.Valor || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">% ICMS</label>
                  <input type="text" name="PercICMS" value={formData.PercICMS || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">$ ICMS</label>
                  <input type="text" name="vICMS" value={formData.vICMS || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">% IPI</label>
                  <input type="text" name="PercIPI" value={formData.PercIPI || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">$ IPI</label>
                  <input type="text" name="vIPI" value={formData.vIPI || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Valor Líquido</label>
                  <input type="text" name="vLiquido" value={formData.vLiquido || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">ID Valor</label>
                  <input type="text" name="IdValor" value={formData.IdValor || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Total Valor</label>
                  <input type="text" name="TotalValor" value={formData.TotalValor || ''} onChange={handleInputChange} className={inputOptional + " py-1 text-xs"} />
                </div>
              </div>
            </div>

            {/* Required fields note */}
            <p className="text-xs text-gray-400 pt-2">
              <span className="text-red-500 font-bold">*</span> Campos obrigatórios
            </p>

            {/* Histórico dos materiais incluídos nesta sessão */}
            {cadastradosNestaSessao.length > 0 && (
              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Itens cadastrados nesta sessão ({cadastradosNestaSessao.length}):</span>
                  <span className="text-[10px] font-normal text-gray-500">Disponíveis no Grid 3 ao fechar</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {cadastradosNestaSessao.map((c, i) => (
                    <span key={c.IdMaterial || i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[10px] font-mono font-bold shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {c.CodMatFabricante}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Rodapé do Modal (Cancelar e Salvar) */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !formData.CodMatFabricante?.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#32423D] hover:bg-[#26332f] text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin text-[#E0E800]" /> : <Save size={14} className="text-[#E0E800]" />}
              Salvar
            </button>
          </div>

        </form>
      </motion.div>

      {/* Sub-modal Tipos de Material */}
      {showTipoMaterialModal && (
        <div className="fixed inset-0 z-[110]">
          <TiposMaterialPage
            isModal
            onCloseModal={(created) => {
              setShowTipoMaterialModal(false);
              // Recarrega as opcoes de tipo material
              fetch(`${API_BASE}/tipomaterial/options`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sinco_token')}` }
              }).then(r => r.json()).then(j => { if (j.success) setTipoMaterialOptions(j.data); }).catch(() => {});
              // Seleciona automaticamente o tipo recém-criado
              if (created?.TipoMaterial) {
                // será selecionado via options após reload
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
