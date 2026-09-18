import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Layers, ChevronRight, ChevronDown, FileText, Download,
  ExternalLink, Clock, Weight, GitFork, Factory, Package,
  Search, AlertCircle, Wrench, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ProcessoItem {
  IdMaterialProcesso?: number;
  Seq: number;
  NomeProcesso: string;
  Recurso: string;
  TempoSetup: number;
  TempoPadrao: number;
  Observacao?: string;
}

export interface EstruturaItem {
  IdMontaPeca?: number;
  IdMaterial: number;
  IdMaterialPai?: number;
  Nivel: number;
  CodMatFabricante: string;
  DescResumo: string;
  QtdeUnitaria: number;
  QtdeAcumulada: number;
  Unidade: string;
  Peso: number;
  PesoTotal: number;
  PecaManufat: 'S' | 'N';
  EnderecoArquivo?: string;
  TxtTipoDesenho?: string;
  hasChildren?: boolean;
  processosCount?: number;
  processos?: ProcessoItem[];
  children?: EstruturaItem[];
}

export interface RoteiroPeca {
  IdMaterial: number;
  CodMatFabricante: string;
  DescResumo: string;
  Nivel: number;
  processos: ProcessoItem[];
  tempoTotalSetup: number;
  tempoTotalPadrao: number;
  tempoTotalGeral: number;
}

export interface EstruturaCompletaData {
  material: {
    IdMaterial: number;
    CodMatFabricante: string;
    DescResumo?: string;
    DescDetal?: string;
    Unidade?: string;
    Peso?: number | string;
    PecaManufat?: string;
    EnderecoArquivo?: string;
    TxtTipoDesenho?: string;
    DescFamilia?: string;
  };
  totalNiveis: number;
  pesoTotal: number;
  totalItens: number;
  root: EstruturaItem;
  tree: EstruturaItem[];
  flatBom: EstruturaItem[];
  roteiroProcessos: RoteiroPeca[];
}

interface EstruturaProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  idMaterial: number | null;
  codMatFabricante?: string;
}

export const EstruturaProdutoModal: React.FC<EstruturaProdutoModalProps> = ({
  isOpen,
  onClose,
  idMaterial,
  codMatFabricante,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EstruturaCompletaData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Controle de expansão dos roteiros de processo por item
  const [expandedProcesses, setExpandedProcesses] = useState<Record<string, boolean>>({});
  // Controle de expansão de componentes filhos
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && idMaterial) {
      fetchEstrutura(idMaterial);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, idMaterial]);

  const fetchEstrutura = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sinco_token');
      const res = await fetch(`${API_BASE}/material/${id}/estrutura-completa`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        
        // Inicializa roteiros de processos expandidos por padrão para todas as peças que possuem processos
        const initialProcExpanded: Record<string, boolean> = {};
        const initialNodesExpanded: Record<string, boolean> = {};

        if (json.data.flatBom) {
          json.data.flatBom.forEach((item: EstruturaItem, index: number) => {
            const key = `${item.IdMaterial}_${index}`;
            // Se tiver processos, expande por padrão
            if (item.processos && item.processos.length > 0) {
              initialProcExpanded[key] = true;
            }
            initialNodesExpanded[key] = true;
          });
        }
        setExpandedProcesses(initialProcExpanded);
        setExpandedNodes(initialNodesExpanded);
      } else {
        setError(json.message || 'Falha ao carregar estrutura do produto.');
      }
    } catch (err: any) {
      console.error('[EstruturaProdutoModal] Erro:', err);
      setError('Erro de conexão ao carregar a estrutura do produto.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProcess = (key: string) => {
    setExpandedProcesses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAllProcesses = () => {
    if (!data?.flatBom) return;
    const all: Record<string, boolean> = {};
    data.flatBom.forEach((item, index) => {
      if (item.processos && item.processos.length > 0) {
        all[`${item.IdMaterial}_${index}`] = true;
      }
    });
    setExpandedProcesses(all);
  };

  const handleCollapseAllProcesses = () => {
    setExpandedProcesses({});
  };

  const handleOpenPdfDrawing = (enderecoArquivo?: string, idMaterialItem?: number) => {
    if (enderecoArquivo) {
      const cleanPath = enderecoArquivo.trim();
      window.open(`${API_BASE}/pdf?path=${encodeURIComponent(cleanPath)}`, '_blank');
      return;
    }
    if (idMaterialItem) {
      const token = localStorage.getItem('sinco_token');
      window.open(`${API_BASE}/materiais/${idMaterialItem}/arquivos?token=${token}`, '_blank');
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Planilha 1: BOM Estruturada Multinível com Resumo de Operações
    const bomRows = data.flatBom.map(item => {
      const procs = item.processos || [];
      const procSummary = procs.map(p => `[${p.Seq}] ${p.NomeProcesso} (${p.Recurso})`).join(' -> ');
      const totSetup = procs.reduce((acc, p) => acc + (p.TempoSetup || 0), 0);
      const totPadrao = procs.reduce((acc, p) => acc + (p.TempoPadrao || 0), 0);

      return {
        'Nível': item.Nivel === 0 ? '0 (Raiz)' : item.Nivel,
        'Código do Item': item.CodMatFabricante,
        'Descrição': item.DescResumo,
        'Classificação': item.PecaManufat === 'S' ? 'Peça Manufaturada' : 'Insumo Comprado',
        'Qtd. Unitária': item.QtdeUnitaria,
        'Qtd. Acumulada': item.QtdeAcumulada,
        'Unidade': item.Unidade,
        'Peso Unit. (kg)': item.Peso,
        'Peso Total (kg)': item.PesoTotal,
        'Roteiro de Operações': procSummary || (item.PecaManufat === 'S' ? 'Sem operações cadastradas' : '-'),
        'Tempo Setup Total (min)': totSetup || '',
        'Tempo Padrão Total (min)': totPadrao || '',
        'Tempo Fabricação (min)': (totSetup + totPadrao) || '',
        'Caminho Desenho': item.EnderecoArquivo || ''
      };
    });

    // Planilha 2: Roteiro Detalhado por Etapa e Recurso
    const processoRows: any[] = [];
    data.flatBom.forEach(item => {
      if (item.processos && item.processos.length > 0) {
        item.processos.forEach(p => {
          processoRows.push({
            'Nível': item.Nivel === 0 ? '0 (Raiz)' : item.Nivel,
            'Código Peça': item.CodMatFabricante,
            'Descrição Peça': item.DescResumo,
            'Sequência': p.Seq,
            'Operação / Processo': p.NomeProcesso,
            'Recurso / Posto de Trabalho': p.Recurso,
            'Setup (min)': p.TempoSetup,
            'Tempo Padrão (min)': p.TempoPadrao,
            'Tempo Estimado (min)': (p.TempoSetup || 0) + (p.TempoPadrao || 0),
            'Observação': p.Observacao || ''
          });
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const wsBom = XLSX.utils.json_to_sheet(bomRows);
    XLSX.utils.book_append_sheet(wb, wsBom, 'Estrutura Completa & Roteiro');

    if (processoRows.length > 0) {
      const wsProc = XLSX.utils.json_to_sheet(processoRows);
      XLSX.utils.book_append_sheet(wb, wsProc, 'Recursos Detalhados');
    }

    const fileName = `Estrutura_Produto_${data.material.CodMatFabricante || 'BOM'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDownloadPdfReport = () => {
    if (!idMaterial) return;
    const token = localStorage.getItem('sinco_token');
    window.open(`${API_BASE}/material/${idMaterial}/relatorio/pdf?token=${token}`, '_blank');
  };

  const handleDownloadExcelReport = () => {
    if (!idMaterial) return;
    const token = localStorage.getItem('sinco_token');
    window.open(`${API_BASE}/material/${idMaterial}/relatorio/excel?token=${token}`, '_blank');
  };

  // Filtragem dos itens da árvore (inclui filtro por código, descrição e nome de processo/recurso)
  const filteredBom = useMemo(() => {
    if (!data?.flatBom) return [];
    if (!searchTerm.trim()) return data.flatBom;
    const term = searchTerm.toLowerCase();

    return data.flatBom.filter(item => {
      const matchCod = item.CodMatFabricante?.toLowerCase().includes(term);
      const matchDesc = item.DescResumo?.toLowerCase().includes(term);
      const matchProcesso = item.processos?.some(
        p => p.NomeProcesso?.toLowerCase().includes(term) || p.Recurso?.toLowerCase().includes(term)
      );
      return matchCod || matchDesc || matchProcesso;
    });
  }, [data?.flatBom, searchTerm]);

  // Tempo total geral de fabricação acumulado em toda a árvore
  const tempoTotalGeral = useMemo(() => {
    if (!data?.roteiroProcessos) return 0;
    return data.roteiroProcessos.reduce((acc, r) => acc + (r.tempoTotalGeral || 0), 0);
  }, [data?.roteiroProcessos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────────
            CABEÇALHO OFICIAL SINCOWEB (Verde Escuro #32423D com Dourado #E0E800)
        ───────────────────────────────────────────────────────────────── */}
        <div className="bg-[#32423D] text-white px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 shadow-sm border-b border-[#24302c]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-black/25 border border-white/10 flex items-center justify-center text-[#E0E800] shrink-0 shadow-inner">
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold font-mono text-white tracking-wide">
                  {data?.material?.CodMatFabricante || codMatFabricante || 'ESTRUTURA DO PRODUTO'}
                </span>
                {data?.material?.PecaManufat === 'S' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <Factory size={11} className="text-emerald-400" />
                    Peça Manufaturada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-gray-200 border border-white/20">
                    <Package size={11} className="text-gray-300" />
                    Insumo / Comprado
                  </span>
                )}
                {data?.material?.TxtTipoDesenho && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/20 text-amber-300 border border-white/10">
                    {data.material.TxtTipoDesenho}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 truncate max-w-2xl mt-0.5">
                {data?.material?.DescResumo || data?.material?.DescDetal || 'Árvore de Componentes & Roteiro de Recursos Integrados por Nível'}
              </p>
            </div>
          </div>

          {/* Botões de Ação do Cabeçalho */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
            {data?.material?.EnderecoArquivo && (
              <button
                onClick={() => handleOpenPdfDrawing(data.material.EnderecoArquivo, data.material.IdMaterial)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors shadow-xs"
                title="Visualizar Desenho Técnico CAD / Arquivo da Peça"
              >
                <FileText size={13} className="text-blue-300" />
                <span className="hidden sm:inline">Desenho CAD</span>
              </button>
            )}

            <a
              href={`/peca-manufaturada?search=${encodeURIComponent(data?.material?.CodMatFabricante || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#567469] hover:bg-[#465f56] text-white transition-colors shadow-xs"
              title="Abrir tela de Monta Peça Manufaturada para editar composição ou processos"
            >
              <ExternalLink size={13} className="text-gray-200" />
              <span className="hidden sm:inline">Editar Receita</span>
            </a>

            {/* Botão Relatório PDF */}
            <button
              onClick={handleDownloadPdfReport}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gerar e Visualizar Relatório Técnico da Estrutura em PDF (A4 Paisagem)"
            >
              <FileText size={14} />
              <span>Relatório PDF</span>
            </button>

            {/* Botão Relatório Excel */}
            <button
              onClick={handleDownloadExcelReport}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E0E800] text-gray-900 hover:bg-yellow-400 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Baixar Relatório Técnico da Estrutura em Excel (.xlsx no padrão SincoWeb)"
            >
              <Download size={14} />
              <span>Relatório Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Fechar (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIBBON DE TELEMETRIA TÉCNICA (Estilo SincoWeb)
        ───────────────────────────────────────────────────────────────── */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-2xs">
            <GitFork size={16} className="text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">Profundidade</span>
              <span className="font-mono font-bold text-[#32423D]">{data?.totalNiveis || 0} {data?.totalNiveis === 1 ? 'Nível' : 'Níveis'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-2xs">
            <Layers size={16} className="text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">Total de Componentes</span>
              <span className="font-mono font-bold text-[#32423D]">{data?.totalItens || 0} itens na árvore</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-2xs">
            <Weight size={16} className="text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">Peso Total Estimado</span>
              <span className="font-mono font-bold text-[#32423D]">{Number(data?.pesoTotal || 0).toFixed(3)} kg</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-2xs">
            <Clock size={16} className="text-cyan-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">Tempo Total Fabricação</span>
              <span className="font-mono font-bold text-[#32423D]">{tempoTotalGeral.toFixed(1)} min</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            BARRA DE FERRAMENTAS E BUSCA INTEGRADA
        ───────────────────────────────────────────────────────────────── */}
        <div className="bg-white px-4 py-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar código, descrição ou processo fabril..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#32423D] focus:ring-1 focus:ring-[#32423D]/20 transition-all"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-gray-500 hover:text-gray-800 px-1.5 py-1"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Controles de Roteiro e Níveis */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleExpandAllProcesses}
              className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition-colors flex items-center gap-1.5"
              title="Expandir todas as caixas de roteiro de fabricação"
            >
              <Wrench size={13} className="text-emerald-700" />
              <span>Expandir Roteiros</span>
            </button>

            <button
              onClick={handleCollapseAllProcesses}
              className="px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 font-medium transition-colors"
              title="Ocultar todas as caixas de roteiro"
            >
              Recolher Roteiros
            </button>

            <span className="text-gray-300">|</span>

            <span className="text-gray-500 text-xs font-medium">
              Exibindo <strong className="text-gray-900 font-mono">{filteredBom.length}</strong> de <strong className="text-gray-900 font-mono">{data?.flatBom?.length || 0}</strong> nós
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            ÁREA DA TABELA INTEGRADA (BOM + ROTEIRO DE RECURSOS POR NÍVEL)
        ───────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-gray-100/60 p-3 sm:p-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-3 border-[#32423D] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Carregando árvore de produtos e roteiro de processos...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-red-700 max-w-md mx-auto text-center">
              <AlertCircle size={38} className="text-red-500" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={() => idMaterial && fetchEstrutura(idMaterial)}
                className="px-4 py-1.5 rounded-lg bg-[#32423D] hover:bg-[#25332f] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredBom.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <Package size={44} className="text-gray-300" />
              <p className="text-sm font-bold text-gray-700">Nenhum componente vinculado</p>
              <p className="text-xs text-gray-500 max-w-sm">
                Esta peça ainda não possui árvore cadastrada na tabela de composição (montapeca).
              </p>
              <a
                href={`/peca-manufaturada?search=${encodeURIComponent(data?.material?.CodMatFabricante || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#32423D] hover:bg-[#25332f] text-white font-bold text-xs transition-all shadow-sm"
              >
                <Factory size={15} />
                Cadastrar Composição Agora
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-md border border-gray-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                {/* CABEÇALHO DA TABELA NO VERDE PADRÃO DO SINCOWEB */}
                <thead className="bg-[#567469] text-white text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Nível</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Código do Item</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Descrição Técnica</th>
                    <th className="py-2.5 px-2 text-center w-36">Classificação</th>
                    <th className="py-2.5 px-2 text-right w-24">Qtd. Unit.</th>
                    <th className="py-2.5 px-2 text-right w-24">Qtd. Acum.</th>
                    <th className="py-2.5 px-2 text-center w-16">Unid.</th>
                    <th className="py-2.5 px-2 text-right w-24">Peso Unit.</th>
                    <th className="py-2.5 px-2 text-right w-24">Peso Total</th>
                    <th className="py-2.5 px-3 text-center w-20">Desenho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filteredBom.map((item, idx) => {
                    const itemKey = `${item.IdMaterial}_${idx}`;
                    const hasProcs = item.processos && item.processos.length > 0;
                    const isProcExpanded = expandedProcesses[itemKey] !== false;
                    const isRoot = item.Nivel === 0;

                    // Cores suaves dos badges de nível
                    const nivelBadgeClass =
                      item.Nivel === 0
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : item.Nivel === 1
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.Nivel === 2
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200';

                    // Totalizador de tempo dos processos deste item
                    const tempoTotalItem = hasProcs
                      ? item.processos!.reduce((acc, p) => acc + (p.TempoSetup || 0) + (p.TempoPadrao || 0), 0)
                      : 0;

                    return (
                      <React.Fragment key={itemKey}>
                        {/* ─────────────────────────────────────────────────
                            LINHA DO MATERIAL / PRODUTO
                        ───────────────────────────────────────────────── */}
                        <tr
                          className={`transition-colors hover:bg-slate-50/80 ${
                            isRoot ? 'bg-slate-50/90 font-semibold' : ''
                          }`}
                        >
                          {/* Coluna Nível */}
                          <td className="py-2 px-3 align-middle">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${nivelBadgeClass}`}
                            >
                              {isRoot ? 'Nível 0 (Raiz)' : `Nível ${item.Nivel}`}
                            </span>
                          </td>

                          {/* Coluna Código com Indentação Hierárquica */}
                          <td className="py-2 px-3 align-middle font-mono font-bold text-gray-900">
                            <div
                              className="flex items-center gap-1.5 flex-wrap"
                              style={{ paddingLeft: `${item.Nivel * 18}px` }}
                            >
                              {item.Nivel > 0 && (
                                <span className="text-gray-400 font-sans select-none text-xs">↳</span>
                              )}
                              <span className="text-xs truncate" title={item.CodMatFabricante}>
                                {item.CodMatFabricante}
                              </span>

                              {/* Toggle do Roteiro / Processos */}
                              {hasProcs ? (
                                <button
                                  type="button"
                                  onClick={() => toggleProcess(itemKey)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all shadow-2xs ${
                                    isProcExpanded
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-300'
                                  }`}
                                  title={isProcExpanded ? 'Ocultar roteiro de fabricação' : 'Ver roteiro de fabricação deste item'}
                                >
                                  <Wrench size={10} className="text-emerald-700" />
                                  <span>{item.processos!.length} Operações</span>
                                  {tempoTotalItem > 0 && (
                                    <span className="font-bold">({tempoTotalItem.toFixed(1)}m)</span>
                                  )}
                                  {isProcExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                              ) : item.PecaManufat === 'S' ? (
                                <span
                                  className="text-[9px] text-gray-400 italic px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200"
                                  title="Peça manufaturada sem etapas cadastradas"
                                >
                                  Sem roteiro
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Coluna Descrição Técnica */}
                          <td className="py-2 px-3 align-middle font-sans text-gray-700">
                            <span className="line-clamp-1 text-xs" title={item.DescResumo}>
                              {item.DescResumo}
                            </span>
                          </td>

                          {/* Classificação: Peça vs Insumo */}
                          <td className="py-2 px-2 align-middle text-center">
                            {item.PecaManufat === 'S' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <Factory size={11} className="text-emerald-600" />
                                Peça Manuf.
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                <Package size={11} className="text-gray-400" />
                                Insumo
                              </span>
                            )}
                          </td>

                          {/* Quantidade Unitária */}
                          <td className="py-2 px-2 align-middle text-right text-gray-700">
                            {Number(item.QtdeUnitaria).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>

                          {/* Quantidade Acumulada */}
                          <td className="py-2 px-2 align-middle text-right font-bold text-[#32423D]">
                            {Number(item.QtdeAcumulada).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>

                          {/* Unidade */}
                          <td className="py-2 px-2 align-middle text-center text-gray-500 text-[11px]">
                            {item.Unidade || 'UN'}
                          </td>

                          {/* Peso Unitário */}
                          <td className="py-2 px-2 align-middle text-right text-gray-700">
                            {Number(item.Peso || 0).toFixed(3)}
                          </td>

                          {/* Peso Total */}
                          <td className="py-2 px-2 align-middle text-right font-semibold text-amber-700">
                            {Number(item.PesoTotal || 0).toFixed(3)}
                          </td>

                          {/* Botão Desenho Técnico (PDF) */}
                          <td className="py-2 px-3 align-middle text-center">
                            {item.EnderecoArquivo ? (
                              <button
                                onClick={() => handleOpenPdfDrawing(item.EnderecoArquivo, item.IdMaterial)}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors inline-flex items-center justify-center shadow-2xs"
                                title={`Visualizar Desenho: ${item.EnderecoArquivo}`}
                              >
                                <FileText size={13} className="text-blue-600" />
                              </button>
                            ) : (
                              <span className="text-gray-300 select-none">-</span>
                            )}
                          </td>
                        </tr>

                        {/* ─────────────────────────────────────────────────
                            SUB-LINHA: ROTEIRO & RECURSOS INTEGRADOS NO NÍVEL
                        ───────────────────────────────────────────────── */}
                        {hasProcs && isProcExpanded && (
                          <tr className="bg-emerald-50/20">
                            <td colSpan={10} className="py-2 px-3">
                              <div
                                className="rounded-md border border-emerald-200/80 bg-white overflow-hidden shadow-2xs my-1"
                                style={{ marginLeft: `${(item.Nivel * 18) + 16}px` }}
                              >
                                {/* Cabeçalho do Roteiro da Peça */}
                                <div className="bg-emerald-50/80 px-3 py-1.5 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Wrench size={13} className="text-emerald-700" />
                                    <span className="font-bold text-emerald-950 font-sans">
                                      Roteiro de Fabricação: <span className="font-mono text-[#32423D]">{item.CodMatFabricante}</span>
                                    </span>
                                    <span className="text-[11px] text-gray-500 font-sans">({item.processos!.length} etapas produtivas)</span>
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] font-mono text-gray-600">
                                    <span>
                                      Setup: <strong className="text-gray-900">{item.processos!.reduce((a, b) => a + (b.TempoSetup || 0), 0).toFixed(1)}m</strong>
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span>
                                      Padrão: <strong className="text-gray-900">{item.processos!.reduce((a, b) => a + (b.TempoPadrao || 0), 0).toFixed(1)}m</strong>
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                                      Total: {tempoTotalItem.toFixed(1)} min
                                    </span>
                                  </div>
                                </div>

                                {/* Tabela de Operações / Recursos */}
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead className="bg-emerald-900/5 text-emerald-950 text-[10px] uppercase font-bold tracking-wider border-b border-emerald-100">
                                    <tr>
                                      <th className="py-1.5 px-3 w-16 text-center">Seq</th>
                                      <th className="py-1.5 px-3 min-w-[180px]">Operação / Processo</th>
                                      <th className="py-1.5 px-3 min-w-[180px]">Posto de Trabalho / Recurso</th>
                                      <th className="py-1.5 px-3 text-right w-24">Tempo Setup</th>
                                      <th className="py-1.5 px-3 text-right w-24">Tempo Padrão</th>
                                      <th className="py-1.5 px-3 text-right w-24">Tempo Total</th>
                                      <th className="py-1.5 px-3">Observações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-emerald-100/60 font-mono text-xs">
                                    {item.processos!.map((proc, prIdx) => {
                                      const totEtapa = (proc.TempoSetup || 0) + (proc.TempoPadrao || 0);
                                      return (
                                        <tr key={prIdx} className="hover:bg-emerald-50/40 transition-colors">
                                          <td className="py-1.5 px-3 text-center font-bold text-emerald-900">
                                            {proc.Seq}
                                          </td>
                                          <td className="py-1.5 px-3 font-sans font-medium text-gray-900">
                                            {proc.NomeProcesso}
                                          </td>
                                          <td className="py-1.5 px-3 text-emerald-700 font-sans font-medium">
                                            {proc.Recurso}
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-gray-700">
                                            {proc.TempoSetup ? `${proc.TempoSetup.toFixed(2)}m` : '-'}
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-gray-700">
                                            {proc.TempoPadrao ? `${proc.TempoPadrao.toFixed(2)}m` : '-'}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-bold text-emerald-800">
                                            {totEtapa > 0 ? `${totEtapa.toFixed(2)} min` : '-'}
                                          </td>
                                          <td className="py-1.5 px-3 font-sans text-gray-500 text-[11px]">
                                            {proc.Observacao || '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RODAPÉ DO MODAL (Estilo SincoWeb)
        ───────────────────────────────────────────────────────────────── */}
        <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Estrutura multinível completa calculada a partir de <strong>montapeca</strong> e <strong>material_processo</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#32423D] hover:bg-[#25332f] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
