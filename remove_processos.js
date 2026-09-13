const fs = require('fs');

const files = [
    'frontend/src/pages/ApontamentoProducao.tsx',
    'frontend/src/pages/ApontamentoProducaoRecurso.tsx',
    'frontend/src/pages/OrdemServico.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /\{\/\* Processos \*\/\}[\s\S]*?<\/div>[\s\S]*?\{\/\* Se[^\*]*\*\/\}/i;
    
    // Test if we can find the block
    const match = content.match(regex);
    if (match) {
        // Find the specific div related to processos
        // To be safe, we just replace everything from {/* Processos */} up to the closing div of that section.
        // It's followed by "Seção Finalização" or "Seção de Finalização"
        content = content.replace(regex, (match) => {
            // keep the 'Seção' comment part
            const secMatch = match.match(/\{\/\* Se[^\*]*\*\/\}/i);
            return secMatch ? secMatch[0] : match;
        });
        fs.writeFileSync(file, content, 'utf8');
        console.log('Removed from ' + file);
    } else {
        console.log('Not found in ' + file);
    }
});
