const fs = require('fs');
const file = 'frontend/src/pages/OrdemServico.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

let fetchStart = lines.findIndex(l => l.includes('Buscar processos com Fabrica = '));
let fetchEnd = -1;
for (let i = fetchStart; i < lines.length; i++) {
    if (lines[i].includes('setProcessosFabricaSIM(lista as any);')) {
        fetchEnd = i + 3; // } catch ... }
        break;
    }
}

let initStart = lines.findIndex(l => l.includes('// Inicializar tempos por recurso para setores ativos'));

if (fetchStart !== -1 && fetchEnd !== -1 && initStart !== -1) {
    const fetchBlock = lines.slice(fetchStart, fetchEnd + 1);
    
    fetchBlock.unshift('        let processosLista: { key: string; label: string; IdProcesso: number }[] = [];');
    for (let i = 0; i < fetchBlock.length; i++) {
        if (fetchBlock[i].includes('const lista: { key: string; label: string; IdProcesso: number }[] = [];')) {
            fetchBlock[i] = '                const lista: { key: string; label: string; IdProcesso: number }[] = [];';
        }
        if (fetchBlock[i].includes('setProcessosFabricaSIM(lista as any);')) {
            fetchBlock.splice(i + 1, 0, '                processosLista = lista;');
            break;
        }
    }

    lines.splice(fetchStart, fetchEnd - fetchStart + 1);
    
    // The index of initStart has shifted if fetchBlock was before it, but actually fetchBlock is AFTER initStart currently!
    // So initStart is unaffected.
    lines.splice(initStart, 0, ...fetchBlock);
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const procMatch = processosFabricaSIM.find(p => p.key === secKey);')) {
            lines[i] = lines[i].replace('processosFabricaSIM.find', 'processosLista.find');
        }
    }
    
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Moved fetch logic successfully');
} else {
    console.log('Indices not found:', {fetchStart, fetchEnd, initStart});
}
