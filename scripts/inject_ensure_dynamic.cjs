const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/server.js');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `// GET /api/recursos - Listar todos os recursos`;

const funcCode = `
// Helper to lazily create columns for new generic resources
const ensureDynamicResourceColumns = async (pool, resourceName) => {
    if (!resourceName) return;
    const cleanResource = resourceName.trim().replace(/\\s+/g, '');
    if (!cleanResource) return;
    
    try {
        const [rows] = await pool.execute(\`SHOW COLUMNS FROM ordemservicoitem\`);
        const existingCols = rows.map(c => c.Field.toLowerCase());
        
        const columnsToAdd = [
            { name: \`txt\${cleanResource}\`, type: 'VARCHAR(255) NULL' },
            { name: \`\${cleanResource}TotalExecutado\`, type: 'VARCHAR(255) NULL' },
            { name: \`PlanejadoInicio\${cleanResource}\`, type: 'DATETIME NULL' },
            { name: \`PlanejadoFinal\${cleanResource}\`, type: 'DATETIME NULL' },
            { name: \`RealizadoInicio\${cleanResource}\`, type: 'DATETIME NULL' },
            { name: \`RealizadoFinal\${cleanResource}\`, type: 'DATETIME NULL' }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingCols.includes(col.name.toLowerCase())) {
                try {
                    await pool.execute(\`ALTER TABLE ordemservicoitem ADD COLUMN \\\`\${col.name}\\\` \${col.type}\`);
                    console.log(\`Column \${col.name} added to ordemservicoitem\`);
                } catch (err) {
                    console.error(\`Error adding \${col.name}:\`, err.message);
                }
            }
        }
        
        const [osCols] = await pool.execute(\`SHOW COLUMNS FROM ordemservico\`);
        const existingOsCols = osCols.map(c => c.Field.toLowerCase());
        
        const osColumnsToAdd = [
            { name: \`PlanejadoInicio\${cleanResource}\`, type: 'DATETIME NULL' },
            { name: \`PlanejadoFinal\${cleanResource}\`, type: 'DATETIME NULL' },
            { name: \`RealizadoInicio\${cleanResource}\`, type: 'DATETIME NULL' },
            { name: \`RealizadoFinal\${cleanResource}\`, type: 'DATETIME NULL' }
        ];
        
        for (const col of osColumnsToAdd) {
            if (!existingOsCols.includes(col.name.toLowerCase())) {
                try {
                    await pool.execute(\`ALTER TABLE ordemservico ADD COLUMN \\\`\${col.name}\\\` \${col.type}\`);
                    console.log(\`Column \${col.name} added to ordemservico\`);
                } catch (err) {
                    console.error(\`Error adding \${col.name} to ordemservico:\`, err.message);
                }
            }
        }

        // --- TAGS TABLE ---
        try {
            const [tagsCols] = await pool.execute(\`SHOW COLUMNS FROM tags\`);
            const existingTagsCols = tagsCols.map(c => c.Field.toLowerCase());
            
            const tagsColumnsToAdd = [
                { name: \`PlanejadoInicio\${cleanResource}\`, type: 'DATETIME NULL' },
                { name: \`PlanejadoFinal\${cleanResource}\`, type: 'DATETIME NULL' },
                { name: \`RealizadoInicio\${cleanResource}\`, type: 'DATETIME NULL' },
                { name: \`RealizadoFinal\${cleanResource}\`, type: 'DATETIME NULL' }
            ];
            
            for (const col of tagsColumnsToAdd) {
                if (!existingTagsCols.includes(col.name.toLowerCase())) {
                    try {
                        await pool.execute(\`ALTER TABLE tags ADD COLUMN \\\`\${col.name}\\\` \${col.type}\`);
                        console.log(\`Column \${col.name} added to tags\`);
                    } catch (err) {
                        console.error(\`Error adding \${col.name} to tags:\`, err.message);
                    }
                }
            }
        } catch (e) {
            console.error('ensureDynamicResourceColumns failed for tags:', e);
        }

    } catch (e) {
        console.error('ensureDynamicResourceColumns failed:', e);
    }
};

// Cache to track which resources have had their dynamic columns verified
const syncedTenantResources = new Map(); // Key: dbName_resourceName

`;

if (!content.includes('ensureDynamicResourceColumns')) {
    content = content.replace(targetStr, funcCode + targetStr);
    
    // Also inject into GET
    const getRes = `        // Auto-sync dynamic columns for all returned resources PLUS hardcoded legacy ones
        const hardcodedLegacy = ['CorteaLaser', 'PUNSIONADEIRA', 'GALVANIZAR', 'Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem', 'Engenharia', 'Isometrico', 'Medicao', 'Acabamento', 'Aprovacao'];
        const allResources = rows.map(r => r.processofabricacao).filter(Boolean);
        for (const legacy of hardcodedLegacy) {
            allResources.push(legacy);
        }

        const dbName = req.tenantDbPool?.pool?.config?.connectionConfig?.database || 'default';
        for (const rawResource of allResources) {
            if (!rawResource) continue;
            const resName = rawResource.trim().replace(/\\s+/g, '');
            if (!resName) continue;
            
            const cacheKey = \`\${dbName}_\${resName}\`;
            if (!syncedTenantResources.has(cacheKey)) {
                await ensureDynamicResourceColumns(req.tenantDbPool, rawResource);
                syncedTenantResources.set(cacheKey, true);
            }
        }
        
        res.json({ success: true, data: rows });`;
    
    content = content.replace('res.json({ success: true, data: rows });', getRes);
    
    // Also inject into POST
    const postRes = `        // Dynamically create columns for the new resource so queries like Visão Geral won't fail
        await ensureDynamicResourceColumns(req.tenantDbPool, processofabricacao);
        
        res.json({ success: true, message: 'Recurso criado com sucesso' });`;
        
    content = content.replace("res.json({ success: true, message: 'Recurso criado com sucesso' });", postRes);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('ensureDynamicResourceColumns injected.');
} else {
    console.log('already there');
}
