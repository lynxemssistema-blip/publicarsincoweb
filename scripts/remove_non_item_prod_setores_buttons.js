const fs = require('fs');

const vgFile = 'frontend/src/pages/VisaoGeralProducao.tsx';
const osFile = 'frontend/src/pages/OrdemServico.tsx';

// 1. Remove Tag Prod. Setores button from VisaoGeralProducao.tsx
let vg = fs.readFileSync(vgFile, 'utf8');

const tagButtonPattern = /<button\s+type="button"\s+onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*openTagSectorsModal\(t\);\s*\}\}[\s\S]{1,250}<Activity size=\{11\} \/> Prod\. Setores\s*<\/button>/g;
vg = vg.replace(tagButtonPattern, '');

// Also ensure OS row Prod. Setores button is removed
const osButtonPattern = /<button\s+type="button"\s+onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*openOsSectorsModal\(os\);\s*\}\}[\s\S]{1,250}<Activity size=\{10\} \/> Prod\. Setores\s*<\/button>/g;
vg = vg.replace(osButtonPattern, '');

fs.writeFileSync(vgFile, vg, 'utf8');
console.log(`✅ Removed Tag and OS Prod. Setores buttons from ${vgFile}`);

// 2. Remove OS Prod. Setores button from OrdemServico.tsx
let osText = fs.readFileSync(osFile, 'utf8');
const osCardButtonPattern = /<button\s+onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*openOsSectorsModal\(os\);\s*\}\}[\s\S]{1,250}<Activity size=\{15\} \/> Prod\. Setores\s*<\/button>/g;
osText = osText.replace(osCardButtonPattern, '');

fs.writeFileSync(osFile, osText, 'utf8');
console.log(`✅ Removed OS Prod. Setores button from ${osFile}`);
