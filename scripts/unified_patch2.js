const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/\s*Atualizar SequenciaExecucao na tabela material_processo \(Engenharia\) se o recurso foi modificado[\s\S]*?(?=\/\/\s*Atualizar Tempos no ordemservicoitem)/;

const newCode = `// Atualizar SequenciaExecucao na tabela material_processo (Engenharia) se o recurso foi modificado
        if (itemIdMaterial || itemCodMatFabricante) {
            let currentMaxSeq = 0;
            try {
                const [maxRows] = await dbPool.execute(
                    \`SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE codmatFabricante = ?\`,
                    [itemCodMatFabricante || '']
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
                        );
                        if (resUpd.affectedRows === 0) {
                            await dbPool.execute(
                                \`INSERT INTO material_processo (IdMaterial, codmatFabricante, IdProcesso, SequenciaExecucao, TempoEstimadoMin, TempoPadraoMin, Ativo, UsuarioCriacao, DataCriacao, IdMatriz)
                                 VALUES (?, ?, ?, ?, ?, ?, 'A', ?, NOW(), ?)\`,
                                [itemIdMaterial || 0, itemCodMatFabricante || '', vals.IdProcesso, seqNum, tSetup, tPadrao, req.user?.NomeCompleto || req.user?.nome || 'Sistema', req.tenantUser?.tenantId || null]
                            );
                        }
                    } catch(e) {
                        console.warn(\`[Tempos] Erro ao atualizar material_processo para \${secKey}:\`, e.message);
                    }
                }
            }
        }

        `;

if (content.match(regex)) {
    content = content.replace(regex, newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced block successfully');
} else {
    console.log('Regex did not match');
}
