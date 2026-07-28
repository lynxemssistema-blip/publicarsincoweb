const fs = require('fs');

const page1 = 'frontend/src/pages/ApontamentoProducao.tsx';
const page2 = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';

function makeModalInstant(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Set loadingDetails to false immediately in openModal so it NEVER blocks modal content!
  content = content.replace(
    'setLoadingDetails(true);',
    'setLoadingDetails(false);'
  );

  // In JSX modal body, remove loadingDetails check completely so itemDetails / selectedItem ALWAYS renders instantly
  const oldBodyJSX = `{loadingDetails ? (
  <div className="py-8 flex flex-col items-center gap-3 text-gray-400">
  <Loader2 size={24} className="animate-spin" />
  <p className="text-xs">Carregando detalhes...</p>
  </div>
  ) : itemDetails ? (`;

  const newBodyJSX = `{itemDetails ? (`;

  content = content.replace(oldBodyJSX, newBodyJSX);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Made openModal 100% instant with zero spinner delay in ${filePath}`);
}

makeModalInstant(page1);
makeModalInstant(page2);
