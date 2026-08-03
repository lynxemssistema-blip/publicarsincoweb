const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/server.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. POST recursos
const postTarget = `    try {
        const query = "INSERT INTO processofabricacao (processofabricacao, CodigoProcessoFabricacao, Fabrica, DataLiberada, Setup, TempoPadrao, CriadoPor, DataCriacao, IdMatriz) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const params = [processofabricacao, CodigoProcessoFabricacao || '', Fabrica || 'NAO', DataLiberada || 'NAO', Setup || null, TempoPadrao || null, usuario, nowFormat, idMatriz];`;

const postRepl = `    try {
        const query = "INSERT INTO processofabricacao (processofabricacao, CodigoProcessoFabricacao, Fabrica, DataLiberada, CriadoPor, DataCriacao, IdMatriz) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const params = [processofabricacao, CodigoProcessoFabricacao || '', Fabrica || 'NAO', DataLiberada || 'NAO', usuario, nowFormat, idMatriz];`;
        
content = content.replace(postTarget, postRepl);

// 2. PUT recursos validation removal
const putTarget = `        // --- NEW VALIDATION ---
        const [oldRows] = await req.tenantDbPool.execute('SELECT processofabricacao, Fabrica FROM processofabricacao WHERE IdProcessoFabricacao = ?', [id]);
        if (oldRows.length > 0) {
            const oldProc = oldRows[0];
            const oldFabrica = oldProc.Fabrica || 'NAO';
            const newFabrica = Fabrica || 'NAO';
            
            if (oldFabrica !== newFabrica) {
                const procNameFormatado = (oldProc.processofabricacao || '').trim().replace(/\\s+/g, '');
                if (procNameFormatado) {
                    const colName = \`txt\${procNameFormatado}\`;
                    const [cols] = await req.tenantDbPool.execute(\`SHOW COLUMNS FROM ordemservicoitem LIKE ?\`, [colName]);
                    if (cols.length > 0) {
                        const [usage] = await req.tenantDbPool.execute(\`SELECT 1 FROM ordemservicoitem WHERE \\\`\${colName}\\\` = '1' LIMIT 1\`);
                        if (usage.length > 0) {
                            return res.status(400).json({ success: false, message: 'Não ? possível alterar o campo Fabrica porque este processo já está montado em um item de Ordem de Serviço.' });
                        }
                    }
                }
            }
        }
        // --- END VALIDATION ---

        const query = "UPDATE processofabricacao SET processofabricacao = ?, CodigoProcessoFabricacao = ?, Fabrica = ?, DataLiberada = ?, Setup = ?, TempoPadrao = ? WHERE IdProcessoFabricacao = ?";
        const params = [processofabricacao, CodigoProcessoFabricacao || '', Fabrica || 'NAO', DataLiberada || 'NAO', Setup || null, TempoPadrao || null, id];`;

const putRepl = `        // --- REMOVED VALIDATION ---
        // We now allow changing Fabrica and DataLiberada status even if the resource is already in use.
        // This is necessary because companies need to be able to activate existing resources (like Montagem)
        // for factory production tracking without being blocked by legacy data.

        const query = "UPDATE processofabricacao SET processofabricacao = ?, CodigoProcessoFabricacao = ?, Fabrica = ?, DataLiberada = ? WHERE IdProcessoFabricacao = ?";
        const params = [processofabricacao, CodigoProcessoFabricacao || '', Fabrica || 'NAO', DataLiberada || 'NAO', id];`;
        
content = content.replace(putTarget, putRepl);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Recursos fixed!');
