const fs = require('fs');
const file = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/frontend/src/pages/AcompanhamentoGeral.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix toggle buttons
content = content.replace(/text-slate-100 hover:text-slate-700/g, 'text-slate-500 hover:text-slate-700');

// Add clear button
const searchStr = `                    </button>\n                </div>\n            </div>`;
const replacementStr = `                    </button>\n                    {/* Clear Filters */}\n                    <button onClick={() => { setFSearchInput(''); setFSearchProjeto(''); setFDescricaoInput(''); setFSearchDescricao(''); setFStatus(''); setFDataDe(''); setFDataAte(''); setFModo('todos'); fetchDados(); }} title="Limpar Filtros" className="px-4 py-2 font-bold text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors shadow-sm">Limpar</button>\n                </div>\n            </div>`;

content = content.replace(searchStr, replacementStr);
// Try with \r\n just in case
const searchStr2 = `                    </button>\r\n                </div>\r\n            </div>`;
const replacementStr2 = `                    </button>\r\n                    {/* Clear Filters */}\r\n                    <button onClick={() => { setFSearchInput(''); setFSearchProjeto(''); setFDescricaoInput(''); setFSearchDescricao(''); setFStatus(''); setFDataDe(''); setFDataAte(''); setFModo('todos'); fetchDados(); }} title="Limpar Filtros" className="px-4 py-2 font-bold text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors shadow-sm">Limpar</button>\r\n                </div>\r\n            </div>`;

content = content.replace(searchStr2, replacementStr2);

fs.writeFileSync(file, content);
console.log("Substituições concluídas com sucesso.");
