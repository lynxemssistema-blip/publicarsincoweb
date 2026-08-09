const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'server.js');
let content = fs.readFileSync(file, 'utf8');

const getRoute = `

// [ROTA 2] GET: Buscar apontamentos via material_processo
app.get('/api/material-processo/apontamentos/:recurso', tenantMiddleware, async (req, res) => {
    const recurso = req.params.recurso.toLowerCase();
    
    // Obter o IdProcesso do recurso
    const [processos] = await req.tenantDbPool.execute('SELECT IdProcesso, Descricao FROM processos WHERE REPLACE(LOWER(Descricao), \\' \\', \\'\\') = ? LIMIT 1', [recurso]);
    if (processos.length === 0) {
        return res.status(404).json({ success: false, message: 'Recurso não encontrado' });
    }
    const idProcesso = processos[0].IdProcesso;

    const { projeto, tag, os, item, search, status, codMatFabricante, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offsetNum = (pageNum - 1) * limitNum;

    try {
        let whereClause = \`mp.IdProcesso = ? 
            AND (osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = '' OR osi.D_E_L_E_T_E != '*')
            AND osi.Liberado_engenharia = 'S'
            AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E != '*')\`;
        const params = [idProcesso];

        if (projeto) {
            whereClause += ' AND (os.Projeto LIKE ?)';
            params.push(\`%\${projeto}%\`);
        }

        if (item) {
            whereClause += ' AND osi.IdOrdemServicoItem = ?';
            params.push(item);
        }

        if (status === 'pendente') {
            whereClause += ' AND (mp.TotalExecutado IS NULL OR mp.TotalExecutado < mp.TotalExecutar OR mp.RealizadoFinal IS NULL)';
        } else if (status === 'concluido') {
            whereClause += ' AND mp.TotalExecutado >= mp.TotalExecutar AND mp.RealizadoFinal IS NOT NULL';
        }

        if (tag) {
            whereClause += ' AND (os.Tag LIKE ?)';
            params.push(\`%\${tag}%\`);
        }

        if (os) {
            whereClause += ' AND os.IdOrdemServico = ?';
            params.push(os);
        }
        
        if (codMatFabricante) {
            whereClause += ' AND mp.codmatFabricante LIKE ?';
            params.push(\`%\${codMatFabricante}%\`);
        }

        const countQuery = \`
            SELECT COUNT(*) as total 
            FROM material_processo mp
            JOIN ordemservicoitem osi ON osi.IdOrdemServico = mp.IdOrdemServico AND osi.codmatFabricante = mp.codmatFabricante
            JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
            WHERE \${whereClause}
        \`;
        
        const [countResult] = await req.tenantDbPool.execute(countQuery, params);
        const total = countResult[0].total;

        const dataQuery = \`
            SELECT 
                mp.IdMaterialProcesso,
                mp.IdProcesso,
                mp.codmatFabricante AS CodMatFabricante,
                COALESCE(mp.TotalExecutado, 0) AS QtdeProduzidaSetor,
                COALESCE(mp.TotalExecutar, osi.QtdeTotal) AS TotalExecutar,
                mp.RealizadoInicio,
                mp.RealizadoFinal,
                osi.IdOrdemServicoItem,
                osi.IdOrdemServico,
                osi.DescResumo,
                osi.DescDetal,
                osi.QtdeTotal,
                osi.IdPlanodecorte AS PlanoCorte,
                osi.Espessura,
                os.Projeto,
                os.Tag,
                os.NomeCliente AS Cliente
            FROM material_processo mp
            JOIN ordemservicoitem osi ON osi.IdOrdemServico = mp.IdOrdemServico AND osi.codmatFabricante = mp.codmatFabricante
            JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
            WHERE \${whereClause}
            ORDER BY osi.IdOrdemServico DESC, osi.IdOrdemServicoItem ASC
            LIMIT ? OFFSET ?
        \`;

        params.push(limitNum, offsetNum);
        const [rows] = await req.tenantDbPool.execute(dataQuery, params);

        res.json({
            success: true,
            data: rows,
            pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
        });
    } catch (error) {
        console.error('[API Apontamento Rota2 GET]', error);
        res.status(500).json({ success: false, message: 'Erro interno ao buscar apontamentos Rota 2', error: error.message });
    }
});

// [ROTA 2] POST: Registrar apontamento na material_processo
app.post('/api/material-processo/apontar', tenantMiddleware, async (req, res) => {
    const { IdMaterialProcesso, IdOrdemServicoItem, IdOrdemServico, Processo, QtdeProduzida, TipoApontamento, CriadoPor } = req.body;

    if (!IdMaterialProcesso || !IdOrdemServicoItem || !QtdeProduzida || !Processo) {
        return res.status(400).json({ success: false, message: 'Dados obrigatórios ausentes' });
    }

    const inputQty = parseFloat(QtdeProduzida);
    if (isNaN(inputQty) || inputQty <= 0) {
        return res.status(400).json({ success: false, message: 'Quantidade inválida' });
    }

    const conn = await req.tenantDbPool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Buscar registro atual da material_processo
        const [mpRows] = await conn.execute('SELECT * FROM material_processo WHERE IdMaterialProcesso = ? FOR UPDATE', [IdMaterialProcesso]);
        if (mpRows.length === 0) {
            throw new Error('Registro material_processo não encontrado');
        }
        const mp = mpRows[0];
        
        const currentExecutado = parseFloat(mp.TotalExecutado) || 0;
        const currentExecutar = parseFloat(mp.TotalExecutar) || 0;
        
        // Na primeira vez, setar RealizadoInicio
        let dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (!mp.RealizadoInicio) {
            await conn.execute('UPDATE material_processo SET RealizadoInicio = ?, UsuarioRealizadoInicio = ? WHERE IdMaterialProcesso = ?', [dateNow, CriadoPor || 'Sistema', IdMaterialProcesso]);
        }

        // Atualizar Qtde Produzida (TotalExecutado += QtdeProduzida, TotalExecutar -= QtdeProduzida)
        const novoExecutado = currentExecutado + inputQty;
        // TotalExecutar should not go below 0
        const novoExecutar = Math.max(0, currentExecutar - inputQty);

        let updateQuery = 'UPDATE material_processo SET TotalExecutado = ?, TotalExecutar = ?';
        let updateParams = [novoExecutado, novoExecutar];

        // Se finalizou (TotalExecutar chegou a 0 ou apontamento Total)
        let finalizado = false;
        if (TipoApontamento !== 'Parcial' || novoExecutar <= 0) {
            finalizado = true;
            updateQuery += ', RealizadoFinal = ?, UsuarioRealizadoFinal = ?';
            updateParams.push(dateNow, CriadoPor || 'Sistema');
        }

        updateQuery += ' WHERE IdMaterialProcesso = ?';
        updateParams.push(IdMaterialProcesso);

        await conn.execute(updateQuery, updateParams);

        // 2. Cascatear Totais (usando lógica existente na rota 1, mas chamando as functions corretas)
        // Isso envolve atualizar ordemservicoitem, ordemservico, tag, projeto. 
        // Em Rota 1 eles usavam: recalcularQuantidadesTotais(IdOrdemServico, conn)
        // E logavam em ordemservicoitemcontrole. 
        // Vou apenas inserir em ordemservicoitemcontrole e chamar recalcularQuantidadesTotais.
        
        const txtSetor = \`txt\${Processo.charAt(0).toUpperCase() + Processo.slice(1)}\`;
        await conn.execute(\`
            INSERT INTO ordemservicoitemcontrole(
                IdOrdemServicoItem, IdOrdemServico, Processo, QtdeTotal, QtdeProduzida, TipoApontamento, CriadoPor, DataCriacao, D_E_L_E_T_E
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, '')
        \`, [IdOrdemServicoItem, IdOrdemServico, Processo.toLowerCase(), mp.TotalExecutar + mp.TotalExecutado, inputQty, TipoApontamento || 'Total', CriadoPor || 'Sistema', dateNow]);

        await conn.commit();
        conn.release();
        
        // Executar recalculo pós-commit (se a function existir globalmente no server.js)
        try {
            await recalcularQuantidadesTotais(IdOrdemServico, req.tenantDbPool);
        } catch(err) {
            console.log('[Rota 2] Erro ao recalcular totais em background:', err.message);
        }

        res.json({ success: true, message: 'Apontamento (Rota 2) registrado com sucesso' });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('[API Apontamento Rota 2 POST]', error);
        res.status(500).json({ success: false, message: 'Erro ao registrar apontamento: ' + error.message });
    }
});

`;

if (!content.includes('/api/material-processo/apontamentos/:recurso')) {
    content = content.replace("app.get('/api/apontamento/:setor'", getRoute + "\napp.get('/api/apontamento/:setor'");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Endpoints Rota 2 inseridos com sucesso.');
} else {
    console.log('Endpoints ja existem.');
}
