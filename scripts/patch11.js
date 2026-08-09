const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `                    try {
                        const [resUpd] = await dbPool.execute(
                            \`UPDATE material_processo SET SequenciaExecucao = ?, TempoEstimadoMin = ?, TempoPadraoMin = ? WHERE (IdMaterial = ? OR codmatFabricante = ?) AND IdProcesso = ?\`,
                            [seqNum, tSetup, tPadrao, itemIdMaterial || 0, itemCodMatFabricante || '', vals.IdProcesso]
                        );`;

const newCode = `                    try {
                        let whereClause, whereArgs;
                        if (itemIdMaterial > 0) {
                            whereClause = 'IdMaterial = ? AND IdProcesso = ?';
                            whereArgs = [itemIdMaterial, vals.IdProcesso];
                        } else {
                            whereClause = 'codmatFabricante = ? AND IdProcesso = ?';
                            whereArgs = [itemCodMatFabricante || '', vals.IdProcesso];
                        }
                        const [resUpd] = await dbPool.execute(
                            \`UPDATE material_processo SET SequenciaExecucao = ?, TempoEstimadoMin = ?, TempoPadraoMin = ? WHERE \${whereClause}\`,
                            [seqNum, tSetup, tPadrao, ...whereArgs]
                        );`;

if (content.includes('UPDATE material_processo SET SequenciaExecucao = ?, TempoEstimadoMin = ?, TempoPadraoMin = ? WHERE (IdMaterial = ? OR codmatFabricante = ?) AND IdProcesso = ?')) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed UPDATE where clause');
} else {
    console.log('Could not find old code');
}
