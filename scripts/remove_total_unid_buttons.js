const fs = require('fs');

const page1 = 'frontend/src/pages/ApontamentoProducao.tsx';
const page2 = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';

function removeTotalUnidButtons(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldBlockRegex = /\{itemDetails\.qtdeFaltante > 0 && \(\s*<div className="flex gap-1 w-32 items-end pt-3">[\s\S]*?Unid \(1\)[\s\S]*?<\/button>\s*<\/div>\s*\)\}/g;

  content = content.replace(oldBlockRegex, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Removed Total and Unid (1) buttons from ${filePath}`);
}

removeTotalUnidButtons(page1);
removeTotalUnidButtons(page2);
