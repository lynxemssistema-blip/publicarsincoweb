import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface SectorProductionModalProps {
  modalData: {
    title: string;
    targetType?: 'os' | 'tag' | 'item' | 'projeto';
    allTags?: any[];
    targetId?: number;
    sectors: any[];
    isLiberado?: boolean;
  } | null;
  onClose: () => void;
  onSave?: (updatedSectors: any[]) => void;
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token') || localStorage.getItem('sincoweb_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const tenant = localStorage.getItem('tenant_domain') || localStorage.getItem('sincoweb_tenant');
  if (tenant) {
    headers['x-tenant-domain'] = tenant;
  }
  return headers;
};

export default function SectorProductionModal({ modalData, onClose, onSave }: SectorProductionModalProps) {
  if (!modalData) return null;

  const [calcMode, setCalcMode] = useState<'auto' | 'manual'>('auto');
  const [autoDirection, setAutoDirection] = useState<'progressive' | 'regressive'>('progressive');
  const [targetDeadlineIso, setTargetDeadlineIso] = useState<string>('');
    const [incluirSabado, setIncluirSabado] = useState<boolean>(false);
  const [incluirDomingo, setIncluirDomingo] = useState<boolean>(false);
  const [incluirFeriado, setIncluirFeriado] = useState<boolean>(false);
  const [sectors, setSectors] = useState<any[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [applyLevel, setApplyLevel] = useState<'item' | 'os' | 'tag' | 'projeto'>('item');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const parseDateStr = (str?: string | null): Date | null => {
    if (!str || str === '—') return null;
    const s = String(str).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (y && !isNaN(d) && !isNaN(m)) return new Date(y, m, d);
      }
    }
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (y && !isNaN(d) && !isNaN(m)) return new Date(y, m, d);
      }
    }
    return null;
  };

  const toBrDisplay = (str?: string | null): string => {
    if (!str || str === '—') return '';
    const s = String(str).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) return s;
    }
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    return s;
  };

  const toIsoInput = (str?: string | null): string => {
    const dt = parseDateStr(str);
    if (!dt || isNaN(dt.getTime())) return '';
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const addDaysToIso = (isoStr: string, days: number): string => {
    const dt = parseDateStr(isoStr);
    if (!dt) return isoStr;
    dt.setDate(dt.getDate() + days);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isWeekendOrHoliday = (date: Date, incSab: boolean, incDom: boolean, incFer: boolean): boolean => {
    const day = date.getDay();
    if (day === 6 && !incSab) return true; // Sábado
    if (day === 0 && !incDom) return true; // Domingo

    const m = date.getMonth() + 1;
    const d = date.getDate();
    const fixed = ['1-1', '4-21', '5-1', '9-7', '10-12', '11-2', '11-15', '11-20', '12-25'];
    if (fixed.includes(`${m}-${d}`) && !incFer) return true; // Feriado

    return false;
  };

  const addBusinessDays = (startIso: string, daysCount: number, incSab: boolean, incDom: boolean, incFer: boolean): string => {
    const dt = parseDateStr(startIso);
    if (!dt) return startIso;
    while (isWeekendOrHoliday(dt, incSab, incDom, incFer)) {
      dt.setDate(dt.getDate() + 1);
    }
    let added = 1;
    while (added < daysCount) {
      dt.setDate(dt.getDate() + 1);
      if (!isWeekendOrHoliday(dt, incSab, incDom, incFer)) {
        added++;
      }
    }
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const subtractBusinessDays = (endIso: string, daysCount: number, incSab: boolean, incDom: boolean, incFer: boolean): string => {
    const dt = parseDateStr(endIso);
    if (!dt) return endIso;
    while (isWeekendOrHoliday(dt, incSab, incDom, incFer)) {
      dt.setDate(dt.getDate() - 1);
    }
    let subbed = 1;
    while (subbed < daysCount) {
      dt.setDate(dt.getDate() - 1);
      if (!isWeekendOrHoliday(dt, incSab, incDom, incFer)) {
        subbed++;
      }
    }
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getNextBusinessDay = (isoStr: string, incSab: boolean, incDom: boolean, incFer: boolean): string => {
    const dt = parseDateStr(isoStr);
    if (!dt) return isoStr;
    dt.setDate(dt.getDate() + 1);
    while (isWeekendOrHoliday(dt, incSab, incDom, incFer)) {
      dt.setDate(dt.getDate() + 1);
    }
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getPreviousBusinessDay = (isoStr: string, incSab: boolean, incDom: boolean, incFer: boolean): string => {
    const dt = parseDateStr(isoStr);
    if (!dt) return isoStr;
    dt.setDate(dt.getDate() - 1);
    while (isWeekendOrHoliday(dt, incSab, incDom, incFer)) {
      dt.setDate(dt.getDate() - 1);
    }
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const recalculateAutomaticChain = (
    list: any[],
    direction: 'progressive' | 'regressive' = autoDirection,
    deadlineIso: string = targetDeadlineIso,
    incSab: boolean = incluirSabado, incDom: boolean = incluirDomingo, incFer: boolean = incluirFeriado
  ): any[] => {
    const updated = list.map(item => ({ ...item }));
    if (updated.length === 0) return updated;

    if (direction === 'progressive') {
      for (let i = 0; i < updated.length; i++) {
        const curr = updated[i];
        const dias = Math.max(1, parseInt(String(curr.dias), 10) || 1);
        curr.dias = dias;

        if (i === 0) {
          if (curr.pi) {
            const isoPi = toIsoInput(curr.pi);
            if (isoPi) {
              const endIso = addBusinessDays(isoPi, dias, incSab, incDom, incFer);
              curr.pi = toBrDisplay(isoPi);
              curr.pf = toBrDisplay(endIso);
            }
          }
        } else {
          const prev = updated[i - 1];
          if (prev && prev.pf) {
            const prevPfIso = toIsoInput(prev.pf);
            if (prevPfIso) {
              const nextPiIso = prevPfIso;
              const nextPfIso = addBusinessDays(nextPiIso, dias, incluirSabado, incluirDomingo, incluirFeriado);
              curr.pi = toBrDisplay(nextPiIso);
              curr.pf = toBrDisplay(nextPfIso);
            }
          }
        }
      }
    } else {
      let currentEndIso = deadlineIso;
      if (!currentEndIso && updated[updated.length - 1]?.pf) {
        currentEndIso = toIsoInput(updated[updated.length - 1].pf);
      }
      if (!currentEndIso) {
        currentEndIso = toIsoInput(new Date().toISOString());
      }

      for (let i = updated.length - 1; i >= 0; i--) {
        const curr = updated[i];
        const dias = Math.max(1, parseInt(String(curr.dias), 10) || 1);
        curr.dias = dias;

        if (i === updated.length - 1) {
          const pfIso = currentEndIso;
          const piIso = subtractBusinessDays(pfIso, dias, incluirSabado, incluirDomingo, incluirFeriado);
          curr.pf = toBrDisplay(pfIso);
          curr.pi = toBrDisplay(piIso);
        } else {
          const nextRes = updated[i + 1];
          if (nextRes && nextRes.pi) {
            const nextPiIso = toIsoInput(nextRes.pi);
            if (nextPiIso) {
              const pfIso = nextPiIso;
              const piIso = subtractBusinessDays(pfIso, dias, incluirSabado, incluirDomingo, incluirFeriado);
              curr.pf = toBrDisplay(pfIso);
              curr.pi = toBrDisplay(piIso);
            }
          }
        }
      }
    }

    return updated;
  };

  const calcDaysBetween = (startIso: string, endIso: string): number => {
    const d1 = parseDateStr(startIso);
    const d2 = parseDateStr(endIso);
    if (!d1 || !d2 || d2 < d1) return 1;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  };

  

  // Exibe diretamente as datas de inicio e fim de cada recurso ativo da OS sem calculos encadeados
  useEffect(() => {
    if (modalData?.targetType === 'tag' && modalData?.targetId) {
      setSelectedTags([Number(modalData.targetId)]);
    }
  }, [modalData]);

  useEffect(() => {
    if (modalData && modalData.sectors) {
      const initial = modalData.sectors.map(s => {
        return {
          ...s,
          dias: Math.max(1, parseInt(String(s.dias), 10) || 1),
          pi: toBrDisplay(s.pi),
          pf: toBrDisplay(s.pf),
          minProd: parseInt(String(s.minProd || 0), 10) || 0,
          qtdeTotal: parseFloat(String(s.qtdeTotal ?? s.itemQty ?? 0)) || 0,
          totalExecutado: parseFloat(String(s.totalExecutado ?? s.exec ?? 0)) || 0,
          totalExecutar: parseFloat(String(s.totalExecutar ?? s.aExec ?? 0)) || 0
        };
      });

      setSectors(initial);
    }
  }, [modalData]);

  const moveSector = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sectors.length) return;

    const list = [...sectors];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    if (calcMode === 'auto') {
      setSectors(recalculateAutomaticChain(list, 0));
    } else {
      setSectors(list);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const list = [...sectors];
    const [moved] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    if (calcMode === 'auto') {
      setSectors(recalculateAutomaticChain(list, 0));
    } else {
      setSectors(list);
    }
  };

  const handleDiasChange = (index: number, newDias: number) => {
    const list = sectors.map(s => ({ ...s }));
    const diasVal = Math.max(1, newDias || 1);
    list[index].dias = diasVal;

    if (calcMode === 'auto') {
      setSectors(recalculateAutomaticChain(list, autoDirection));
    } else {
      setSectors(list);
    }
  };

      const handlePiChange = (index: number, newPiBr: string) => {
    const list = sectors.map(s => ({ ...s }));
    list[index].pi = newPiBr;

    if (calcMode === 'auto') {
      const isoPi = toIsoInput(newPiBr);
      if (isoPi) {
        const dias = Math.max(1, parseInt(String(list[index].dias), 10) || 1);
        const newPfIso = addDaysToIso(isoPi, dias - 1);
        list[index].pf = toBrDisplay(newPfIso);
      }
      setSectors(recalculateAutomaticChain(list, autoDirection));
    } else {
      setSectors(list);
    }
  };

  const handlePfChange = (index: number, newPfBr: string) => {
    const list = sectors.map(s => ({ ...s }));
    list[index].pf = newPfBr;

    if (calcMode === 'auto') {
      setSectors(recalculateAutomaticChain(list, autoDirection));
    } else {
      setSectors(list);
    }
  };

  const handleDirectionChange = (direction: 'progressive' | 'regressive') => {
    setAutoDirection(direction);
    setSectors(prev => recalculateAutomaticChain(prev, direction, targetDeadlineIso, incluirSabado, incluirDomingo, incluirFeriado));
  };

  const handleDeadlineDateChange = (isoDate: string) => {
    setTargetDeadlineIso(isoDate);
    setSectors(prev => recalculateAutomaticChain(prev, 'regressive', isoDate, incluirSabado, incluirDomingo, incluirFeriado));
  };

  

  const handleModeToggle = (mode: 'auto' | 'manual') => {
    setCalcMode(mode);
    if (mode === 'auto') {
      setSectors(recalculateAutomaticChain(sectors, 0));
    }
  };

  
  const handleRowClick = (idx: number) => {
    setActiveDragIndex(prev => prev === idx ? null : idx);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalData.targetType && modalData.targetId) {
        let finalTargetType = modalData.targetType;
        let finalTargetId = modalData.targetId;

        // Se o modal foi aberto para um item, aplica o applyLevel
        if (modalData.targetType === 'item' && modalData.item) {
          finalTargetType = applyLevel;
          if (applyLevel === 'os') finalTargetId = modalData.item.IdOrdemServico;
          else if (applyLevel === 'tag') finalTargetId = modalData.item.IdTag;
          else if (applyLevel === 'projeto') finalTargetId = modalData.item.IdProjeto;
        }

        const res = await fetch('/api/salvar-setores-planejamento', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            targetType: finalTargetType,
            targetId: finalTargetId,
            targetIds: finalTargetType === 'tag' ? selectedTags : undefined,
            sectors
          })
        });
        const r = await res.json();
        if (!r.success) {
          alert('Erro ao salvar planejamento: ' + (r.message || 'Erro desconhecido.'));
          setSaving(false);
          return;
        }
      }
      if (onSave) onSave(sectors);
      onClose();
    } catch (e) {
      console.error('Error saving sector planning:', e);
      alert('Erro de conexão ao salvar planejamento.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="bg-[#32423D] px-6 py-4 flex items-center justify-between text-white shadow-md">
          <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0E800] inline-block animate-pulse" />
            {modalData.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODE TOGGLE BAR E NIVEL DE APLICAÇÃO */}
        <div className="bg-slate-100/90 px-5 py-2.5 border-b border-slate-200 flex flex-col gap-3">
          
          {modalData.targetType === 'tag' && modalData.allTags && modalData.allTags.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Aplicar planejamento às seguintes Tags:</span>
              <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto p-1 bg-white border border-slate-300 rounded-lg shadow-inner">
                <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded transition-colors hover:bg-slate-50">
                  <input type="checkbox" checked={selectedTags.length === modalData.allTags.length} onChange={(e) => {
                    if (e.target.checked) setSelectedTags(modalData.allTags!.map(t => Number(t.IdTag)));
                    else setSelectedTags([Number(modalData.targetId)]);
                  }} className="w-3.5 h-3.5 rounded border-slate-300 text-[#32423D] focus:ring-[#32423D]" />
                  <span className="text-[10px] font-black text-slate-800">TODAS</span>
                </label>
                {modalData.allTags.map((t: any) => (
                  <label key={t.IdTag} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors">
                    <input type="checkbox" checked={selectedTags.includes(Number(t.IdTag))} 
                      disabled={Number(t.IdTag) === Number(modalData.targetId)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTags(prev => [...prev, Number(t.IdTag)]);
                        else setSelectedTags(prev => prev.filter(id => id !== Number(t.IdTag)));
                      }} className="w-3 h-3 rounded border-slate-300 text-[#32423D] focus:ring-[#32423D]" />
                    <span className="text-[10px] font-bold text-slate-700">TAG {t.IdTag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {modalData.targetType === 'item' && modalData.item && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Aplicar planejamento em:
              </span>
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-xs gap-1">
                <button
                  type="button"
                  onClick={() => setApplyLevel('item')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${applyLevel === 'item' ? 'bg-[#32423D] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Somente Item
                </button>
                <button
                  type="button"
                  onClick={() => setApplyLevel('os')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${applyLevel === 'os' ? 'bg-[#32423D] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={modalData.item.IdOrdemServico ? "Toda a OS" : "OS não informada"}
                  disabled={!modalData.item.IdOrdemServico}
                >
                  OS Inteira
                </button>
                <button
                  type="button"
                  onClick={() => setApplyLevel('tag')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${applyLevel === 'tag' ? 'bg-[#32423D] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={modalData.item.IdTag ? "Toda a Tag" : "Tag não informada"}
                  disabled={!modalData.item.IdTag}
                >
                  Tag Inteira
                </button>
                <button
                  type="button"
                  onClick={() => setApplyLevel('projeto')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${applyLevel === 'projeto' ? 'bg-[#32423D] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={modalData.item.IdProjeto ? "Todo o Projeto" : "Projeto não informado"}
                  disabled={!modalData.item.IdProjeto}
                >
                  Projeto Inteiro
                </button>
              </div>
            </div>
          )}

          

          {/* PAINEL DE SUB-OPÇÕES DO PROCESSO AUTOMÁTICO */}
          {calcMode === 'auto' && (
            <div className="bg-white/90 border border-emerald-300 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">Ordem:</span>
                <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('progressive')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold flex items-center gap-1 transition-all ${
                      autoDirection === 'progressive'
                        ? 'bg-[#32423D] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp size={11} /> 1 - Progressivo (Início → Fim)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('regressive')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold flex items-center gap-1 transition-all ${
                      autoDirection === 'regressive'
                        ? 'bg-[#32423D] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingDown size={11} /> 2 - Regressivo (Data Limite Final → Início)
                  </button>
                </div>
              </div>

              {autoDirection === 'regressive' && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 border border-amber-300 rounded shadow-xs">
                  <Calendar size={12} className="text-amber-600 shrink-0" />
                  <span className="font-bold text-slate-800 text-[10px]">Data Limite Final:</span>
                  <input
                    type="date"
                    value={targetDeadlineIso}
                    disabled={modalData.isLiberado}
                                                              onChange={(e) => handleDeadlineDateChange(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-extrabold text-slate-900 text-[11px] focus:border-[#32423D] outline-none cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 bg-white px-2 py-1 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Incluir:</span>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={incluirSabado}
                    disabled={modalData.isLiberado}
                    onChange={(e) => {
                      setIncluirSabado(e.target.checked);
                      setSectors(prev => recalculateAutomaticChain(prev, autoDirection, targetDeadlineIso, e.target.checked, incluirDomingo, incluirFeriado));
                    }}
                    className="w-3 h-3 rounded text-[#32423D] focus:ring-[#32423D] border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px]">Sábado</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={incluirDomingo}
                    disabled={modalData.isLiberado}
                    onChange={(e) => {
                      setIncluirDomingo(e.target.checked);
                      setSectors(prev => recalculateAutomaticChain(prev, autoDirection, targetDeadlineIso, incluirSabado, e.target.checked, incluirFeriado));
                    }}
                    className="w-3 h-3 rounded text-[#32423D] focus:ring-[#32423D] border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px]">Domingo</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={incluirFeriado}
                    disabled={modalData.isLiberado}
                    onChange={(e) => {
                      setIncluirFeriado(e.target.checked);
                      setSectors(prev => recalculateAutomaticChain(prev, autoDirection, targetDeadlineIso, incluirSabado, incluirDomingo, e.target.checked));
                    }}
                    className="w-3 h-3 rounded text-[#32423D] focus:ring-[#32423D] border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px]">Feriado</span>
                </label>
              </div>
            </div>
          )}
        </div>

        
        

        {/* MODAL BODY */}
        <div className="p-5 bg-slate-50/50 max-h-[65vh] overflow-y-auto">
          {sectors.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm font-medium bg-white rounded-lg border border-slate-200 shadow-xs">
              Nenhum recurso/setor ativo localizado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 border-r border-slate-200 font-black text-slate-800">Recurso Ativo (Posição)</th>
                    <th className="px-2 py-2.5 text-center border-r border-slate-200 w-36 font-black text-slate-800">Peças (Tot | Exec | Pend)</th>
                    <th className="px-2.5 py-2.5 text-center border-r border-slate-200 w-28 font-black text-slate-800">Min. Prod</th>
                    <th className="px-3 py-2.5 text-center border-r border-slate-200 w-32 font-black text-slate-800">Dias p/ Produção</th>
                    <th className="px-3 py-2.5 text-center font-black text-slate-800">Intervalo de Datas p/ Produção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sectors.map((s, idx) => {
                    return (
                      <tr 
                        key={s.key || idx} 
                        draggable={activeDragIndex === idx}
                        onClick={() => handleRowClick(idx)}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          handleDrop(e, idx);
                          setActiveDragIndex(null);
                        }}
                        className={`transition-all cursor-pointer ${
                          activeDragIndex === idx || draggedIndex === idx
                            ? 'bg-amber-50/80 border-2 border-dashed border-amber-500 shadow-md ring-1 ring-amber-400'
                            : 'hover:bg-slate-50/90 border-b border-slate-100'
                        }`}
                      >
                        {/* COLUNA 1: RECURSO ATIVO + ARRASTAR */}
                        <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-100 uppercase text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => { e.stopPropagation(); moveSector(idx, -1); }}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                                title="Mover para Cima"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === sectors.length - 1}
                                onClick={(e) => { e.stopPropagation(); moveSector(idx, 1); }}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                                title="Mover para Baixo"
                              >
                                <ArrowDown size={11} />
                              </button>
                            </div>

                            <span className="w-2.5 h-2.5 rounded-full bg-[#32423D] shrink-0" />
                            <span className="font-extrabold text-slate-800 text-xs tracking-wide">{s.label}</span>
                          </div>
                        </td>

                        {/* COLUNA: PEÇAS AGRUPADAS */}
                        <td className="px-2 py-1.5 text-center border-r border-slate-100">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="font-extrabold text-slate-800 text-xs" title="Quantidade Total">
                              {s.qtdeTotal ?? s.itemQty ?? 0}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              <span className="font-bold text-emerald-600" title="Total Executado">
                                ✓ {s.totalExecutado ?? s.exec ?? 0}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="font-bold text-amber-600" title="A Executar">
                                ⏱ {s.totalExecutar ?? s.aExec ?? 0}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* COLUNA: MINPROD ACUMULADO */}
                        <td className="px-3 py-2 text-center border-r border-slate-100">
                          <span
                            title="Minutos de Produção Apontados Acumulados"
                            className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                              (s.minProd || 0) > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {s.minProd || 0} min
                          </span>
                        </td>

                        {/* COLUNA 2: DIAS P/ PRODUÇÃO DO ITEM */}
                        <td className="px-3 py-2 text-center border-r border-slate-100">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={s.dias || 1}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleDiasChange(idx, parseInt(e.target.value, 10) || 1)}
                              className="w-16 px-2 py-1 text-center font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#32423D] focus:ring-1 focus:ring-[#32423D] text-xs"
                            />
                            <span className="text-[10px] text-slate-500 font-bold">dias</span>
                          </div>
                        </td>

                        {/* COLUNA 3: INTERVALO DE DATAS */}
                        <td className="px-2 py-1.5 text-center border-r border-slate-100">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* DATA INÍCIO */}
                            <div className="flex items-center bg-[#F8FAFC] px-1.5 py-1 border border-slate-300 rounded focus-within:bg-white focus-within:border-[#32423D] focus-within:ring-1 focus-within:ring-[#32423D] shadow-inner transition-all relative" onClick={(e) => { const input = e.currentTarget.querySelector("input"); if (input && input.showPicker) input.showPicker(); }}>
                              <input
                                type="date"
                                placeholder="Início"
                                value={toIsoInput(s.pi) || ''}
                                disabled={modalData.isLiberado}
                                onChange={(e) => handlePiChange(idx, toBrDisplay(e.target.value))}
                                className="w-[130px] bg-transparent text-xs font-black text-slate-700 border-none outline-none focus:ring-0 p-1 cursor-pointer"
                              />
                            </div>

                            <span className="text-slate-400 font-bold text-xs shrink-0">→</span>

                            {/* DATA FIM */}
                            <div className="flex items-center bg-[#F8FAFC] px-1.5 py-1 border border-slate-300 rounded focus-within:bg-white focus-within:border-[#32423D] focus-within:ring-1 focus-within:ring-[#32423D] shadow-inner transition-all relative" onClick={(e) => { const input = e.currentTarget.querySelector("input"); if (input && input.showPicker) input.showPicker(); }}>
                              <input
                                type="date"
                                placeholder="Fim"
                                value={toIsoInput(s.pf) || ''}
                                disabled={modalData.isLiberado}
                                onChange={(e) => {
                                  const newPfBr = toBrDisplay(e.target.value);
                                  const list = sectors.map(sec => ({ ...sec }));
                                  list[idx].pf = newPfBr;
                                  
                                  const isoPi = toIsoInput(list[idx].pi);
                                  const isoPf = e.target.value;
                                  if (isoPi && isoPf) {
                                    list[idx].dias = calcDaysBetween(isoPi, isoPf);
                                  }
                                  
                                  if (calcMode === 'auto') {
                                    setSectors(recalculateAutomaticChain(list, autoDirection, targetDeadlineIso, incluirSabado, incluirDomingo, incluirFeriado));
                                  } else {
                                    setSectors(list);
                                  }
                                }}
                                className="w-[130px] bg-transparent text-xs font-black text-slate-700 border-none outline-none focus:ring-0 p-1 cursor-pointer"
                              />
                            </div>
                          </div>
                        </td>


                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 italic">
            * Arraste a linha do recurso ou use as setas ▲/▼ para reordenar a sequência.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || modalData.isLiberado}
              onClick={handleSave}
              className="px-5 py-1.5 text-xs font-black text-white bg-[#32423D] hover:bg-[#25322E] rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <span>✓ Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
