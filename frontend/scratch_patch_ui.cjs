const fs = require('fs');
let code = fs.readFileSync('src/pages/ApontamentoProducaoRecurso.tsx', 'utf8');

const func = `  // Retorna os recursos ativos ordenados por sequência
  const getRecursosAtivosTooltip = (item: any): string => {
    const res: {name: string, seq: number}[] = [];
    const check = (txtField: string, name: string, seqField: string) => {
        const val = String(item[txtField] || '').trim().toUpperCase();
        if (val === '1' || val === 'S') {
            res.push({ name, seq: parseInt(item[seqField]) || 999 });
        }
    };
    check('txtCorte', 'Corte', 'CorteSequencia');
    check('txtDobra', 'Dobra', 'DobraSequencia');
    check('txtSolda', 'Solda', 'SoldaSequencia');
    check('txtPintura', 'Pintura', 'PinturaSequencia');
    check('TxtMontagem', 'Montagem', 'MontagemSequencia');
    check('txtmontagem', 'Montagem', 'MontagemSequencia');
    check('txtCorteaLaser', 'Corte a Laser', 'CorteaLaserSequencia');
    check('txtPULSIONADEIRA', 'Pulsionadeira', 'PulsionadeiraSequencia');
    check('txtGALVANIZAR', 'Galvanizar', 'GalvanizarSequencia');
    check('txtENGENHARIA', 'Engenharia', 'EngenhariaSequencia');
    
    if (res.length === 0) return item.CodMatFabricante || '-';
    
    res.sort((a,b) => a.seq - b.seq);
    
    const lines = res.map(r => \`• \${r.name} (Seq: \${r.seq === 999 ? '-' : r.seq})\`);
    return \`CÓDIGO: \${item.CodMatFabricante || '-'}\\nRECURSOS ATIVOS:\\n\${lines.join('\\n')}\`;
  };\n\n`;

// Insert function around line 232 (before `const [showFilters...`)
if (!code.includes('getRecursosAtivosTooltip')) {
    code = code.replace('const [showFilters, setShowFilters]', func + ' const [showFilters, setShowFilters]');
}

// Replace title={item.CodMatFabricante}
code = code.replace(/title=\{item\.CodMatFabricante\}/g, 'title={getRecursosAtivosTooltip(item)}');

fs.writeFileSync('src/pages/ApontamentoProducaoRecurso.tsx', code);
console.log("Patched ApontamentoProducaoRecurso.tsx");
