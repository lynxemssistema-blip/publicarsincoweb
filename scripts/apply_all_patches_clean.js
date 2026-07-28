const fs = require('fs');

const file = './src/server.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Helper atualizarMinProdCascata
const minProdHelper = `
/**
 * Atualiza o campo [recurso]MinProd em forma de cascata nos 4 níveis hierárquicos:
 * ordemservicoitem -> ordemservico -> tags -> projetos
 */
async function atualizarMinProdCascata(conn, idItem, processoKey, inputQty, operacao = 'ADD') {
    try {
        if (!idItem || !processoKey || !inputQty || inputQty <= 0) return;

        let rawName = String(processoKey).trim();
        let recName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        if (rawName.toLowerCase() === 'montagem') recName = 'Montagem';
        else if (rawName.toLowerCase() === 'corte') recName = 'Corte';
        else if (rawName.toLowerCase() === 'dobra') recName = 'Dobra';
        else if (rawName.toLowerCase() === 'solda') recName = 'Solda';
        else if (rawName.toLowerCase() === 'pintura') recName = 'Pintura';
        else if (rawName.toLowerCase() === 'galvanizar') recName = 'GALVANIZAR';
        else if (rawName.toLowerCase() === 'pulsionadeira') recName = 'PULSIONADEIRA';
        else if (rawName.toLowerCase() === 'cortealaser') recName = 'CorteaLaser';

        const minProdCol = \`\${recName}MinProd\`;
        const txtCol1 = \`txt\${recName}\`;
        const txtCol2 = \`txt\${rawName}\`;

        const [itemRows] = await conn.execute(
            \`SELECT osi.*, os.IdOrdemServico, os.IdTag, os.Tag, os.IdProjeto, os.Projeto
             FROM ordemservicoitem osi
             INNER JOIN ordemservico os ON osi.IdOrdemServico = os.IdOrdemServico
             WHERE osi.IdOrdemServicoItem = ?\`,
            [idItem]
        );
        if (!itemRows || itemRows.length === 0) return;
        const item = itemRows[0];

        const tempoPadrao = parseFloat(item[txtCol1] || item[txtCol2] || item[\`txt\${recName.toUpperCase()}\`]) || 0;
        const totalprod = Math.round(tempoPadrao * inputQty);

        if (totalprod <= 0) return;

        const valModifier = operacao === 'SUB' ? \`- \${totalprod}\` : \`+ \${totalprod}\`;

        const queryItem = \`UPDATE ordemservicoitem SET \\\`\${minProdCol}\\\` = GREATEST(0, COALESCE(\\\`\${minProdCol}\\\`, 0) \${valModifier}) WHERE IdOrdemServicoItem = ?\`;
        const queryOS   = \`UPDATE ordemservico SET \\\`\${minProdCol}\\\` = GREATEST(0, COALESCE(\\\`\${minProdCol}\\\`, 0) \${valModifier}) WHERE IdOrdemServico = ?\`;

        await conn.execute(queryItem, [idItem]).catch(e => console.warn(\`[MinProd Warning Item] \${e.message}\`));

        if (item.IdOrdemServico) {
            await conn.execute(queryOS, [item.IdOrdemServico]).catch(e => console.warn(\`[MinProd Warning OS] \${e.message}\`));
        }

        if (item.IdTag) {
            await conn.execute(\`UPDATE tags SET \\\`\${minProdCol}\\\` = GREATEST(0, COALESCE(\\\`\${minProdCol}\\\`, 0) \${valModifier}) WHERE IdTag = ?\`, [item.IdTag]).catch(e => console.warn(\`[MinProd Warning Tag] \${e.message}\`));
        } else if (item.Tag) {
            await conn.execute(\`UPDATE tags SET \\\`\${minProdCol}\\\` = GREATEST(0, COALESCE(\\\`\${minProdCol}\\\`, 0) \${valModifier}) WHERE Tag = ?\`, [item.Tag]).catch(e => console.warn(\`[MinProd Warning Tag] \${e.message}\`));
        }

        if (item.IdProjeto) {
            await conn.execute(\`UPDATE projetos SET \\\`\${minProdCol}\\\` = GREATEST(0, COALESCE(\\\`\${minProdCol}\\\`, 0) \${valModifier}) WHERE IdProjeto = ?\`, [item.IdProjeto]).catch(e => console.warn(\`[MinProd Warning Proj] \${e.message}\`));
        } else if (item.Projeto) {
            await conn.execute(\`UPDATE projetos SET \\\`\${minProdCol}\\\` = GREATEST(0, COALESCE(\\\`\${minProdCol}\\\`, 0) \${valModifier}) WHERE Projeto = ?\`, [item.Projeto]).catch(e => console.warn(\`[MinProd Warning Proj] \${e.message}\`));
        }

        console.log(\`[MinProd Cascata] \${operacao} | \${minProdCol} | Item=\${idItem} | totalprod=\${totalprod} (tempoPadrao=\${tempoPadrao} * qtde=\${inputQty})\`);
    } catch (err) {
        console.error('[MinProd Cascata Erro]', err.message);
    }
}
`;

if (!content.includes('async function atualizarMinProdCascata')) {
    content = content.replace('async function resolveSetorConfig', minProdHelper + '\nasync function resolveSetorConfig');
    console.log('✅ Added atualizarMinProdCascata');
}

// 2. Admin Login Block
const loginHeaderTarget = `app.post('/api/login', loginLimiter, async (req, res) => {\n    const { login, senha, password, banco } = req.body;`;
const loginHeaderReplacement = `app.post('/api/login', loginLimiter, async (req, res) => {
    const { login, senha, password, banco } = req.body;
    const pwd = senha || password;

    // BLOQUEIO GERAL: Rejeitar qualquer login com o usuário 'admin'
    if (login && String(login).trim().toLowerCase() === 'admin') {
        console.warn(\`[AUTH_BLOCKED] Tentativa de login bloqueada para o usuário 'admin' a partir do IP: \${req.ip}\`);
        return res.status(403).json({ success: false, message: "Acesso não permitido para o usuário 'admin'. Utilize suas credenciais corporativas pessoais." });
    }`;

if (!content.includes('[AUTH_BLOCKED] Tentativa de login bloqueada para o usuário \'admin\'')) {
    content = content.replace(loginHeaderTarget, loginHeaderReplacement);
    console.log('✅ Added admin login block');
}

// 3. Planning endpoint
const planningEndpoint = `
// POST: Salvar planejamento e datas dos setores/recursos para OS, Tag ou Item
app.post('/api/salvar-setores-planejamento', async (req, res) => {
    const { targetType, targetId, sectors } = req.body;

    if (!targetType || !targetId || !Array.isArray(sectors)) {
        return res.status(400).json({ success: false, message: 'Parâmetros targetType, targetId e sectors são obrigatórios.' });
    }

    const queryPool = req.tenantDbPool || pool;
    const conn = await queryPool.getConnection();
    try {
        await conn.beginTransaction();

        let table = 'ordemservico';
        let idCol = 'IdOrdemServico';
        if (targetType === 'tag') {
            table = 'tags';
            idCol = 'IdTag';
        } else if (targetType === 'item') {
            table = 'ordemservicoitem';
            idCol = 'IdOrdemServicoItem';
        }

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
            else if (rawName.toLowerCase() === 'cortealaser') recName = 'CorteaLaser';

            const colPi = \`PlanejadoInicio\${recName}\`;
            const colPf = \`PlanejadoFinal\${recName}\`;

            if (s.pi !== undefined) {
                updates.push(\`\\\`\${colPi}\\\` = ?\`);
                params.push(s.pi || null);
            }
            if (s.pf !== undefined) {
                updates.push(\`\\\`\${colPf}\\\` = ?\`);
                params.push(s.pf || null);
            }
        }

        if (updates.length > 0) {
            params.push(targetId);
            const sql = \`UPDATE \\\`\${table}\\\` SET \${updates.join(', ')} WHERE \\\`\${idCol}\\\` = ?\`;
            await conn.execute(sql, params);
        }

        await conn.commit();
        console.log(\`[Planejamento Setores] Salvo para \${targetType} ID=\${targetId} com \${sectors.length} setores.\`);
        res.json({ success: true, message: 'Planejamento de setores salvo com sucesso.' });
    } catch (err) {
        await conn.rollback();
        console.error('[Planejamento Setores Error]', err);
        res.status(500).json({ success: false, message: 'Erro ao salvar planejamento de setores: ' + err.message });
    } finally {
        conn.release();
    }
});
`;

if (!content.includes("app.post('/api/salvar-setores-planejamento'")) {
    const targetIdx = content.indexOf("app.post('/api/apontamento-parcial'");
    if (targetIdx !== -1) {
        content = content.slice(0, targetIdx) + planningEndpoint + '\n\n' + content.slice(targetIdx);
        console.log('✅ Added planning endpoint');
    }
}

// 4. Hook MinProd in pointing calls
const oldParcialCascata = `// 8. Recalcular totais em cascata (OS -> Tag -> Projeto)\n        await recalcularQuantidadesTotais(idOS, conn);`;
const newParcialCascata = `// 8. Recalcular totais em cascata (OS -> Tag -> Projeto)\n        await recalcularQuantidadesTotais(idOS, conn);\n        await atualizarMinProdCascata(conn, IdOrdemServicoItem, processoKey, inputQty, 'ADD');`;

if (content.includes(oldParcialCascata) && !content.includes('atualizarMinProdCascata(conn, IdOrdemServicoItem, processoKey')) {
    content = content.replace(oldParcialCascata, newParcialCascata);
    console.log('✅ Added MinProd in apontamento-parcial');
}

const oldApontamentoCascata = `// 6. Cascading Totals e Percentuais Dinâmicos (HIERARQUIA: Item -> OS -> Tag -> Projeto)\n            // Utilizando o helper centralizado garantimos que QtdePecasExecutadas e Setores também recalculem em tempo real\n            await recalcularQuantidadesTotais(item.IdOrdemServico, conn);`;
const newApontamentoCascata = `// 6. Cascading Totals e Percentuais Dinâmicos (HIERARQUIA: Item -> OS -> Tag -> Projeto)\n            // Utilizando o helper centralizado garantimos que QtdePecasExecutadas e Setores também recalculem em tempo real\n            await recalcularQuantidadesTotais(item.IdOrdemServico, conn);\n            await atualizarMinProdCascata(conn, IdOrdemServicoItem, sName, currentInputQty, 'ADD');`;

if (content.includes(oldApontamentoCascata) && !content.includes('atualizarMinProdCascata(conn, IdOrdemServicoItem, sName')) {
    content = content.replace(oldApontamentoCascata, newApontamentoCascata);
    console.log('✅ Added MinProd in apontamento');
}

fs.writeFileSync(file, content, 'utf8');
console.log('🎉 Clean patch applied successfully!');
