const fs = require('fs');

function patchModal() {
    let file = 'frontend/src/components/SectorProductionModal.tsx';
    let code = fs.readFileSync(file, 'utf8');

    // 1. Add isLiberado to props
    if (!code.includes('isLiberado?: boolean;')) {
        code = code.replace(
            /sectors: any\[\];\n  \} \| null;/g,
            "sectors: any[];\n    isLiberado?: boolean;\n  } | null;"
        );
    }

    // 2. Disable inputs
    code = code.replace(/<input\n([^\>]*?)onChange=/gs, (match, p1) => {
        if (p1.includes('disabled={')) return match;
        return `<input\n${p1}disabled={modalData.isLiberado}\n                                                              onChange=`;
    });
    
    // 3. Disable save button
    if (!code.includes('disabled={saving || modalData.isLiberado}')) {
        code = code.replace(
            /disabled={saving}/g,
            "disabled={saving || modalData.isLiberado}"
        );
    }

    // 4. Add alert for read-only
    if (!code.includes('🔒 Esta Ordem de Serviço já está liberada pela engenharia')) {
        const headerEnd = '</h2>\n          </div>';
        const alertHtml = `</h2>
          </div>
          {modalData.isLiberado && (
            <div className="bg-amber-50 border-b border-amber-100 p-2 text-center text-[10px] text-amber-800 font-bold flex items-center justify-center gap-1.5 shadow-inner">
              <span>🔒 Esta Ordem de Serviço já está liberada pela engenharia. Alterações nas datas de produção estão bloqueadas.</span>
            </div>
          )}`;
        code = code.replace(headerEnd, alertHtml);
    }

    fs.writeFileSync(file, code, 'utf8');
    console.log("Patched SectorProductionModal.tsx");
}

function patchVisaoGeral() {
    let file = 'frontend/src/pages/VisaoGeralProducao.tsx';
    let code = fs.readFileSync(file, 'utf8');

    if (!code.includes('isLiberado: item.Liberado_Engenharia === \'S\'')) {
        code = code.replace(
            /targetId: item.IdOrdemServicoItem,\n      sectors: activeSectors\n    \}\);/g,
            "targetId: item.IdOrdemServicoItem,\n      sectors: activeSectors,\n      isLiberado: item.Liberado_Engenharia === 'S' || item.Liberado_Engenharia === 'SIM'\n    });"
        );
    }
    
    // Also patch for Tag level modal if it applies to OSs? Wait, Tag doesn't have Liberado_Engenharia directly. But maybe we can just patch the item modal for now.
    
    // Also disable the button itself optionally? The user might want to view it. The alert is better.

    fs.writeFileSync(file, code, 'utf8');
    console.log("Patched VisaoGeralProducao.tsx");
}

patchModal();
patchVisaoGeral();
