const fs = require('fs');
const file = 'frontend/src/pages/OrdemServico.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove filter logic from setoresRncConfig
const filterRegex = /\{setoresRncConfig\.filter\([\s\S]*?\}\)\.map\(\(s,\s*i\)\s*=>\s*<option key=\{i\} value=\{s\}>\{s\}<\/option>\)\}/;
content = content.replace(filterRegex, '{setoresRncConfig.map((s, i) => <option key={i} value={s}>{s}</option>)}');
if (!content.includes('setoresRncConfig.map')) console.error("Failed to fix filter!");

// 2. Remove Processos section
const procRegex = /\{\/\* Processos \*\/\}[\s\S]*?<\/div>(\s*)\{\/\* Seção/i;
content = content.replace(procRegex, '{/* Seção');
if (content.includes('{/* Processos */}')) console.error("Failed to remove Processos!");

// 3. Move buttons
// Replace widths
content = content.replace(/style=\{\{\s*width:\s*'16rem'\s*\}\}/g, "style={{ width: '21rem' }}");
content = content.replace(/style=\{\{\s*width:\s*'13.5rem'\s*\}\}/g, "style={{ width: '18.5rem' }}");

// Extract RNC button
const rncBtnRegex = /\{\/\* Botão Gerar Pendência \(RNC\) - sempre visível \*\/\}\s*<button[\s\S]*?<ShieldAlert size=\{14\} \/>\s*<\/button>/;
const rncMatch = content.match(rncBtnRegex);
let rncBtnCode = rncMatch ? rncMatch[0] : '';
content = content.replace(rncBtnRegex, '');

// Extract Delete button
const delBtnRegex = /\{\!\(os\.Liberado_Engenharia === 'S'[\s\S]*?<Trash2 size=\{14\} \/>\s*<\/button>\s*\)\s*:\s*\(\s*<div className="w-8 h-8 shrink-0 mr-2" \/>\s*\)\}/;
const delMatch = content.match(delBtnRegex);
let delBtnCode = delMatch ? delMatch[0] : '';
content = content.replace(delBtnRegex, '');

// Clean button classes
rncBtnCode = rncBtnCode.replace('ml-auto', '');
delBtnCode = delBtnCode.replace(/mr-2/g, '');

// Insert them correctly before <span className="w-32 shrink-0
const insertRegex = /(<Layers size=\{14\} \/>\s*<\/(?:button|div)>\s*\)\})\s*<\/div>\s*<span\s*className="w-32 shrink-0/;
content = content.replace(insertRegex, (match, p1) => {
    return p1 + '\n' + rncBtnCode + '\n' + delBtnCode + '\n                                                </div>\n                                                <span className="w-32 shrink-0';
});

// Update Header
const headerSpans = '<span className="w-8 text-center" title="Recursos"><Layers size={12} className="inline" /></span>';
const headerInsertStr = '\n                                                <span className="w-8 text-center" title="Pendências"><ShieldAlert size={12} className="inline" /></span>\n                                                <span className="w-8 text-center" title="Excluir"><Trash2 size={12} className="inline" /></span>';
content = content.replace(headerSpans, headerSpans + headerInsertStr);

// Update Spacers
const headerSpacersRegex = /\{\/\*\s*Spacers p\/ alinhar bot[^]*?Excluir\s*\*\/\}\s*<span className="w-8 shrink-0 ml-auto"><\/span>\s*<span className="w-8 shrink-0 mr-2"><\/span>/i;
content = content.replace(headerSpacersRegex, '');

// Update Skeletons
const skelCode = '<div className="w-8 h-8 rounded bg-gray-200 shrink-0" />\n                                                <div className="w-8 h-8 rounded bg-gray-200 shrink-0" />';
const skelInsertPointRegex = /(<div className="w-8 h-8 rounded bg-gray-200 shrink-0" \/>\s*)\{\/\* Código Desenho Skeleton \*\/\}/g;
content = content.replace(skelInsertPointRegex, (match, p1) => p1 + skelCode + '\n                                            {/* Código Desenho Skeleton */}');

fs.writeFileSync(file, content, 'utf8');
console.log("Success");
