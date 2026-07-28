const fs = require('fs');

const serverFiles = [
  'src/server.js',
  'Publicacao/src/server.js',
  'PublicacaoSite/src/server.js',
  'SINCO_Deploy/src/server.js'
];

serverFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('/api/salvar-setores-planejamento')) {
    console.log(`Skipping ${filePath} (endpoint not present)`);
    return;
  }

  const oldEndpointRegex = /app\.post\('\/api\/salvar-setores-planejamento'[\s\S]*?\}\s*\);\s*\n/;

  const newEndpointImplementation = `app.post('/api/salvar-setores-planejamento', tenantMiddleware, async (req, res) => {
    const { targetType, targetId, sectors } = req.body;

    if (!targetType || !targetId || !Array.isArray(sectors)) {
        return res.status(400).json({ success: false, message: 'Parâmetros targetType, targetId e sectors são obrigatórios.' });
    }

    const queryPool = req.tenantDbPool || pool;
    const conn = await queryPool.getConnection();
    try {
        await conn.beginTransaction();

        const formatBr = (val) => {
            if (!val || val === '—') return null;
            const str = String(val).trim();
            if (str.includes('/')) return str;
            if (str.includes('-')) {
                const parts = str.split('T')[0].split('-');
                if (parts.length === 3) {
                    return \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
                }
            }
            return val;
        };

        const parseBrDate = (str) => {
            if (!str || str === '—') return null;
            const s = String(str).trim();
            if (s.includes('/')) {
                const p = s.split('/');
                if (p.length === 3) return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
            }
            if (s.includes('-')) {
                const p = s.split('T')[0].split('-');
                if (p.length === 3) return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
            }
            return null;
        };

        const updateFieldsForEntity = async (table, idCol, idValue) => {
            const updates = [];
            const params = [];

            for (const s of sectors) {
                let rawName = String(s.key || s.label || '').trim();
                let recName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                let diasName = recName;
                if (rawName.toLowerCase() === 'montagem') { recName = 'Montagem'; diasName = 'Montagem'; }
                else if (rawName.toLowerCase() === 'corte') { recName = 'Corte'; diasName = 'Corte'; }
                else if (rawName.toLowerCase() === 'dobra') { recName = 'Dobra'; diasName = 'Dobra'; }
                else if (rawName.toLowerCase() === 'solda') { recName = 'Solda'; diasName = 'Solda'; }
                else if (rawName.toLowerCase() === 'pintura') { recName = 'Pintura'; diasName = 'Pintura'; }
                else if (rawName.toLowerCase() === 'galvanizar') { recName = 'GALVANIZAR'; diasName = 'Galvanizar'; }
                else if (rawName.toLowerCase() === 'pulsionadeira') { recName = 'PULSIONADEIRA'; diasName = 'Pulsionadeira'; }
                else if (rawName.toLowerCase() === 'cortealaser' || rawName.toLowerCase() === 'laser') { recName = 'CorteaLaser'; diasName = 'CorteaLaser'; }

                const colPi = \`PlanejadoInicio\${recName}\`;
                const colPf = \`PlanejadoFinal\${recName}\`;
                const colDias = \`\${diasName}DiasProducao\`;

                const brPi = formatBr(s.pi);
                const brPf = formatBr(s.pf);
                const valDias = parseInt(String(s.dias), 10) || 1;

                updates.push(\`\\\`\${colPi}\\\` = ?\`);
                params.push(brPi);

                updates.push(\`\\\`\${colPf}\\\` = ?\`);
                params.push(brPf);

                updates.push(\`\\\`\${colDias}\\\` = ?\`);
                params.push(valDias);
            }

            if (updates.length > 0) {
                params.push(idValue);
                const sql = \`UPDATE \\\`\${table}\\\` SET \${updates.join(', ')} WHERE \\\`\${idCol}\\\` = ?\`;
                await conn.execute(sql, params).catch(err => {
                    console.warn(\`[Save Sector Warning] \${err.message}\`);
                });
            }
        };

        const updateParentHierarchy = async (osId, tagId, projetoId) => {
            const updateEntityRow = async (table, idCol, idVal) => {
                if (!idVal) return;
                const [rows] = await conn.execute(\`SELECT * FROM \\\`\${table}\\\` WHERE \\\`\${idCol}\\\` = ?\`, [idVal]).catch(() => [[]]);
                if (!rows || rows.length === 0) return;
                const parentRow = rows[0];

                const updates = [];
                const params = [];

                for (const s of sectors) {
                    let rawName = String(s.key || s.label || '').trim();
                    let recName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                    if (rawName.toLowerCase() === 'montagem') recName = 'Montagem';
                    else if (rawName.toLowerCase() === 'corte') recName = 'Corte';
                    else if (rawName.toLowerCase() === 'dobra') recName = 'Dobra';
                    else if (rawName.toLowerCase() === 'solda') recName = 'Solda';
                    else if (rawName.toLowerCase() === 'pintura') recName = 'Pintura';
                    else if (rawName.toLowerCase() === 'galvanizar') recName = 'GALVANIZAR';
                    else if (rawName.toLowerCase() === 'pulsionadeira') recName = 'PULSIONADEIRA';
                    else if (rawName.toLowerCase() === 'cortealaser' || rawName.toLowerCase() === 'laser') recName = 'CorteaLaser';

                    const colPi = \`PlanejadoInicio\${recName}\`;
                    const colPf = \`PlanejadoFinal\${recName}\`;

                    const itemPiBr = formatBr(s.pi);
                    const itemPfBr = formatBr(s.pf);

                    const itemPiDt = parseBrDate(itemPiBr);
                    const itemPfDt = parseBrDate(itemPfBr);

                    // Check Start Date: If item date is SMALLER (earlier) than parent date, update parent!
                    if (itemPiBr && itemPiDt) {
                        const parentPiBr = formatBr(parentRow[colPi]);
                        const parentPiDt = parseBrDate(parentPiBr);

                        if (!parentPiDt || itemPiDt < parentPiDt) {
                            updates.push(\`\\\`\${colPi}\\\` = ?\`);
                            params.push(itemPiBr);
                        }
                    }

                    // Check End Date: If item date is GREATER (later) than parent date, update parent!
                    if (itemPfBr && itemPfDt) {
                        const parentPfBr = formatBr(parentRow[colPf]);
                        const parentPfDt = parseBrDate(parentPfBr);

                        if (!parentPfDt || itemPfDt > parentPfDt) {
                            updates.push(\`\\\`\${colPf}\\\` = ?\`);
                            params.push(itemPfBr);
                        }
                    }
                }

                if (updates.length > 0) {
                    params.push(idVal);
                    const sql = \`UPDATE \\\`\${table}\\\` SET \${updates.join(', ')} WHERE \\\`\${idCol}\\\` = ?\`;
                    await conn.execute(sql, params).catch(err => {
                        console.warn(\`[Hierarchy Sector Rollup Warning] Table \${table}: \${err.message}\`);
                    });
                    console.log(\`[Hierarchy Sector Rollup] Updated \${table} (\${idCol}=\${idVal}) with \${updates.length} sector date fields.\`);
                }
            };

            if (osId) await updateEntityRow('ordemservico', 'IdOrdemServico', osId);
            if (tagId) await updateEntityRow('tags', 'IdTag', tagId);
            if (projetoId) await updateEntityRow('projetos', 'IdProjeto', projetoId);
        };

        if (targetType === 'os') {
            await updateFieldsForEntity('ordemservico', 'IdOrdemServico', targetId);
            await updateFieldsForEntity('ordemservicoitem', 'IdOrdemServico', targetId);

            const [osRows] = await conn.execute('SELECT IdTag, IdProjeto FROM ordemservico WHERE IdOrdemServico = ?', [targetId]).catch(() => [[]]);
            if (osRows && osRows[0]) {
                await updateParentHierarchy(null, osRows[0].IdTag, osRows[0].IdProjeto);
            }
        } else if (targetType === 'tag') {
            await updateFieldsForEntity('tags', 'IdTag', targetId);
            await updateFieldsForEntity('ordemservico', 'IdTag', targetId);
            await updateFieldsForEntity('ordemservicoitem', 'IdTag', targetId);

            const [tagRows] = await conn.execute('SELECT IdProjeto FROM tags WHERE IdTag = ?', [targetId]).catch(() => [[]]);
            if (tagRows && tagRows[0]) {
                await updateParentHierarchy(null, null, tagRows[0].IdProjeto);
            }
        } else if (targetType === 'item') {
            await updateFieldsForEntity('ordemservicoitem', 'IdOrdemServicoItem', targetId);

            const [itemRows] = await conn.execute('SELECT IdOrdemServico, IdTag, IdProjeto FROM ordemservicoitem WHERE IdOrdemServicoItem = ?', [targetId]).catch(() => [[]]);
            if (itemRows && itemRows[0]) {
                let osId = itemRows[0].IdOrdemServico;
                let tagId = itemRows[0].IdTag;
                let projetoId = itemRows[0].IdProjeto;

                if (osId && (!tagId || !projetoId)) {
                    const [osInfo] = await conn.execute('SELECT IdTag, IdProjeto FROM ordemservico WHERE IdOrdemServico = ?', [osId]).catch(() => [[]]);
                    if (osInfo && osInfo[0]) {
                        if (!tagId) tagId = osInfo[0].IdTag;
                        if (!projetoId) projetoId = osInfo[0].IdProjeto;
                    }
                }

                if (tagId && !projetoId) {
                    const [tagInfo] = await conn.execute('SELECT IdProjeto FROM tags WHERE IdTag = ?', [tagId]).catch(() => [[]]);
                    if (tagInfo && tagInfo[0]) {
                        projetoId = tagInfo[0].IdProjeto;
                    }
                }

                await updateParentHierarchy(osId, tagId, projetoId);
            }
        }

        await conn.commit();
        console.log(\`[Planejamento Setores] Salvo com sucesso para \${targetType} ID=\${targetId} com \${sectors.length} setores e propagado na hierarquia\`);
        res.json({ success: true, message: 'Planejamento dos setores salvo com sucesso e propagado na hierarquia.' });
    } catch (error) {
        await conn.rollback();
        console.error('[Planejamento Setores] Erro ao salvar:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar planejamento dos setores: ' + error.message });
    } finally {
        conn.release();
    }
});`;

  content = content.replace(oldEndpointRegex, `${newEndpointImplementation}\n\n`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Patched ${filePath} with hierarchical sector date rollup logic`);
});
