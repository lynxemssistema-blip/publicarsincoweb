const fs = require('fs');

// 1. Update VisaoGeralProducao.tsx with 100% case-insensitive Object.keys scanner
const vgFile = './frontend/src/pages/VisaoGeralProducao.tsx';
if (fs.existsSync(vgFile)) {
    let vgContent = fs.readFileSync(vgFile, 'utf8');

    const robustPlanningDatesFunc = `  const getSectorPlanningDates = (obj: any, sectorKey: string) => {
    if (!obj || typeof obj !== 'object') return { pi: '', pf: '', minProd: 0 };
    const target = String(sectorKey || '').trim().toLowerCase();
    let pi = '';
    let pf = '';
    let minProd = 0;

    for (const k of Object.keys(obj)) {
      const kLower = k.toLowerCase();
      
      if (!pi && kLower.startsWith('planejadoinicio')) {
        const rest = kLower.replace('planejadoinicio', '');
        if (rest === target || (target === 'pulsionadeira' && rest === 'pulsionadeira') || (target === 'galvanizar' && rest === 'galvanizar') || (target === 'cortealaser' && (rest === 'cortealaser' || rest === 'laser'))) {
          if (obj[k]) pi = String(obj[k]);
        }
      }

      if (!pf && kLower.startsWith('planejadofinal')) {
        const rest = kLower.replace('planejadofinal', '');
        if (rest === target || (target === 'pulsionadeira' && rest === 'pulsionadeira') || (target === 'galvanizar' && rest === 'galvanizar') || (target === 'cortealaser' && (rest === 'cortealaser' || rest === 'laser'))) {
          if (obj[k]) pf = String(obj[k]);
        }
      }

      if (kLower.endsWith('minprod')) {
        const prefix = kLower.replace('minprod', '');
        if (prefix === target || (target === 'pulsionadeira' && prefix === 'pulsionadeira') || (target === 'galvanizar' && prefix === 'galvanizar') || (target === 'cortealaser' && (prefix === 'cortealaser' || prefix === 'laser'))) {
          const val = parseInt(String(obj[k]), 10) || 0;
          if (val > 0) minProd = val;
        }
      }
    }

    return { pi, pf, minProd };
  };`;

    const oldFuncStart = vgContent.indexOf('const getSectorPlanningDates =');
    if (oldFuncStart !== -1) {
        const oldFuncEnd = vgContent.indexOf('};', oldFuncStart) + 2;
        vgContent = vgContent.slice(0, oldFuncStart) + robustPlanningDatesFunc + vgContent.slice(oldFuncEnd);
        fs.writeFileSync(vgFile, vgContent, 'utf8');
        console.log('✅ Updated getSectorPlanningDates in VisaoGeralProducao.tsx with case-insensitive Object.keys scanner');
    }
}

// 2. Update OrdemServico.tsx with 100% case-insensitive Object.keys scanner
const osFile = './frontend/src/pages/OrdemServico.tsx';
if (fs.existsSync(osFile)) {
    let osContent = fs.readFileSync(osFile, 'utf8');

    const robustPlanningDatesOS = `const getSectorPlanningDatesInOS = (obj: any, sectorKey: string) => {
  if (!obj || typeof obj !== 'object') return { pi: '', pf: '', minProd: 0 };
  const target = String(sectorKey || '').trim().toLowerCase();
  let pi = '';
  let pf = '';
  let minProd = 0;

  for (const k of Object.keys(obj)) {
    const kLower = k.toLowerCase();
    
    if (!pi && kLower.startsWith('planejadoinicio')) {
      const rest = kLower.replace('planejadoinicio', '');
      if (rest === target || (target === 'pulsionadeira' && rest === 'pulsionadeira') || (target === 'galvanizar' && rest === 'galvanizar') || (target === 'cortealaser' && (rest === 'cortealaser' || rest === 'laser'))) {
        if (obj[k]) pi = String(obj[k]);
      }
    }

    if (!pf && kLower.startsWith('planejadofinal')) {
      const rest = kLower.replace('planejadofinal', '');
      if (rest === target || (target === 'pulsionadeira' && rest === 'pulsionadeira') || (target === 'galvanizar' && rest === 'galvanizar') || (target === 'cortealaser' && (rest === 'cortealaser' || rest === 'laser'))) {
        if (obj[k]) pf = String(obj[k]);
      }
    }

    if (kLower.endsWith('minprod')) {
      const prefix = kLower.replace('minprod', '');
      if (prefix === target || (target === 'pulsionadeira' && prefix === 'pulsionadeira') || (target === 'galvanizar' && prefix === 'galvanizar') || (target === 'cortealaser' && (prefix === 'cortealaser' || prefix === 'laser'))) {
        const val = parseInt(String(obj[k]), 10) || 0;
        if (val > 0) minProd = val;
      }
    }
  }

  return { pi, pf, minProd };
};`;

    const oldOSStart = osContent.indexOf('const getSectorPlanningDatesInOS =');
    if (oldOSStart !== -1) {
        const oldOSEnd = osContent.indexOf('};', oldOSStart) + 2;
        osContent = osContent.slice(0, oldOSStart) + robustPlanningDatesOS + osContent.slice(oldOSEnd);
        fs.writeFileSync(osFile, osContent, 'utf8');
        console.log('✅ Updated getSectorPlanningDatesInOS in OrdemServico.tsx with case-insensitive Object.keys scanner');
    }
}

// 3. Update SectorProductionModal.tsx to clean up date inputs layout
const modalFile = './frontend/src/components/SectorProductionModal.tsx';
if (fs.existsSync(modalFile)) {
    let mContent = fs.readFileSync(modalFile, 'utf8');

    // Clean inputs layout
    const oldTd = `<td className="px-3 py-2 text-center border-r border-slate-100">
                          <div className="flex items-center justify-center gap-2">
                            {/* DATA INÍCIO (FORMATO DD/MM/AAAA EXPLICITO + SELETOR) */}
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-300 rounded focus-within:bg-white focus-within:border-[#32423D] hover:border-slate-400 transition-colors">
                              <span className="text-[9px] font-black text-slate-500 uppercase shrink-0">Início:</span>
                              <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={toBrDisplay(s.pi)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.length === 10 && val.includes('/')) {
                                    const iso = toIsoInput(val);
                                    if (iso) handlePiChange(idx, iso);
                                  } else if (val === '') {
                                    handlePiChange(idx, '');
                                  }
                                }}
                                className="w-20 bg-transparent text-xs font-black text-slate-900 border-none outline-none focus:ring-0 p-0 text-center"
                              />
                              <input
                                type="date"
                                value={toIsoInput(s.pi)}
                                onChange={(e) => handlePiChange(idx, e.target.value)}
                                className="w-4 h-4 cursor-pointer opacity-70 hover:opacity-100 border-none bg-transparent shrink-0"
                                title="Abrir Calendário"
                              />
                            </div>

                            <span className="text-slate-400 font-bold text-xs shrink-0">até</span>

                            {/* DATA FIM (FORMATO DD/MM/AAAA EXPLICITO + SELETOR) */}
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-300 rounded focus-within:bg-white focus-within:border-[#32423D] hover:border-slate-400 transition-colors">
                              <span className="text-[9px] font-black text-slate-500 uppercase shrink-0">Fim:</span>
                              <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={toBrDisplay(s.pf)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.length === 10 && val.includes('/')) {
                                    const iso = toIsoInput(val);
                                    if (iso) handlePfChange(idx, iso);
                                  } else if (val === '') {
                                    handlePfChange(idx, '');
                                  }
                                }}
                                className="w-20 bg-transparent text-xs font-black text-slate-900 border-none outline-none focus:ring-0 p-0 text-center"
                              />
                              <input
                                type="date"
                                value={toIsoInput(s.pf)}
                                onChange={(e) => handlePfChange(idx, e.target.value)}
                                className="w-4 h-4 cursor-pointer opacity-70 hover:opacity-100 border-none bg-transparent shrink-0"
                                title="Abrir Calendário"
                              />
                            </div>
                          </div>
                        </td>`;

    const newTd = `<td className="px-3 py-2 text-center border-r border-slate-100">
                          <div className="flex items-center justify-center gap-2">
                            {/* DATA INÍCIO (FORMATO EXPLICITO DD/MM/AAAA) */}
                            <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 border border-slate-300 rounded focus-within:bg-white focus-within:border-[#32423D] focus-within:ring-1 focus-within:ring-[#32423D] shadow-inner transition-all">
                              <span className="text-[9px] font-black text-slate-500 uppercase shrink-0">Início:</span>
                              <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={toBrDisplay(s.pi)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handlePiChange(idx, val);
                                }}
                                className="w-22 bg-transparent text-xs font-black text-slate-900 border-none outline-none focus:ring-0 p-0 text-center tracking-wide"
                              />
                            </div>

                            <span className="text-slate-400 font-bold text-xs shrink-0">até</span>

                            {/* DATA FIM (FORMATO EXPLICITO DD/MM/AAAA) */}
                            <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 border border-slate-300 rounded focus-within:bg-white focus-within:border-[#32423D] focus-within:ring-1 focus-within:ring-[#32423D] shadow-inner transition-all">
                              <span className="text-[9px] font-black text-slate-500 uppercase shrink-0">Fim:</span>
                              <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={toBrDisplay(s.pf)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handlePfChange(idx, val);
                                }}
                                className="w-22 bg-transparent text-xs font-black text-slate-900 border-none outline-none focus:ring-0 p-0 text-center tracking-wide"
                              />
                            </div>
                          </div>
                        </td>`;

    if (mContent.includes(oldTd)) {
        mContent = mContent.replace(oldTd, newTd);
        fs.writeFileSync(modalFile, mContent, 'utf8');
        console.log('✅ Cleaned up SectorProductionModal.tsx inputs to explicit text DD/MM/AAAA fields');
    }
}

console.log('🎉 Case-insensitive scanner & clean modal inputs applied!');
