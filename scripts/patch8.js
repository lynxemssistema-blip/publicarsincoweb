const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `    // Obter o IdProcesso do recurso
    const [processos] = await req.tenantDbPool.execute('SELECT IdProcesso, Descricao FROM processos WHERE REPLACE(LOWER(Descricao), \\' \\', \\'\\') = ? LIMIT 1', [recurso]);
    if (processos.length === 0) {
        return res.status(404).json({ success: false, message: 'Recurso não encontrado' });
    }
    const idProcesso = processos[0].IdProcesso;`;

const newCode = `    // Obter o IdProcesso do recurso
    const [processos] = await req.tenantDbPool.execute('SELECT IdProcessoFabricacao, processofabricacao FROM processofabricacao WHERE REPLACE(LOWER(processofabricacao), \\' \\', \\'\\') = ? LIMIT 1', [recurso]);
    if (processos.length === 0) {
        return res.status(404).json({ success: false, message: 'Recurso não encontrado' });
    }
    const idProcesso = processos[0].IdProcessoFabricacao;`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed DB table name');
} else {
    console.log('FAIL: Could not find old code in server.js');
}
