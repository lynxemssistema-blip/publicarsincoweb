const fs = require('fs');

const endpointCode = `
// ----------------------------------------------------------------------------
// SALVAR PLANEJAMENTO DE SETORES DA OS / TAG / ITEM (TENANT-AWARE & CAMELCASE)
// ----------------------------------------------------------------------------
app.post('/api/salvar-setores-planejamento', async (req, res) => {
    let connection = null;
    try {
        const tenantPool = req.tenantDbPool || pool;
        connection = await tenantPool.getConnection();

        const { targetType, targetId, sectors } = req.body;
        if (!targetType || !targetId || !Array.isArray(sectors)) {
            return res.status(400).json({ success: false, message: 'Parâmetros inválidos para salvar planejamento dos setores.' });
        }

        const dateToBr = (str) => {
            if (!str || str === '—') return null;
            const s = String(str).trim();
            if (s.includes('/')) {
                const parts = s.split('/');
                if (parts.length === 3) return s;
            }
            if (s.includes('-')) {
                const parts = s.split('T')[0].split('-');
                if (parts.length === 3) return \`\${parts[2].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[0]}\`;
            }
            return s;
        };

        const updateFields = [];
        const queryParams = [];

        sectors.forEach(s => {
            let rawName = String(s.key || s.label || '').trim();
            let recName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            let diasName = recName;
            
            if (rawName.toLowerCase() === 'montagem') { recName = 'Montagem'; diasName = 'Montagem'; }
            else if (rawName.toLowerCase() === 'corte') { recName = 'Corte'; diasName = 'Corte'; }
            else if (rawName.toLowerCase() === 'dobra') { recName = 'Dobra'; diasName = 'Dobra'; }
            else if (rawName.toLowerCase() === 'solda') { recName = 'Solda'; diasName = 'Solda'; }
            else if (rawName.toLowerCase() === 'pintura') { recName = 'Pintura'; diasName = 'Pintura'; }
            else if (rawName.toLowerCase() === 'galvanizar') { recName = 'Galvanizar'; diasName = 'Galvanizar'; }
            else if (rawName.toLowerCase() === 'pulsionadeira') { recName = 'Pulsionadeira'; diasName = 'Pulsionadeira'; }
            else if (rawName.toLowerCase() === 'cortealaser' || rawName.toLowerCase() === 'laser') { recName = 'CorteaLaser'; diasName = 'CorteaLaser'; }

            const piBr = dateToBr(s.pi);
            const pfBr = dateToBr(s.pf);
            const diasVal = parseInt(String(s.dias), 10) || 1;

            updateFields.push(\`\\\`PlanejadoInicio\${recName}\\\` = ?\`);
            queryParams.push(piBr);

            updateFields.push(\`\\\`PlanejadoFinal\${recName}\\\` = ?\`);
            queryParams.push(pfBr);

            updateFields.push(\`\\\`\${diasName}DiasProducao\\\` = ?\`);
            queryParams.push(diasVal);
        });

        if (updateFields.length === 0) {
            return res.json({ success: true, message: 'Nenhum setor alterado.' });
        }

        if (targetType === 'os') {
            const sqlOS = \`UPDATE ordemservico SET \${updateFields.join(', ')} WHERE IdOrdemServico = ?\`;
            await connection.execute(sqlOS, [...queryParams, targetId]);

            const sqlItems = \`UPDATE ordemservicoitem SET \${updateFields.join(', ')} WHERE IdOrdemServico = ?\`;
            await connection.execute(sqlItems, [...queryParams, targetId]).catch(() => {});
        } else if (targetType === 'tag') {
            const sqlTag = \`UPDATE tags SET \${updateFields.join(', ')} WHERE IdTag = ?\`;
            await connection.execute(sqlTag, [...queryParams, targetId]);

            const sqlOS = \`UPDATE ordemservico SET \${updateFields.join(', ')} WHERE IdTag = ?\`;
            await connection.execute(sqlOS, [...queryParams, targetId]).catch(() => {});

            const sqlItems = \`UPDATE ordemservicoitem SET \${updateFields.join(', ')} WHERE IdTag = ?\`;
            await connection.execute(sqlItems, [...queryParams, targetId]).catch(() => {});
        } else if (targetType === 'item') {
            const sqlItem = \`UPDATE ordemservicoitem SET \${updateFields.join(', ')} WHERE IdOrdemServicoItem = ?\`;
            await connection.execute(sqlItem, [...queryParams, targetId]);
        }

        res.json({ success: true, message: 'Planejamento dos setores salvo com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar setores de planejamento:', err);
        res.status(500).json({ success: false, message: 'Erro interno ao salvar planejamento: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});
`;

const files = [
    './src/server.js',
    './Publicacao/src/server.js',
    './PublicacaoSite/src/server.js',
    './SINCO_Deploy/src/server.js'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('/api/salvar-setores-planejamento')) {
        const insertPoint = content.indexOf("app.get('/api/health'");
        if (insertPoint !== -1) {
            content = content.slice(0, insertPoint) + endpointCode + '\n\n' + content.slice(insertPoint);
        } else {
            content += '\n\n' + endpointCode;
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ Added /api/salvar-setores-planejamento endpoint to ${file}`);
    } else {
        console.log(`ℹ️ Endpoint already present in ${file}`);
    }
}

console.log('🎉 Multi-tenant API endpoint added!');
