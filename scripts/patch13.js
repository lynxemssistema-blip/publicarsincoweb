const fs = require('fs');
const file = 'frontend/src/pages/OrdemServico.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
let insertIdx = -1;
let deleteStart = -1;
let deleteEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Inicializar tempos por recurso para setores ativos (txtField === \\'1\\')')) {
        insertIdx = i;
    }
    if (lines[i].includes('// Buscar processos com Fabrica = \\'SIM\\' do backend')) {
        deleteStart = i;
    }
    if (deleteStart !== -1 && lines[i].includes('setProcessosFabricaSIM(lista as any);')) {
        deleteEnd = i + 3; // Include the closing braces and catch block
        break;
    }
}

if (insertIdx !== -1 && deleteStart !== -1 && deleteEnd !== -1) {
    const fetchBlock = lines.slice(deleteStart, deleteEnd + 1);
    // Remove from old location
    lines.splice(deleteStart, deleteEnd - deleteStart + 1);
    
    // Insert before initialization
    lines.splice(insertIdx, 0, ...fetchBlock);
    
    // Now we need to modify the finding logic in initialization to use 'lista' instead of 'processosFabricaSIM' state
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const procMatch = processosFabricaSIM.find(p => p.key === secKey);')) {
            lines[i] = lines[i].replace('processosFabricaSIM.find', 'lista.find');
        }
    }
    
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Fixed OrdemServico.tsx fetch timing');
} else {
    console.log('Could not find block', {insertIdx, deleteStart, deleteEnd});
}
