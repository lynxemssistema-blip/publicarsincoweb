const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `        // Atualizar SequenciaExecucao na tabela material_processo (Engenharia) se o recurso foi modificado
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

const newCode = `        // Atualizar SequenciaExecucao na tabela material_processo (Engenharia) se o recurso foi modificado
        if (itemIdMaterial || itemCodMatFabricante) {
            let currentMaxSeq = 0;
            try {
                const [maxRows] = await dbPool.execute(
                    \`SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE (IdMaterial = ? OR codmatFabricante = ?)\`,
                    [itemIdMaterial || 0, itemCodMatFabricante || '']
                );
                if (maxRows[0].maxSeq != null) {
                    currentMaxSeq = parseInt(maxRows[0].maxSeq, 10);
                }
                // Ajusta para múltiplo de 10 se não for
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
                            \`UPDATE material_processo SET SequenciaExecucao = ?, TempoEstimadoMin = ?, TempoPadraoMin = ? WHERE (IdMaterial = ? OR codmatFabricante = ?) AND IdProcesso = ?\`,
                            [seqNum, tSetup, tPadrao, itemIdMaterial || 0, itemCodMatFabricante || '', vals.IdProcesso]
                        );`;

if (content.includes('const seqNum = isNaN(seqParsed) ? 99 : seqParsed;')) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed sequence generation logic');
} else {
    console.log('FAIL: Could not find old code in server.js');
}
