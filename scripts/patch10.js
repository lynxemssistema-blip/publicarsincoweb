const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if (itemIdMaterial || itemCodMatFabricante) {')) {
        if (lines[i+1].includes('for (const [secKey, vals] of Object.entries(recursoTempos || {})) {')) {
            lines.splice(i+1, 3, 
'            let currentMaxSeq = 0;',
'            try {',
'                const [maxRows] = await dbPool.execute(',
'                    `SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE (IdMaterial = ? OR codmatFabricante = ?)`,',
'                    [itemIdMaterial || 0, itemCodMatFabricante || \'\']',
'                );',
'                if (maxRows[0].maxSeq != null) {',
'                    currentMaxSeq = parseInt(maxRows[0].maxSeq, 10);',
'                }',
'                if (currentMaxSeq % 10 !== 0 && currentMaxSeq < 99) {',
'                    currentMaxSeq = Math.ceil(currentMaxSeq / 10) * 10;',
'                }',
'            } catch (e) {',
'                console.warn(\'[Tempos] Erro ao buscar MAX SequenciaExecucao\', e.message);',
'            }',
'',
'            for (const [secKey, vals] of Object.entries(recursoTempos || {})) {',
'                if (vals.IdProcesso) {',
'                    const seqParsed = parseInt(vals.seq, 10);',
'                    let seqNum;',
'                    if (isNaN(seqParsed)) {',
'                        currentMaxSeq += 10;',
'                        seqNum = currentMaxSeq;',
'                    } else {',
'                        seqNum = seqParsed;',
'                        if (seqNum > currentMaxSeq) {',
'                            currentMaxSeq = seqNum;',
'                        }',
'                    }'
            );
            break;
        }
    }
}
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Replaced correctly');
