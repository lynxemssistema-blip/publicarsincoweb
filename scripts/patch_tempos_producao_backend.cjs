const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

// First, let's see if the old endpoint is there and remove it.
const regex = /app\.get\('\/api\/ordemservico\/:idTag\/tempos-producao'[\s\S]*?\}\);/g;
if (regex.test(content)) {
    content = content.replace(regex, '');
}

// Ensure we don't duplicate
const newEndpoint = `
// GET /api/ordemservico/:idTag/tempos-producao
app.get('/api/ordemservico/:idTag/tempos-producao', tenantMiddleware, async (req, res) => {
    try {
        const { idTag } = req.params;
        const { recurso } = req.query;
        if (!idTag || !recurso) {
            return res.status(400).json({ success: false, message: 'Faltam dados: idTag ou recurso' });
        }
        const recursoLimpo = recurso.trim().replace(/\\s+/g, '');
        const colSetup = \`\${recursoLimpo}TempoSetup\`;
        const colPadrao = \`\${recursoLimpo}TempoPadrao\`;
        const colTotal = \`\${recursoLimpo}TotalTempo\`;
        
        try {
            const query = 'SELECT ?? AS Setup, ?? AS Padrao, ?? AS Total FROM tags WHERE IdTag = ? LIMIT 1';
            const [rows] = await req.tenantDbPool.query(query, [colSetup, colPadrao, colTotal, idTag]);
            if (rows.length > 0) {
                return res.json({ success: true, data: rows[0] });
            }
        } catch (colErr) {
            console.log(\`Colunas de tempo não encontradas para o recurso \${recursoLimpo}\`);
        }
        return res.json({ success: true, data: { Setup: 0, Padrao: 0, Total: 0 } });
    } catch (error) {
        console.error('Erro ao buscar tempos de producao:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao buscar tempos' });
    }
});
`;

const anchor = 'module.exports = app;';
if (!content.includes('/api/ordemservico/:idTag/tempos-producao')) {
    content = content.replace(anchor, newEndpoint + '\\n' + anchor);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Backend patched with tags query!');
} else {
    console.log('Already exists');
}
