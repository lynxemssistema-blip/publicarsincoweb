const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `                const [maxRows] = await dbPool.execute(
                    \`SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE (IdMaterial = ? OR codmatFabricante = ?)\`,
                    [itemIdMaterial || 0, itemCodMatFabricante || '']
                );`;

const newCode = `                let maxWhereClause, maxWhereArgs;
                if (itemIdMaterial > 0) {
                    maxWhereClause = 'IdMaterial = ?';
                    maxWhereArgs = [itemIdMaterial];
                } else {
                    maxWhereClause = 'codmatFabricante = ?';
                    maxWhereArgs = [itemCodMatFabricante || ''];
                }
                const [maxRows] = await dbPool.execute(
                    \`SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE \${maxWhereClause}\`,
                    maxWhereArgs
                );`;

if (content.includes('SELECT MAX(SequenciaExecucao) as maxSeq FROM material_processo WHERE (IdMaterial = ? OR codmatFabricante = ?)')) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed MAX query where clause');
} else {
    console.log('Could not find old max code');
}
