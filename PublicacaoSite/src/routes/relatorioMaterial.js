const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');

// Helper para obter pool do tenant
const db = (req) => req.tenantDbPool || req.app.locals.pool;

// Helper para formatar data BR
const formatBR = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
};

// Helper para data e hora em horário de Brasília
const formatDataHoraBR = (date = new Date()) => {
    try {
        return new Date(date).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } catch {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
    }
};

// Helper para carregar dados corporativos da empresa titular que utiliza o aplicativo SincoWeb
const getEmpresaInfo = async (pool, req = null) => {
    let empresa = null;
    try {
        // 1. Busca na tabela empresa (empresa titular do sistema) com seu endereço
        const [empRows] = await pool.execute(
            `SELECT e.IdEmpresa, e.RazaoSocial, e.NomeFantasia, e.Cnpj, e.Email, e.Telefone, e.Celular,
                    ee.Endereco, ee.Numero, ee.Bairro, ee.Cidade, ee.Estado, ee.Cep
             FROM empresa e
             LEFT JOIN empresa_endereco ee ON ee.IdEmpresa = e.IdEmpresa
             WHERE (e.Deletado = 0 OR e.Deletado IS NULL)
             ORDER BY e.IdEmpresa ASC
             LIMIT 1`
        );
        if (empRows.length > 0 && empRows[0].RazaoSocial && empRows[0].RazaoSocial.trim() !== '') {
            empresa = empRows[0];
        }
    } catch (e) {
        console.warn('Aviso ao carregar dados da tabela empresa:', e.message);
    }

    // 2. Se a tabela empresa não tiver dados cadastrados, identifica o tenant via conexoes_bancos
    let tenantClient = '';
    try {
        const dbName = req?.tenantUser?.dbName || req?.user?.dbName || pool?.poolConfig?.database || 'lynxlocal';
        const [cbRows] = await pool.execute(
            `SELECT nome_cliente FROM conexoes_bancos WHERE (db_name = ? OR id = ?) AND ativo = 1 LIMIT 1`,
            [dbName, req?.tenantUser?.tenantId || 1]
        );
        if (cbRows.length > 0 && cbRows[0].nome_cliente) {
            tenantClient = cbRows[0].nome_cliente.trim();
        }
    } catch (_) {}

    const defaultClient = tenantClient || 'LYNX';
    const isLynx = defaultClient.toUpperCase().includes('LYNX');

    return {
        razaoSocial: empresa?.RazaoSocial || (isLynx ? 'LYNX GESTÃO E AUTOMAÇÃO INDUSTRIAL' : `${defaultClient.toUpperCase()} INDÚSTRIA E COMÉRCIO LTDA`),
        nomeFantasia: empresa?.NomeFantasia || (isLynx ? 'LYNX SISTEMAS INDUSTRIAIS' : defaultClient.toUpperCase()),
        cnpj: empresa?.Cnpj || (isLynx ? '20.976.130/0001-71' : '00.000.000/0001-00'),
        ie: 'ISENTO',
        telefone: empresa?.Telefone || empresa?.Celular || '(31) 99557-4906',
        email: empresa?.Email || 'contato@sincoweb.com.br',
        cidade: empresa?.Cidade || 'Contagem',
        estado: empresa?.Estado || 'MG',
        endereco: empresa?.Endereco ? [empresa.Endereco, empresa.Numero, empresa.Bairro].filter(Boolean).join(', ') : 'Distrito Industrial',
        bairro: empresa?.Bairro || 'Industrial',
        cep: empresa?.Cep || '32000-000'
    };
};

// Função centralizada para carregar a estrutura completa do material com árvore BOM e processos
const carregarEstruturaCompleta = async (pool, idMaterial) => {
    // 1. Busca material raiz
    const [rootRows] = await pool.execute(`
        SELECT 
            m.IdMaterial, m.CodMatFabricante, m.DescResumo, m.DescDetal, 
            m.Unidade, m.Peso, m.PecaManufat, m.EnderecoArquivo, m.TxtTipoDesenho,
            f.DescFamilia
        FROM material m
        LEFT JOIN familia f ON m.FamiliaMat = f.IdFamilia
        WHERE m.IdMaterial = ? AND (m.D_E_L_E_T_E IS NULL OR m.D_E_L_E_T_E = '')
        LIMIT 1
    `, [idMaterial]);

    if (rootRows.length === 0) return null;
    const rootMaterial = rootRows[0];

    // Helper para buscar processos fabris
    const getProcessos = async (codMatFabricante, idMat) => {
        try {
            const [procRows] = await pool.execute(`
                SELECT 
                    mp.IdMaterialProcesso,
                    COALESCE(mp.SequenciaExecucao, 10) AS Seq,
                    COALESCE(pf.ProcessoFabricacao, CONCAT('Processo #', mp.IdProcesso)) AS NomeProcesso,
                    COALESCE(pf.ProcessoFabricacao, CONCAT('Recurso #', mp.IdProcesso)) AS Recurso,
                    COALESCE(mp.TempoEstimadoMin, pf.Setup, 0) AS TempoSetup,
                    COALESCE(mp.TempoPadraoMin, pf.TempoPadrao, 0) AS TempoPadrao,
                    mp.Observacao
                FROM material_processo mp
                LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso
                WHERE (mp.codmatFabricante = ? OR (mp.IdMaterial = ? AND mp.IdMaterial > 0))
                  AND (mp.IdOrdemServico IS NULL OR mp.IdOrdemServico = 0)
                ORDER BY mp.SequenciaExecucao ASC
            `, [codMatFabricante || '', idMat || 0]);

            return procRows.map(p => ({
                Seq: Number(p.Seq) || 10,
                NomeProcesso: p.NomeProcesso || '-',
                Recurso: p.Recurso || '-',
                TempoSetup: parseFloat(p.TempoSetup) || 0,
                TempoPadrao: parseFloat(p.TempoPadrao) || 0,
                TempoTotal: (parseFloat(p.TempoSetup) || 0) + (parseFloat(p.TempoPadrao) || 0),
                Observacao: p.Observacao || ''
            }));
        } catch (e) {
            return [];
        }
    };

    // 2. Busca recursiva
    let maxNivel = 0;
    const getBomRecursive = async (parentId, parentCod, qtdeAcumulada = 1, nivel = 1, pathIds = []) => {
        if (pathIds.includes(parentId) || nivel > 25) return [];
        const currentPath = [...pathIds, parentId];

        const [childrenRows] = await pool.execute(`
            SELECT 
                mp.IdMontaPeca,
                mp.IdMaterial,
                mp.IdMaterialPeca,
                mp.CodMatFabricante,
                COALESCE(m.DescDetal, m.DescResumo, mp.CodMatFabricante) AS DescResumo,
                COALESCE(mp.QtdeUnitaria, CAST(NULLIF(mp.PecaQtde, '') AS DECIMAL(18,4)), 1) AS QtdeUnitaria,
                m.Unidade,
                COALESCE(m.Peso, 0) AS Peso,
                COALESCE(m.PecaManufat, 'N') AS PecaManufat,
                m.EnderecoArquivo,
                m.TxtTipoDesenho,
                (SELECT COUNT(1) FROM montapeca sub 
                 WHERE sub.IdMaterialPeca = mp.IdMaterial 
                   AND (sub.D_E_L_E_T_E IS NULL OR sub.D_E_L_E_T_E = '')) AS NumChildren
            FROM montapeca mp
            LEFT JOIN material m ON m.IdMaterial = mp.IdMaterial
            WHERE (mp.D_E_L_E_T_E IS NULL OR mp.D_E_L_E_T_E = '')
              AND (mp.IdMaterialPeca = ? OR (mp.CodMatFabricantePeca = ? AND (mp.IdMaterialPeca IS NULL OR mp.IdMaterialPeca = 0)))
            ORDER BY mp.Ordem ASC, mp.CodMatFabricante ASC
        `, [parentId, parentCod || '']);

        const result = [];
        for (const child of childrenRows) {
            if (nivel > maxNivel) maxNivel = nivel;
            const qtdUnit = parseFloat(child.QtdeUnitaria) || 1;
            const qtdAcum = qtdeAcumulada * qtdUnit;
            const pesoUnit = parseFloat(child.Peso) || 0;
            const pesoTot = pesoUnit * qtdAcum;
            const hasChildSub = Number(child.NumChildren) > 0;
            const isManufat = child.PecaManufat === 'S' || hasChildSub;

            let childProcessos = [];
            if (isManufat) {
                childProcessos = await getProcessos(child.CodMatFabricante, child.IdMaterial);
            }

            const node = {
                IdMontaPeca: child.IdMontaPeca,
                IdMaterial: child.IdMaterial,
                IdMaterialPai: parentId,
                Nivel: nivel,
                CodMatFabricante: child.CodMatFabricante || '-',
                DescResumo: child.DescResumo || '-',
                QtdeUnitaria: qtdUnit,
                QtdeAcumulada: qtdAcum,
                Unidade: child.Unidade || 'UN',
                Peso: pesoUnit,
                PesoTotal: pesoTot,
                PecaManufat: isManufat ? 'S' : 'N',
                EnderecoArquivo: child.EnderecoArquivo || '',
                TxtTipoDesenho: child.TxtTipoDesenho || '',
                hasChildren: hasChildSub,
                processos: childProcessos,
                children: []
            };

            if (node.hasChildren && child.IdMaterial && !currentPath.includes(child.IdMaterial)) {
                node.children = await getBomRecursive(child.IdMaterial, child.CodMatFabricante, qtdAcum, nivel + 1, currentPath);
            }
            result.push(node);
        }
        return result;
    };

    // Processos da peça raiz
    let rootProcessos = [];
    if (rootMaterial.PecaManufat === 'S') {
        rootProcessos = await getProcessos(rootMaterial.CodMatFabricante, rootMaterial.IdMaterial);
    }

    const bomChildren = await getBomRecursive(rootMaterial.IdMaterial, rootMaterial.CodMatFabricante, 1, 1, []);

    // Achatamento da lista para exibição tabular linear com indentação
    const flatBom = [];
    let pesoTotalCalculado = parseFloat(rootMaterial.Peso) || 0;

    const flatten = (items) => {
        for (const item of items) {
            flatBom.push({
                IdMontaPeca: item.IdMontaPeca,
                IdMaterial: item.IdMaterial,
                IdMaterialPai: item.IdMaterialPai,
                Nivel: item.Nivel,
                CodMatFabricante: item.CodMatFabricante,
                DescResumo: item.DescResumo,
                QtdeUnitaria: item.QtdeUnitaria,
                QtdeAcumulada: item.QtdeAcumulada,
                Unidade: item.Unidade,
                Peso: item.Peso,
                PesoTotal: item.PesoTotal,
                PecaManufat: item.PecaManufat,
                EnderecoArquivo: item.EnderecoArquivo,
                TxtTipoDesenho: item.TxtTipoDesenho,
                hasChildren: item.hasChildren,
                processos: item.processos || []
            });
            pesoTotalCalculado += (item.PesoTotal || 0);
            if (item.children && item.children.length > 0) {
                flatten(item.children);
            }
        }
    };

    const rootNode = {
        Nivel: 0,
        IdMaterial: rootMaterial.IdMaterial,
        CodMatFabricante: rootMaterial.CodMatFabricante,
        DescResumo: rootMaterial.DescResumo || rootMaterial.DescDetal || '-',
        QtdeUnitaria: 1,
        QtdeAcumulada: 1,
        Unidade: rootMaterial.Unidade || 'UN',
        Peso: parseFloat(rootMaterial.Peso) || 0,
        PesoTotal: parseFloat(rootMaterial.Peso) || 0,
        PecaManufat: rootMaterial.PecaManufat || 'S',
        EnderecoArquivo: rootMaterial.EnderecoArquivo || '',
        TxtTipoDesenho: rootMaterial.TxtTipoDesenho || '',
        hasChildren: bomChildren.length > 0,
        processos: rootProcessos || []
    };

    flatten(bomChildren);

    // Tempo total de fabricação estimado
    let tempoTotalGeral = rootProcessos.reduce((acc, p) => acc + (p.TempoTotal || 0), 0);
    flatBom.forEach(item => {
        if (item.processos) {
            tempoTotalGeral += item.processos.reduce((acc, p) => acc + (p.TempoTotal || 0), 0);
        }
    });

    return {
        material: rootMaterial,
        totalNiveis: maxNivel,
        pesoTotal: pesoTotalCalculado,
        totalItens: flatBom.length,
        tempoTotalGeral,
        root: rootNode,
        flatBom: [rootNode, ...flatBom]
    };
};

// ────────────────────────────────────────────────────────────────────────────────
// GET /:id/relatorio/excel — Relatório Excel com Carimbo Técnico e Roteiro Integrado
// ────────────────────────────────────────────────────────────────────────────────
router.get('/:id/relatorio/excel', async (req, res) => {
    try {
        const pool = db(req);
        const { id } = req.params;
        const estrutura = await carregarEstruturaCompleta(pool, id);

        if (!estrutura) {
            return res.status(404).json({ success: false, message: 'Material não encontrado.' });
        }

        const empresa = await getEmpresaInfo(pool, req);
        const usuarioEmissor = req.user?.usuario || req.user?.nome || req.query.usuario || 'Sistema';
        const dataHoraEmissao = formatDataHoraBR();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = `SincoWeb - ${usuarioEmissor}`;
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Estrutura do Produto', {
            pageSetup: {
                paperSize: 9, // A4
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
                printTitlesRow: '1:6'
            },
            views: [{ state: 'frozen', ySplit: 6 }]
        });

        // Estilos e cores padrão SincoWeb
        const borderThin = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };

        // BLOCO ESQUERDO: DADOS DA EMPRESA (A1:C4)
        sheet.mergeCells('A1:C1');
        const cA1 = sheet.getCell('A1');
        cA1.value = empresa.nomeFantasia.toUpperCase();
        cA1.font = { bold: true, size: 11, color: { argb: 'FF32423D' } };
        cA1.alignment = { vertical: 'middle', horizontal: 'center' };
        cA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('A2:C2');
        const cA2 = sheet.getCell('A2');
        cA2.value = empresa.razaoSocial;
        cA2.font = { size: 8, color: { argb: 'FF475569' } };
        cA2.alignment = { vertical: 'middle', horizontal: 'center' };
        cA2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('A3:C3');
        const cA3 = sheet.getCell('A3');
        cA3.value = `CNPJ: ${empresa.cnpj} | IE: ${empresa.ie}`;
        cA3.font = { size: 7.5, color: { argb: 'FF64748B' } };
        cA3.alignment = { vertical: 'middle', horizontal: 'center' };
        cA3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('A4:C4');
        const cA4 = sheet.getCell('A4');
        cA4.value = `${empresa.endereco} - ${empresa.cidade}/${empresa.estado}`;
        cA4.font = { size: 7.5, color: { argb: 'FF64748B' } };
        cA4.alignment = { vertical: 'middle', horizontal: 'center' };
        cA4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        // BLOCO CENTRAL: TÍTULO DO DOCUMENTO E DADOS DO PRODUTO (D1:H4)
        sheet.mergeCells('D1:H1');
        const cD1 = sheet.getCell('D1');
        cD1.value = 'ESTRUTURA COMPLETA DO PRODUTO (BOM & ROTEIRO INDUSTRIAL)';
        cD1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cD1.alignment = { vertical: 'middle', horizontal: 'center' };
        cD1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF32423D' } };

        sheet.mergeCells('D2:H2');
        const cD2 = sheet.getCell('D2');
        cD2.value = `Produto: ${estrutura.material.CodMatFabricante} - ${estrutura.material.DescResumo || estrutura.material.DescDetal || ''}`;
        cD2.font = { bold: true, size: 10, color: { argb: 'FF32423D' } };
        cD2.alignment = { vertical: 'middle', horizontal: 'center' };
        cD2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

        sheet.mergeCells('D3:H3');
        const cD3 = sheet.getCell('D3');
        cD3.value = `Tipo: ${estrutura.material.PecaManufat === 'S' ? 'PEÇA MANUFATURADA' : 'INSUMO'} | Níveis: ${estrutura.totalNiveis} | Componentes: ${estrutura.totalItens} | Desenho: ${estrutura.material.TxtTipoDesenho || 'PADRÃO'}`;
        cD3.font = { size: 8.5, color: { argb: 'FF334155' } };
        cD3.alignment = { vertical: 'middle', horizontal: 'center' };
        cD3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

        sheet.mergeCells('D4:H4');
        const cD4 = sheet.getCell('D4');
        cD4.value = `Peso Total Estrutural: ${Number(estrutura.pesoTotal).toFixed(3)} kg | Tempo Estimado Fabricação: ${estrutura.tempoTotalGeral.toFixed(1)} min`;
        cD4.font = { bold: true, size: 8.5, color: { argb: 'FF567469' } };
        cD4.alignment = { vertical: 'middle', horizontal: 'center' };
        cD4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

        // BLOCO DIREITO: RASTREABILIDADE & EMISSÃO (I1:K4)
        sheet.mergeCells('I1:K1');
        const cI1 = sheet.getCell('I1');
        cI1.value = 'DOC. TÉCNICO: DOC-BOM-SGQ-01';
        cI1.font = { bold: true, size: 9, color: { argb: 'FF32423D' } };
        cI1.alignment = { vertical: 'middle', horizontal: 'center' };
        cI1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

        sheet.mergeCells('I2:K2');
        const cI2 = sheet.getCell('I2');
        cI2.value = `Emitido por: ${usuarioEmissor}`;
        cI2.font = { size: 8, color: { argb: 'FF334155' } };
        cI2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cI2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('I3:K3');
        const cI3 = sheet.getCell('I3');
        cI3.value = `Data/Hora: ${dataHoraEmissao}`;
        cI3.font = { size: 8, color: { argb: 'FF334155' } };
        cI3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cI3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('I4:K4');
        const cI4 = sheet.getCell('I4');
        cI4.value = `Status: APROVADO PCP / ENG`;
        cI4.font = { bold: true, size: 8, color: { argb: 'FF567469' } };
        cI4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cI4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        // Aplica bordas ao carimbo
        for (let r = 1; r <= 4; r++) {
            sheet.getRow(r).height = 19;
            for (let c = 1; c <= 11; c++) {
                sheet.getRow(r).getCell(c).border = borderThin;
            }
        }

        sheet.getRow(5).height = 8; // Linha espaçadora

        // CABEÇALHO DA TABELA (Linha 6)
        const headerRow = sheet.getRow(6);
        headerRow.height = 24;
        headerRow.values = [
            'Nível', 'Código do Item', 'Descrição Técnica / Operação', 'Classificação',
            'Qtd. Unit', 'Qtd. Acum', 'Unid', 'Peso Unit (kg)', 'Peso Total (kg)',
            'Tempo Setup', 'Tempo Total'
        ];

        headerRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF567469' } }; // Verde SincoWeb #567469
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF32423D' } },
                bottom: { style: 'medium', color: { argb: 'FF32423D' } },
                left: { style: 'thin', color: { argb: 'FF32423D' } },
                right: { style: 'thin', color: { argb: 'FF32423D' } }
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: [1, 4, 7].includes(colNumber) ? 'center' : [5, 6, 8, 9, 10, 11].includes(colNumber) ? 'right' : 'left'
            };
        });

        // LINHAS DE DADOS (Material + Roteiro integrado logo abaixo)
        let currentRow = 7;
        for (const item of estrutura.flatBom) {
            const row = sheet.getRow(currentRow);
            row.height = 19;
            const isRoot = item.Nivel === 0;
            const nivelText = isRoot ? 'Principal' : `${'   '.repeat(item.Nivel)}↳ L${item.Nivel}`;

            row.values = [
                nivelText,
                item.CodMatFabricante,
                item.DescResumo,
                item.PecaManufat === 'S' ? 'Peça Manufaturada' : 'Insumo Comprado',
                Number(item.QtdeUnitaria) || 1,
                Number(item.QtdeAcumulada) || 1,
                item.Unidade || 'UN',
                Number(item.Peso) || 0,
                Number(item.PesoTotal) || 0,
                item.processos && item.processos.length > 0 ? `${item.processos.reduce((a, b) => a + (b.TempoSetup || 0), 0).toFixed(1)}m` : '-',
                item.processos && item.processos.length > 0 ? `${item.processos.reduce((a, b) => a + (b.TempoTotal || 0), 0).toFixed(1)}m` : '-'
            ];

            const bgRow = isRoot ? 'FFF1F5F9' : (currentRow % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF');

            row.eachCell((cell, colNumber) => {
                cell.font = {
                    name: 'Segoe UI',
                    size: 8.5,
                    bold: isRoot || colNumber === 2,
                    color: { argb: isRoot ? 'FF0F172A' : 'FF334155' }
                };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
                cell.border = borderThin;
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: [1, 4, 7].includes(colNumber) ? 'center' : [5, 6, 8, 9, 10, 11].includes(colNumber) ? 'right' : 'left'
                };

                // Formatação numérica
                if ([5, 6].includes(colNumber)) cell.numFmt = '#,##0.00';
                if ([8, 9].includes(colNumber)) cell.numFmt = '#,##0.000';
            });
            currentRow++;

            // Se for peça manufaturada e tiver processos, insere o roteiro integrado diretamente abaixo
            if (item.processos && item.processos.length > 0) {
                for (const proc of item.processos) {
                    const procRow = sheet.getRow(currentRow);
                    procRow.height = 17;

                    const procIndent = `${'   '.repeat(item.Nivel + 1)}↳ [Seq ${proc.Seq}]`;
                    procRow.values = [
                        '',
                        procIndent,
                        `${proc.NomeProcesso} (${proc.Recurso}) ${proc.Observacao ? ' - ' + proc.Observacao : ''}`,
                        'Operação Produtiva',
                        '-',
                        '-',
                        'MIN',
                        '-',
                        '-',
                        `${proc.TempoSetup.toFixed(2)}m`,
                        `${proc.TempoTotal.toFixed(2)}m`
                    ];

                    procRow.eachCell((cell, colNumber) => {
                        cell.font = { name: 'Segoe UI', size: 7.8, italic: true, color: { argb: 'FF166534' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Fundo suave verde esmeralda
                        cell.border = {
                            top: { style: 'hair', color: { argb: 'FFBBF7D0' } },
                            bottom: { style: 'hair', color: { argb: 'FFBBF7D0' } },
                            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                        };
                        cell.alignment = {
                            vertical: 'middle',
                            horizontal: [1, 4, 7].includes(colNumber) ? 'center' : [5, 6, 8, 9, 10, 11].includes(colNumber) ? 'right' : 'left'
                        };
                    });
                    currentRow++;
                }
            }
        }

        // Auto-fit nas colunas com larguras proporcionais
        const colWidths = [16, 24, 40, 18, 12, 12, 8, 14, 14, 14, 14];
        sheet.columns.forEach((col, i) => {
            col.width = colWidths[i] || 15;
        });

        // Configuração de envio HTTP
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="BOM_${estrutura.material.CodMatFabricante || 'Estrutura'}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('[RelatorioMaterial] Erro ao gerar Excel:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório Excel da estrutura: ' + error.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────────
// GET /:id/relatorio/pdf — Relatório PDF A4 Paisagem (Puppeteer / ISO 9001 / SincoWeb)
// ────────────────────────────────────────────────────────────────────────────────
router.get('/:id/relatorio/pdf', async (req, res) => {
    let browser = null;
    try {
        const pool = db(req);
        const { id } = req.params;
        const estrutura = await carregarEstruturaCompleta(pool, id);

        if (!estrutura) {
            return res.status(404).json({ success: false, message: 'Material não encontrado.' });
        }

        const empresa = await getEmpresaInfo(pool, req);
        const usuarioEmissor = req.user?.usuario || req.user?.nome || req.query.usuario || 'Sistema';
        const dataHoraEmissao = formatDataHoraBR();

        // Geração das linhas HTML do relatório com roteiro integrado no nível
        let rowsHtml = '';
        estrutura.flatBom.forEach((item, idx) => {
            const isRoot = item.Nivel === 0;
            const hasProcs = item.processos && item.processos.length > 0;
            const totTempoItem = hasProcs ? item.processos.reduce((a, b) => a + (b.TempoTotal || 0), 0) : 0;

            rowsHtml += `
                <tr class="row-material ${isRoot ? 'row-root' : (idx % 2 === 0 ? 'bg-even' : '')}">
                    <td class="text-center font-bold">
                        ${isRoot ? '<span class="badge-root">L0 (RAIZ)</span>' : `<span class="badge-nivel">L${item.Nivel}</span>`}
                    </td>
                    <td class="font-mono font-bold" style="padding-left: ${6 + (item.Nivel * 14)}px;">
                        ${item.Nivel > 0 ? '<span class="arrow-char">↳</span> ' : ''}${item.CodMatFabricante}
                    </td>
                    <td class="text-desc truncate">${item.DescResumo || '-'}</td>
                    <td class="text-center">
                        ${item.PecaManufat === 'S' 
                            ? '<span class="badge-manufat">🏭 PEÇA</span>' 
                            : '<span class="badge-insumo">📦 INSUMO</span>'}
                    </td>
                    <td class="text-right font-mono">${Number(item.QtdeUnitaria).toFixed(2)}</td>
                    <td class="text-right font-mono font-bold text-darkgreen">${Number(item.QtdeAcumulada).toFixed(2)}</td>
                    <td class="text-center font-mono text-muted">${item.Unidade || 'UN'}</td>
                    <td class="text-right font-mono">${Number(item.Peso).toFixed(3)}</td>
                    <td class="text-right font-mono font-bold">${Number(item.PesoTotal).toFixed(3)}</td>
                    <td class="text-right font-mono text-darkgreen font-bold">${totTempoItem > 0 ? totTempoItem.toFixed(1) + ' min' : '-'}</td>
                </tr>
            `;

            // Roteiro integrado na linha subsequente
            if (hasProcs) {
                let procRows = '';
                item.processos.forEach(p => {
                    procRows += `
                        <tr>
                            <td class="text-center font-bold text-emerald">[Seq ${p.Seq}]</td>
                            <td class="font-bold text-gray-800">${p.NomeProcesso}</td>
                            <td class="text-emerald font-semibold">${p.Recurso}</td>
                            <td class="text-right font-mono">${p.TempoSetup ? p.TempoSetup.toFixed(2) + 'm' : '-'}</td>
                            <td class="text-right font-mono">${p.TempoPadrao ? p.TempoPadrao.toFixed(2) + 'm' : '-'}</td>
                            <td class="text-right font-mono font-bold text-emerald">${p.TempoTotal.toFixed(2)} min</td>
                            <td class="text-muted text-[8px]">${p.Observacao || '-'}</td>
                        </tr>
                    `;
                });

                rowsHtml += `
                    <tr class="row-roteiro">
                        <td colspan="10" style="padding: 2px 4px 5px ${18 + (item.Nivel * 14)}px;">
                            <div class="proc-container">
                                <div class="proc-header">
                                    <span>⚙️ <strong>Roteiro de Fabricação:</strong> ${item.CodMatFabricante} (${item.processos.length} etapas)</span>
                                    <span>Tempo Total da Peça: <strong>${totTempoItem.toFixed(1)} min</strong></span>
                                </div>
                                <table class="proc-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 50px;">Seq</th>
                                            <th>Operação / Processo</th>
                                            <th>Posto de Trabalho / Recurso</th>
                                            <th style="width: 70px; text-align: right;">Setup</th>
                                            <th style="width: 70px; text-align: right;">Padrão</th>
                                            <th style="width: 80px; text-align: right;">Total</th>
                                            <th>Observação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${procRows}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });

        const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Estrutura do Produto - ${estrutura.material.CodMatFabricante}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 8mm 8mm 10mm 8mm;
                }
                * { box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #0f172a;
                    font-size: 8.5px;
                    background: #ffffff;
                }

                /* CARIMBO TÉCNICO INDUSTRIAL (SincoWeb / ISO 9001) */
                .carimbo-tecnico {
                    display: flex;
                    border: 1.5px solid #32423D;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                    background: #ffffff;
                }

                .bloco-empresa {
                    width: 28%;
                    border-right: 1.5px solid #32423D;
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    background: #f8fafc;
                }
                .empresa-nome {
                    font-size: 11px;
                    font-weight: 800;
                    color: #32423D;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                .empresa-razao {
                    font-size: 8px;
                    font-weight: 600;
                    color: #475569;
                    margin-top: 1px;
                }
                .empresa-meta {
                    font-size: 7.5px;
                    color: #64748b;
                    margin-top: 1px;
                }

                .bloco-titulo {
                    width: 44%;
                    border-right: 1.5px solid #32423D;
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                }
                .titulo-topo {
                    background: #32423D;
                    color: #ffffff;
                    font-size: 10.5px;
                    font-weight: 800;
                    padding: 4px 6px;
                    letter-spacing: 0.5px;
                }
                .titulo-dados {
                    padding: 4px 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    flex: 1;
                    background: #ffffff;
                }
                .produto-cod {
                    font-size: 12px;
                    font-weight: 800;
                    font-family: monospace;
                    color: #32423D;
                }
                .produto-desc {
                    font-size: 8.5px;
                    color: #334155;
                    font-weight: 600;
                    margin-top: 1px;
                }
                .kpis-banner {
                    display: flex;
                    justify-content: space-around;
                    margin-top: 4px;
                    padding-top: 3px;
                    border-top: 1px dashed #cbd5e1;
                    font-size: 8px;
                }

                .bloco-rastreio {
                    width: 28%;
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    background: #f8fafc;
                    font-size: 8px;
                    line-height: 1.4;
                }
                .rastreio-doc {
                    font-weight: 800;
                    color: #32423D;
                    border-bottom: 1px solid #cbd5e1;
                    padding-bottom: 2px;
                    margin-bottom: 2px;
                }

                /* TABELA PRINCIPAL */
                table.bom-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8px;
                    border: 1px solid #cbd5e1;
                }
                thead.table-header-group {
                    display: table-header-group;
                }
                th {
                    background: #567469;
                    color: #ffffff;
                    padding: 4px 5px;
                    font-size: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    border: 1px solid #32423D;
                }
                td {
                    padding: 3px 5px;
                    border: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .bg-even { background: #f8fafc; }
                .row-root { background: #f1f5f9; font-weight: bold; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-muted { color: #64748b; }
                .font-mono { font-family: monospace; }
                .font-bold { font-weight: 700; }
                .text-darkgreen { color: #32423D; }
                .text-emerald { color: #15803d; }
                .arrow-char { color: #94a3b8; font-weight: bold; }

                .badge-root {
                    background: #dbeafe;
                    color: #1e40af;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 7px;
                    font-weight: 800;
                }
                .badge-nivel {
                    background: #e2e8f0;
                    color: #334155;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 7px;
                    font-weight: 700;
                }
                .badge-manufat {
                    background: #dcfce7;
                    color: #166534;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 7px;
                    font-weight: 700;
                }
                .badge-insumo {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 7px;
                    font-weight: 600;
                }

                /* CONTAINER DO ROTEIRO INTEGRADO */
                .proc-container {
                    background: #ffffff;
                    border: 1px solid #bbf7d0;
                    border-radius: 3px;
                    overflow: hidden;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                }
                .proc-header {
                    background: #f0fdf4;
                    color: #14532d;
                    padding: 2px 6px;
                    font-size: 7.5px;
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #bbf7d0;
                }
                table.proc-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 7.5px;
                }
                table.proc-table th {
                    background: #f8fafc;
                    color: #1e293b;
                    border: 1px solid #dcfce7;
                    padding: 2px 4px;
                    font-size: 7px;
                }
                table.proc-table td {
                    border: 1px solid #f0fdf4;
                    padding: 2px 4px;
                }

                /* RODAPÉ DO DOCUMENTO */
                .rodape-tecnico {
                    margin-top: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #cbd5e1;
                    padding-top: 6px;
                    font-size: 7.5px;
                    color: #64748b;
                }
                .assinaturas {
                    display: flex;
                    gap: 30px;
                }
                .linha-assinatura {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 160px;
                }
                .linha-assinatura .traco {
                    border-bottom: 1px solid #334155;
                    width: 100%;
                    margin-bottom: 2px;
                }
            </style>
        </head>
        <body>
            <!-- CARIMBO TÉCNICO INDUSTRIAL -->
            <div class="carimbo-tecnico">
                <div class="bloco-empresa">
                    <div class="empresa-nome">${empresa.nomeFantasia}</div>
                    <div class="empresa-razao">${empresa.razaoSocial}</div>
                    <div class="empresa-meta">CNPJ: ${empresa.cnpj} | IE: ${empresa.ie}</div>
                    <div class="empresa-meta">${empresa.endereco} - ${empresa.cidade}/${empresa.estado}</div>
                </div>

                <div class="bloco-titulo">
                    <div class="titulo-topo">ESTRUTURA DO PRODUTO & ROTEIRO DE PROCESSOS</div>
                    <div class="titulo-dados">
                        <div class="produto-cod">${estrutura.material.CodMatFabricante}</div>
                        <div class="produto-desc">${estrutura.material.DescResumo || estrutura.material.DescDetal || 'ESTRUTURA DE ENGENHARIA'}</div>
                        <div class="kpis-banner">
                            <span>Níveis: <strong>${estrutura.totalNiveis}</strong></span>
                            <span>Componentes: <strong>${estrutura.totalItens}</strong></span>
                            <span>Peso Total: <strong>${Number(estrutura.pesoTotal).toFixed(3)} kg</strong></span>
                            <span>Tempo Fabricação: <strong>${estrutura.tempoTotalGeral.toFixed(1)} min</strong></span>
                        </div>
                    </div>
                </div>

                <div class="bloco-rastreio">
                    <div class="rastreio-doc">DOC. TÉCNICO: DOC-BOM-SGQ-01</div>
                    <div><strong>Emissão:</strong> ${dataHoraEmissao}</div>
                    <div><strong>Operador:</strong> ${usuarioEmissor}</div>
                    <div><strong>Tipo Desenho:</strong> ${estrutura.material.TxtTipoDesenho || 'PADRÃO'}</div>
                    <div><strong>Status:</strong> <span style="color:#15803d; font-weight:bold;">LIBERADO PCP</span></div>
                </div>
            </div>

            <!-- TABELA BOM MULTINÍVEL COM PROCESSOS INTEGRADOS -->
            <table class="bom-table">
                <thead class="table-header-group">
                    <tr>
                        <th style="width: 55px;">Nível</th>
                        <th style="width: 150px;">Código do Item</th>
                        <th>Descrição Técnica</th>
                        <th style="width: 75px;">Classificação</th>
                        <th style="width: 50px; text-align: right;">Qtd. Unit</th>
                        <th style="width: 50px; text-align: right;">Qtd. Acum</th>
                        <th style="width: 35px; text-align: center;">Unid</th>
                        <th style="width: 55px; text-align: right;">Peso Unit</th>
                        <th style="width: 55px; text-align: right;">Peso Tot</th>
                        <th style="width: 65px; text-align: right;">Tempo Fabr.</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- RODAPÉ TÉCNICO COM VISTOS DE ENGENHARIA E PCP -->
            <div class="rodape-tecnico">
                <div>Documento gerado eletronicamente por SincoWeb PCP & Engenharia Industrial.</div>
                <div class="assinaturas">
                    <div class="linha-assinatura">
                        <div class="traco"></div>
                        <span>Engenharia de Produto</span>
                    </div>
                    <div class="linha-assinatura">
                        <div class="traco"></div>
                        <span>Planejamento e Controle (PCP)</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '8mm', right: '8mm', bottom: '12mm', left: '8mm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 7px; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 10mm; font-family: sans-serif;">
                    <span>SincoWeb Industrial • Estrutura do Produto: ${estrutura.material.CodMatFabricante}</span>
                    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
                </div>
            `
        });

        await browser.close();
        browser = null;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="BOM_${estrutura.material.CodMatFabricante || 'Estrutura'}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        if (browser) await browser.close();
        console.error('[RelatorioMaterial] Erro ao gerar PDF:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório PDF da estrutura: ' + error.message });
    }
});

module.exports = router;
