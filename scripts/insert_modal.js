const fs = require('fs');
const path = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/frontend/src/pages/VisaoGeralProducao.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Check if the modal JSX is in the file
if (!code.includes('<ProdSetoresModal')) {
    console.log('Inserting ProdSetoresModal...');
    // Find the end of the return statement before the last closing tags
    const renderLocation = code.lastIndexOf('{actionModal === \'addRnc\' && (');
    if (renderLocation !== -1) {
        const replacement = `{showProdSetoresModal && (
        <ProdSetoresModal 
          onClose={() => { setShowProdSetoresModal(false); setSelProjForSectors(null); }} 
          projeto={selProjForSectors} 
          selectedTagsIds={selectedTagsForSectors} 
        />
      )}\n\n      `;
        code = code.slice(0, renderLocation) + replacement + code.slice(renderLocation);
        fs.writeFileSync(path, code);
        console.log('Modal inserted successfully.');
    } else {
        console.log('Could not find insertion point for modal.');
    }
} else {
    console.log('Modal already exists.');
}
