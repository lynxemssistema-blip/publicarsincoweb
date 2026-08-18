module.exports = function(app, tenantMiddleware) {

app.get('/api/material-processo/item/:idItem', tenantMiddleware, async (req, res) => {
    try {
        const { idItem } = req.params;
        const [rows] = await req.tenantDbPool.execute(`
            SELECT mp.*, pf.processofabricacao AS DescricaoProcesso 
            FROM material_processo mp
            LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso
            WHERE mp.codmatFabricante = (SELECT codmatFabricante FROM ordemservicoitem WHERE IdOrdemServicoItem = ?) 
              AND mp.IdOrdemServico = (SELECT IdOrdemServico FROM ordemservicoitem WHERE IdOrdemServicoItem = ?)
            ORDER BY mp.SequenciaExecucao ASC, pf.processofabricacao ASC
        `, [idItem, idItem]);
        res.json({ success: true, data: rows });
    } catch (e) {
        console.error('Error fetching material_processo for item:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});
app.get('/api/material-processo/apontamentos/:recurso', tenantMiddleware, async (req, res) => {
    const recurso = req.params.recurso.toLowerCase();
    
    let idProcesso = null;
    let isTodos = false;

    if (recurso === 'todos' || recurso === '12') {
        isTodos = true;
    } else if (!isNaN(recurso) && recurso.trim() !== '') {
        idProcesso = parseInt(recurso, 10);
        if (idProcesso === 12) isTodos = true;
    } else {
        // Fallback: Obter o IdProcessoFabricacao do recurso por nome na tabela correta (processofabricacao)
        const [processos] = await req.tenantDbPool.execute("SELECT IdProcessoFabricacao as IdProcesso, processofabricacao as Descricao FROM processofabricacao WHERE REPLACE(LOWER(processofabricacao), ' ', '') = ? LIMIT 1", [recurso]);
        if (processos.length === 0) {
            return res.status(404).json({ success: false, message: 'Recurso não encontrado' });
        }
        idProcesso = processos[0].IdProcesso;
        if (idProcesso === 12 || processos[0].Descricao.toLowerCase() === 'todos') {
            isTodos = true;
        }
    }

    const { projeto, tag, os, item, search, status, codMatFabricante, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offsetNum = (pageNum - 1) * limitNum;

    try {
        let whereClause = `(osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = '' OR osi.D_E_L_E_T_E != '*')
            AND osi.Liberado_engenharia = 'S'
            AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E != '*')`;
        const params = [];

        if (!isTodos && idProcesso !== null) {
            whereClause += ` AND mp.IdProcesso = ?`;
            params.push(idProcesso);
        }

        if (projeto) {
            whereClause += ' AND (os.Projeto LIKE ?)';
            params.push(`%${projeto}%`);
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
            params.push(`%${tag}%`);
        }

        if (os) {
            whereClause += ' AND os.IdOrdemServico = ?';
            params.push(os);
        }
        
        if (codMatFabricante) {
            whereClause += ' AND mp.codmatFabricante LIKE ?';
            params.push(`%${codMatFabricante}%`);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM material_processo mp
            JOIN ordemservicoitem osi ON osi.IdOrdemServico = mp.IdOrdemServico AND osi.codmatFabricante = mp.codmatFabricante
            JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
            WHERE ${whereClause}
        `;
        
        const [countResult] = await req.tenantDbPool.execute(countQuery, params);
        const total = countResult[0].total;

        const dataQuery = `
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
                mp.TempoEstimadoMin,
                mp.TempoPadraoMin,
                mp.MinutosProducao,
                osi.IdPlanodecorte AS PlanoCorte,
                osi.Espessura,
                os.Projeto,
                os.Tag,
                os.NomeCliente AS Cliente,
                os.Estatus AS StatusOS,
                os.OrdemServicoFinalizado AS OSFinalizado,
                p.Finalizado AS StatusProjeto,
                (
                    SELECT GROUP_CONCAT(CONCAT(mp2.SequenciaExecucao, 'º: ', COALESCE(pf.processofabricacao, '')) ORDER BY COALESCE(mp2.SequenciaExecucao, 999) SEPARATOR ' | ')
                    FROM material_processo mp2
                    LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp2.IdProcesso
                    WHERE mp2.IdOrdemServico = mp.IdOrdemServico 
                      AND mp2.codmatFabricante = mp.codmatFabricante
                ) AS TodosRecursosTooltip
            FROM material_processo mp
            JOIN ordemservicoitem osi ON osi.IdOrdemServico = mp.IdOrdemServico AND osi.codmatFabricante = mp.codmatFabricante
            JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
            LEFT JOIN projetos p ON os.IdProjeto = p.IdProjeto
            WHERE ${whereClause}
            ORDER BY osi.IdOrdemServico DESC, osi.IdOrdemServicoItem ASC
            LIMIT ? OFFSET ?
        `;

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
        
        const loggedUser = req.body.CriadoPor || req.user?.login || req.user?.nome || req.user?.NomeCompleto || 'Sistema';
        
        // Na primeira vez, setar RealizadoInicio
        let dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (!mp.RealizadoInicio) {
            await conn.execute('UPDATE material_processo SET RealizadoInicio = ?, UsuarioRealizadoInicio = ? WHERE IdMaterialProcesso = ?', [dateNow, loggedUser, IdMaterialProcesso]);
        }

        // Atualizar Qtde Produzida (TotalExecutado += QtdeProduzida, TotalExecutar -= QtdeProduzida)
        const novoExecutado = currentExecutado + inputQty;
        // TotalExecutar should not go below 0
        const novoExecutar = Math.max(0, currentExecutar - inputQty);

        // Atualizar MinutosProducao (Quantidade * Tempo Padrão)
        const tempoPadraoMin = parseFloat(mp.TempoPadraoMin) || 0;
        const adicionaMinutos = inputQty * tempoPadraoMin;
        const novoMinutosProducao = (parseFloat(mp.MinutosProducao) || 0) + adicionaMinutos;

        let updateQuery = 'UPDATE material_processo SET TotalExecutado = ?, TotalExecutar = ?, MinutosProducao = ?';
        let updateParams = [novoExecutado, novoExecutar, novoMinutosProducao];

        // Se finalizou (TotalExecutar chegou a 0 ou apontamento Total)
        let finalizado = false;
        if (TipoApontamento !== 'Parcial' || novoExecutar <= 0) {
            finalizado = true;
            updateQuery += ', RealizadoFinal = ?, UsuarioRealizadoFinal = ?';
            updateParams.push(dateNow, loggedUser);
        }

        updateQuery += ' WHERE IdMaterialProcesso = ?';
        updateParams.push(IdMaterialProcesso);

        await conn.execute(updateQuery, updateParams);

        // -- CASCATA DE APONTAMENTO --
        // Aumenta o TotalExecutar da PRÓXIMA etapa na sequência, se houver
        const [nextMpRows] = await conn.execute(`
            SELECT IdMaterialProcesso, TotalExecutar 
            FROM material_processo 
            WHERE IdOrdemServico = ? 
              AND codmatFabricante = ? 
              AND SequenciaExecucao > ? 
            ORDER BY SequenciaExecucao ASC 
            LIMIT 1 
            FOR UPDATE
        `, [mp.IdOrdemServico, mp.codmatFabricante, mp.SequenciaExecucao]);

        if (nextMpRows.length > 0) {
            const nextMp = nextMpRows[0];
            const nextTotalExecutar = (parseFloat(nextMp.TotalExecutar) || 0) + inputQty;
            await conn.execute(
                'UPDATE material_processo SET TotalExecutar = ? WHERE IdMaterialProcesso = ?',
                [nextTotalExecutar, nextMp.IdMaterialProcesso]
            );
        }
        // -----------------------------

        // 2. Cascatear Totais (usando lógica existente na rota 1, mas chamando as functions corretas)
        // Isso envolve atualizar ordemservicoitem, ordemservico, tag, projeto. 
        // Em Rota 1 eles usavam: recalcularQuantidadesTotais(IdOrdemServico, conn)
        // E logavam em ordemservicoitemcontrole. 
        // Vou apenas inserir em ordemservicoitemcontrole e chamar recalcularQuantidadesTotais.
        
        const txtSetor = `txt${Processo.charAt(0).toUpperCase() + Processo.slice(1)}`;
        const criador = req.tenantUser?.login || CriadoPor || 'Sistema';
        const idMatriz = req.tenantUser?.tenantId || null;

        await conn.execute(`
            INSERT INTO ordemservicoitemcontrole(
                IdOrdemServicoItem, IdOrdemServico, Processo, QtdeTotal, QtdeProduzida, TipoApontamento, CriadoPor, DataCriacao, IdMatriz, D_E_L_E_T_E
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, '')
        `, [IdOrdemServicoItem, IdOrdemServico, Processo.toLowerCase(), mp.TotalExecutar + mp.TotalExecutado, inputQty, TipoApontamento || 'Total', criador, dateNow, idMatriz]);

        // Propagar a atualização para ordemservicoitem para que as telas (inclusive a Rota 1) vejam os totais
        const pLower = Processo.toLowerCase();
        const PREFIXO_MAP = { galvanizar: 'GALVANIZAR', punsionadeira: 'PUNSIONADEIRA', cortealaser: 'CorteaLaser' };
        const pref = PREFIXO_MAP[pLower] || (Processo.charAt(0).toUpperCase() + Processo.slice(1).toLowerCase());
        const totalCol = `${pref}TotalExecutado`;
        const executarCol = `${pref}TotalExecutar`;

        try {
            await conn.execute(`
                UPDATE ordemservicoitem 
                SET ${totalCol} = COALESCE(${totalCol}, 0) + ?,
                    ${executarCol} = GREATEST(0, COALESCE(${executarCol}, 0) - ?)
                WHERE IdOrdemServicoItem = ?
            `, [inputQty, inputQty, IdOrdemServicoItem]);
        } catch(err) {
            console.error('[Rota 2] Erro ao sincronizar ordemservicoitem:', err.message);
        }

        try {
            if (global.cascatearFinalizados) {
                await global.cascatearFinalizados(conn, IdOrdemServicoItem, IdOrdemServico, mp.IdTag, mp.IdProjeto, mp.codmatFabricante);
            }
        } catch(err) {
            console.error('[Rota 2] Erro ao cascatear finalizados:', err.message);
        }

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

};
