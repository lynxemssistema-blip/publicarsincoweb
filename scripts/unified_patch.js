const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

// The block to replace:
const oldBlock = `        // Atualizar SequenciaExecucao na tabela material_processo (Engenharia) se o recurso foi modificado
        if (itemIdMaterial || itemCodMatFabricante) {
            for (const [secKey, vals] of Object.entries(recursoTempos || {})) {
                if (vals.IdProcesso) {
                    const seqParsed = parseInt(vals.seq, 10);
                    const seqNum = isNaN(seqParsed) ? 99 : seqParsed;
                    const tSetup = vals.setup != null && vals.setup !== '' ? parseFloat(vals.setup) : null;
                    const tPadrao = vals.padrao != null && vals.padrao !== '' ? parseFloat(vals.padrao) : null;
                    
                    try {
                        const [resUpd] = await dbPool.execute(
                            \`UPDATE material_processo SET SequenciaExecucao = ?, TempoEstimadoMin = ?, TempoPadraoMin = ? WHERE (IdMaterial = ? OR codmatFabricante = ?) AND IdProcesso = ?\`,
                            [seqNum, tSetup, tPadrao, itemIdMaterial || 0, itemCodMatFabricante || '', vals.IdProcesso]
                        );`;

const newBlock = `        // Atualizar SequenciaExecucao na tabela material_processo (Engenharia) se o recurso foi modificado
        if (itemIdMaterial || itemCodMatFabricante) {
            let currentMaxSeq = 0;
            try {
                let maxWhereClause = 'codmatFabricante = ?';
                let maxWhereArgs = [itemCodMatFabricante || ''];
                const [maxRows] = await dbPool.execute(
                    \`SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE \${maxWhereClause}\`,
                    maxWhereArgs
                );
                if (maxRows[0].maxSeq != null) {
                    currentMaxSeq = parseInt(maxRows[0].maxSeq, 10);
                }
                if (currentMaxSeq % 10 !== 0 && currentMaxSeq < 99) {
                    currentMaxSeq = Math.ceil(currentMaxSeq / 10) * 10;
                }
            } catch (e) {
                console.warn('[Tempos] Erro ao buscar MAX SequenciaExecucao', e.message);
            }

            for (const [secKey, vals] of Object.entries(recursoTempos || {})) {
                if (vals.IdProcesso) {
                    const seqParsed = parseInt(vals.seq, 10);
                    let seqNum;
                    if (isNaN(seqParsed)) {
                        currentMaxSeq += 10;
                        seqNum = currentMaxSeq;
                    } else {
                        seqNum = seqParsed;
                        if (seqNum > currentMaxSeq) {
                            currentMaxSeq = seqNum;
                        }
                    }
                    const tSetup = vals.setup != null && vals.setup !== '' ? parseFloat(vals.setup) : null;
                    const tPadrao = vals.padrao != null && vals.padrao !== '' ? parseFloat(vals.padrao) : null;
                    
                    try {
                        const [resUpd] = await dbPool.execute(
                            \`UPDATE material_processo SET SequenciaExecucao = ?, TempoEstimadoMin = ?, TempoPadraoMin = ? WHERE codmatFabricante = ? AND IdProcesso = ?\`,
                            [seqNum, tSetup, tPadrao, itemCodMatFabricante || '', vals.IdProcesso]
                        );`;

const lines = content.split('\\n');
let replaced = false;

// We do a manual line by line match because whitespace matching is hell
const targetLine1 = '        // Atualizar SequenciaExecucao na tabela material_processo (Engenharia) se o recurso foi modificado';
const targetLineLast = '                        );';

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(targetLine1)) {
        if (lines[i+1].includes('if (itemIdMaterial || itemCodMatFabricante) {')) {
            if (lines[i+13].includes('UPDATE material_processo')) {
                lines.splice(i, 14, ...newBlock.split('\\n'));
                replaced = true;
                break;
            }
        }
    }
}

if (replaced) {
    fs.writeFileSync(file, lines.join('\\n'), 'utf8');
    console.log('Successfully patched server.js!');
} else {
    console.log('Failed to find block in server.js');
}
