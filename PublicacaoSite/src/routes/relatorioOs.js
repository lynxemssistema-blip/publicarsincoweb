const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');

// Helper to resolve pool
const db = (req) => req.tenantDbPool || req.app.locals.pool;

// Helper to format date
const formatBR = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
};

// Helper to format full date and time in Brasília timezone
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

// Helper to query company information
const getEmpresaInfo = async (pool, idEmpresa) => {
    let empresa = null;
    try {
        const [empRows] = await pool.execute(
            `SELECT pj.RazaoSocial, pj.NomeFantasia, pj.Cnpj, pj.InscricaoEstadual, pj.Telefone, pj.Email,
                    pj.Cidade, pj.Estado, pj.EnderecoLogo, pj.Endereco, pj.Numero, pj.Bairro, pj.Cep
             FROM pessoajuridica pj
             WHERE (pj.D_E_L_E_T_E IS NULL OR pj.D_E_L_E_T_E != '*')
               AND (? IS NULL OR pj.IdPessoa = ? OR pj.IdPessoa = 1)
             ORDER BY (pj.IdPessoa = ?) DESC, pj.IdPessoa ASC
             LIMIT 1`,
            [idEmpresa || null, idEmpresa || 0, idEmpresa || 0]
        );
        if (empRows.length > 0) empresa = empRows[0];
    } catch (e) {
        console.warn('Aviso: Não foi possível carregar dados da empresa:', e.message);
    }

    return {
        razaoSocial: empresa?.RazaoSocial || 'SINCO INDÚSTRIA E COMÉRCIO LTDA',
        nomeFantasia: empresa?.NomeFantasia || 'SINCO ESTRUTURAS METÁLICAS',
        cnpj: empresa?.Cnpj || '00.000.000/0001-00',
        ie: empresa?.InscricaoEstadual || '-',
        endereco: empresa ? [empresa.Endereco, empresa.Numero, empresa.Bairro].filter(Boolean).join(', ') : 'Área Industrial',
        cidadeUf: empresa ? [empresa.Cidade, empresa.Estado].filter(Boolean).join(' - ') : 'Brasil',
        contato: [empresa?.Telefone, empresa?.Email].filter(Boolean).join(' | ') || '-'
    };
};

// ==========================================
// ROTA 1: RELATÓRIO EXCEL (EXCELJS)
// ==========================================
router.get('/:id/relatorio/excel', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = db(req);

        // Busca dados da OS, Projeto e Tag
        const [osRows] = await pool.execute(
            `SELECT o.IdOrdemServico, o.Descricao as OSDescricao, o.DataCriacao, o.EnderecoOrdemServico,
                    o.CriadoPor, o.Estatus, o.Fator, o.IdEmpresa, o.DescEmpresa,
                    t.Tag, t.DescTag as TagDescricao, t.DataPrevisao,
                    p.Projeto, p.DescProjeto as ProjetoDescricao
             FROM ordemservico o
             LEFT JOIN tags t ON o.IdTag = t.IdTag
             LEFT JOIN projetos p ON o.IdProjeto = p.IdProjeto
             WHERE o.IdOrdemServico = ?`,
            [id]
        );

        if (osRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ordem de Serviço não encontrada' });
        }

        const os = osRows[0];
        const empresa = await getEmpresaInfo(pool, os.IdEmpresa);
        const usuarioEmissor = req.user?.nomeCompleto || req.user?.nome || req.user?.login || req.query?.usuario || os.CriadoPor || 'Sistema';
        const dataHoraEmissao = formatDataHoraBR();

        // Busca os itens da OS e quantidades
        const [itemRows] = await pool.execute(
            `SELECT i.IdOrdemServicoItem, i.IdMaterial, i.CodMatFabricante as CodDesenhoProduto,
                    i.DescResumo as DescricaoProduto, i.qtde as Qtde, i.Fator, i.Peso as PesoTotal,
                    COALESCE(mp.MaxTotalExecutado, 0) as TotalExecutado,
                    COALESCE(mp.MaxTotalExecutar, i.Qtde) as TotalExecutar
             FROM ordemservicoitem i
             LEFT JOIN (
                 SELECT IdMaterial, MAX(TotalExecutado) as MaxTotalExecutado, MAX(TotalExecutar) as MaxTotalExecutar
                 FROM material_processo
                 WHERE IdOrdemServico = ?
                 GROUP BY IdMaterial
             ) mp ON i.IdMaterial = mp.IdMaterial
             WHERE i.IdOrdemServico = ?`,
            [id, id]
        );

        // Função recursiva para buscar a BOM de um material
        const getBomRecursive = async (idMaterial, qtdePai = 1, nivel = 0, visitados = new Set()) => {
            if (visitados.has(idMaterial)) return [];
            visitados.add(idMaterial);
            
            const [filhos] = await pool.execute(
                `SELECT m.IdMaterial, m.CodMatFabricante as CodDesenhoProduto, m.DescResumo as DescricaoProduto,
                        m.Fator, mp.QtdeUnitaria, m.Peso, m.AreaPintura
                 FROM montapeca mp
                 JOIN material m ON mp.IdMaterialPeca = m.IdMaterial
                 WHERE mp.IdMaterial = ? AND mp.D_E_L_E_T_E IS NULL AND m.D_E_L_E_T_E IS NULL`,
                [idMaterial]
            );

            let bom = [];
            for (const filho of filhos) {
                const qtdeTotalFilho = (parseFloat(filho.QtdeUnitaria) || 0) * qtdePai;
                bom.push({
                    Nivel: nivel + 1,
                    IdMaterial: filho.IdMaterial,
                    CodDesenhoProduto: filho.CodDesenhoProduto || '-',
                    DescricaoProduto: filho.DescricaoProduto || '-',
                    Fator: filho.Fator || 1,
                    QtdeUnitaria: parseFloat(filho.QtdeUnitaria) || 0,
                    QtdeTotal: qtdeTotalFilho,
                    PesoUnitario: parseFloat(filho.Peso) || 0,
                    PesoTotal: (parseFloat(filho.Peso) || 0) * qtdeTotalFilho
                });

                const subBom = await getBomRecursive(filho.IdMaterial, qtdeTotalFilho, nivel + 1, new Set(visitados));
                bom = bom.concat(subBom);
            }
            return bom;
        };

        // Monta a lista expandida
        const expandedItems = [];
        for (const item of itemRows) {
            expandedItems.push({
                Nivel: 0,
                ...item,
                IsPrincipal: true
            });
            if (item.IdMaterial) {
                const bom = await getBomRecursive(item.IdMaterial, item.Qtde, 0);
                expandedItems.push(...bom);
            }
        }

        const prodPrincipal = itemRows.find(i => i.IsPrincipal || true) || {};

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Ordem de Produção', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
        });

        // Configuração de impressão A4 Paisagem
        sheet.pageSetup = {
            orientation: 'landscape',
            paperSize: 9, // A4
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printTitlesRow: '1:6'
        };

        const borderThin = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };

        // Preenche linhas 1 a 4 (Carimbo Técnico em 3 Blocos)
        // BLOCO ESQUERDO: EMPRESA (A1:C4)
        sheet.mergeCells('A1:C1');
        const cA1 = sheet.getCell('A1');
        cA1.value = empresa.nomeFantasia.toUpperCase();
        cA1.font = { bold: true, size: 11, color: { argb: 'FF134A41' } };
        cA1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('A2:C2');
        const cA2 = sheet.getCell('A2');
        cA2.value = empresa.razaoSocial;
        cA2.font = { bold: true, size: 8.5, color: { argb: 'FF334155' } };
        cA2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cA2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('A3:C3');
        const cA3 = sheet.getCell('A3');
        cA3.value = `CNPJ: ${empresa.cnpj} | IE: ${empresa.ie}`;
        cA3.font = { size: 8, color: { argb: 'FF64748B' } };
        cA3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cA3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        sheet.mergeCells('A4:C4');
        const cA4 = sheet.getCell('A4');
        cA4.value = `${empresa.endereco} - ${empresa.cidadeUf}`;
        cA4.font = { size: 7.5, color: { argb: 'FF64748B' } };
        cA4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cA4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        // BLOCO CENTRAL: DOCUMENTO & OP (D1:H4)
        sheet.mergeCells('D1:H1');
        const cD1 = sheet.getCell('D1');
        cD1.value = 'ORDEM DE PRODUÇÃO & ESTRUTURA DE PRODUTO (BOM)';
        cD1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cD1.alignment = { vertical: 'middle', horizontal: 'center' };
        cD1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134A41' } };

        sheet.mergeCells('D2:H2');
        const cD2 = sheet.getCell('D2');
        cD2.value = `OP / OS Nº: OS_${String(os.IdOrdemServico).padStart(5, '0')}   |   Status: ${(os.Estatus || 'LIBERADA').toUpperCase()}   |   Fator: ${os.Fator || 1}`;
        cD2.font = { bold: true, size: 9.5, color: { argb: 'FF134A41' } };
        cD2.alignment = { vertical: 'middle', horizontal: 'center' };
        cD2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

        sheet.mergeCells('D3:H3');
        const cD3 = sheet.getCell('D3');
        cD3.value = `Projeto: ${os.Projeto || '-'} - ${os.ProjetoDescricao || ''}   |   Tag: ${os.Tag || '-'} - ${os.TagDescricao || ''}`;
        cD3.font = { size: 8.5, color: { argb: 'FF334155' } };
        cD3.alignment = { vertical: 'middle', horizontal: 'center' };
        cD3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

        sheet.mergeCells('D4:H4');
        const cD4 = sheet.getCell('D4');
        cD4.value = `Produto Principal: ${prodPrincipal.CodDesenhoProduto || '-'} - ${prodPrincipal.DescricaoProduto || os.OSDescricao || '-'} (Qtd: ${prodPrincipal.Qtde || 1})`;
        cD4.font = { bold: true, size: 8.5, color: { argb: 'FF1E293B' } };
        cD4.alignment = { vertical: 'middle', horizontal: 'center' };
        cD4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

        // BLOCO DIREITO: RASTREABILIDADE & EMISSÃO (I1:K4)
        sheet.mergeCells('I1:K1');
        const cI1 = sheet.getCell('I1');
        cI1.value = 'DOC. TÉCNICO: DOC-OP-SGQ-01';
        cI1.font = { bold: true, size: 9, color: { argb: 'FF1E293B' } };
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
        cI4.value = `Previsão de Entrega: ${formatBR(os.DataPrevisao)}`;
        cI4.font = { bold: true, size: 8, color: { argb: 'FF134A41' } };
        cI4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cI4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        // Aplica bordas em todas as células do carimbo (Linhas 1 a 4, colunas A a K)
        for (let r = 1; r <= 4; r++) {
            sheet.getRow(r).height = 19;
            for (let c = 1; c <= 11; c++) {
                const cell = sheet.getRow(r).getCell(c);
                cell.border = borderThin;
            }
        }

        // Linha 5: Espaçador
        sheet.getRow(5).height = 8;

        // Linha 6: Cabeçalho da Tabela de Itens / BOM
        const headerRow = sheet.getRow(6);
        headerRow.height = 24;
        headerRow.values = [
            'Nível', 'Cód. Desenho', 'Descrição do Produto', 'Fator',
            'Qtde Unit', 'Qtde Total', 'Peso Unit (kg)', 'Peso Total (kg)',
            'A Executar', 'Executado', 'Progresso'
        ];

        headerRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134A41' } };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF0F3D35' } },
                bottom: { style: 'medium', color: { argb: 'FF0F3D35' } },
                left: { style: 'thin', color: { argb: 'FF0F3D35' } },
                right: { style: 'thin', color: { argb: 'FF0F3D35' } }
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: [1, 4, 11].includes(colNumber) ? 'center' : [5, 6, 7, 8, 9, 10].includes(colNumber) ? 'right' : 'left'
            };
        });

        // Linhas de dados
        let rowIndex = 7;
        expandedItems.forEach((item, idx) => {
            let progresso = 0;
            if (item.IsPrincipal) {
                progresso = item.TotalExecutar > 0 ? (item.TotalExecutado / item.TotalExecutar) : 0;
            }

            const row = sheet.getRow(rowIndex);
            row.height = 18;

            const nivelFormatado = item.Nivel === 0 ? 'Principal' : `${'  '.repeat(item.Nivel)}↳ L${item.Nivel}`;

            row.values = [
                nivelFormatado,
                item.CodDesenhoProduto,
                item.DescricaoProduto,
                item.Fator || 1,
                item.QtdeUnitaria || (item.IsPrincipal ? 1 : 0),
                item.QtdeTotal || item.Qtde || 0,
                item.PesoUnitario || 0,
                item.PesoTotal || 0,
                item.IsPrincipal ? Number(item.TotalExecutar) : '-',
                item.IsPrincipal ? Number(item.TotalExecutado) : '-',
                item.IsPrincipal ? progresso : '-'
            ];

            const isEven = idx % 2 === 0;
            const bgFill = item.IsPrincipal
                ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
                : isEven ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.fill = bgFill;
                cell.border = borderThin;
                cell.font = {
                    name: 'Segoe UI',
                    size: 8.5,
                    bold: item.IsPrincipal,
                    color: { argb: item.IsPrincipal ? 'FF0F172A' : 'FF334155' }
                };

                // Alinhamento e formatação por tipo de coluna
                if (colNumber === 1) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                } else if (colNumber === 2) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.numFmt = '@'; // Texto
                } else if (colNumber === 3) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                } else if (colNumber === 4) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else if ([5, 6].includes(colNumber)) {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = '#,##0.00';
                } else if ([7, 8].includes(colNumber)) {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = '#,##0.00';
                } else if ([9, 10].includes(colNumber)) {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
                } else if (colNumber === 11) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    if (typeof cell.value === 'number') cell.numFmt = '0.0%';
                }
            });

            rowIndex++;
        });

        // Larguras otimizadas das colunas
        sheet.columns = [
            { width: 14 }, // Nível
            { width: 22 }, // Cód. Desenho
            { width: 46 }, // Descrição do Produto
            { width: 9 },  // Fator
            { width: 12 }, // Qtde Unit
            { width: 12 }, // Qtde Total
            { width: 14 }, // Peso Unit
            { width: 14 }, // Peso Total
            { width: 13 }, // A Executar
            { width: 13 }, // Executado
            { width: 13 }  // Progresso
        ];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=OS_${id}_Ordem_Producao_BOM.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Erro Excel OS:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório Excel: ' + error.message });
    }
});

// ==========================================
// ROTA 2: RELATÓRIO PDF (PUPPETEER)
// ==========================================
router.get('/:id/relatorio/pdf', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = db(req);

        const [osRows] = await pool.execute(
            `SELECT o.IdOrdemServico, o.Descricao as OSDescricao, o.DataCriacao, o.EnderecoOrdemServico,
                    o.CriadoPor, o.Estatus, o.Fator, o.IdEmpresa, o.DescEmpresa,
                    t.Tag, t.DescTag as TagDescricao, t.DataPrevisao,
                    p.Projeto, p.DescProjeto as ProjetoDescricao
             FROM ordemservico o
             LEFT JOIN tags t ON o.IdTag = t.IdTag
             LEFT JOIN projetos p ON o.IdProjeto = p.IdProjeto
             WHERE o.IdOrdemServico = ?`,
            [id]
        );

        if (osRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ordem de Serviço não encontrada' });
        }

        const os = osRows[0];
        const empresa = await getEmpresaInfo(pool, os.IdEmpresa);
        const usuarioEmissor = req.user?.nomeCompleto || req.user?.nome || req.user?.login || req.query?.usuario || os.CriadoPor || 'Sistema';
        const dataHoraEmissao = formatDataHoraBR();

        const [itemRows] = await pool.execute(
            `SELECT i.IdOrdemServicoItem, i.IdMaterial, i.CodMatFabricante as CodDesenhoProduto,
                    i.DescResumo as DescricaoProduto, i.qtde as Qtde, i.Fator, i.Peso as PesoTotal,
                    COALESCE(mp.MaxTotalExecutado, 0) as TotalExecutado,
                    COALESCE(mp.MaxTotalExecutar, i.Qtde) as TotalExecutar
             FROM ordemservicoitem i
             LEFT JOIN (
                 SELECT IdMaterial, MAX(TotalExecutado) as MaxTotalExecutado, MAX(TotalExecutar) as MaxTotalExecutar
                 FROM material_processo
                 WHERE IdOrdemServico = ?
                 GROUP BY IdMaterial
             ) mp ON i.IdMaterial = mp.IdMaterial
             WHERE i.IdOrdemServico = ?`,
            [id, id]
        );

        // Função recursiva para buscar a BOM de um material (PDF)
        const getBomRecursivePdf = async (idMaterial, qtdePai = 1, nivel = 0, visitados = new Set()) => {
            if (visitados.has(idMaterial)) return [];
            visitados.add(idMaterial);
            
            const [filhos] = await pool.execute(
                `SELECT m.IdMaterial, m.CodMatFabricante as CodDesenhoProduto, m.DescResumo as DescricaoProduto,
                        m.Fator, mp.QtdeUnitaria, m.Peso
                 FROM montapeca mp
                 JOIN material m ON mp.IdMaterialPeca = m.IdMaterial
                 WHERE mp.IdMaterial = ? AND mp.D_E_L_E_T_E IS NULL AND m.D_E_L_E_T_E IS NULL`,
                [idMaterial]
            );

            let bom = [];
            for (const filho of filhos) {
                const qtdeTotalFilho = (parseFloat(filho.QtdeUnitaria) || 0) * qtdePai;
                bom.push({
                    Nivel: nivel + 1,
                    IdMaterial: filho.IdMaterial,
                    CodDesenhoProduto: filho.CodDesenhoProduto || '-',
                    DescricaoProduto: filho.DescricaoProduto || '-',
                    Fator: filho.Fator || 1,
                    QtdeUnitaria: parseFloat(filho.QtdeUnitaria) || 0,
                    QtdeTotal: qtdeTotalFilho,
                    PesoUnitario: parseFloat(filho.Peso) || 0,
                    PesoTotal: (parseFloat(filho.Peso) || 0) * qtdeTotalFilho
                });

                const subBom = await getBomRecursivePdf(filho.IdMaterial, qtdeTotalFilho, nivel + 1, new Set(visitados));
                bom = bom.concat(subBom);
            }
            return bom;
        };

        const expandedItems = [];
        for (const item of itemRows) {
            expandedItems.push({
                Nivel: 0,
                ...item,
                IsPrincipal: true
            });
            if (item.IdMaterial) {
                const bom = await getBomRecursivePdf(item.IdMaterial, item.Qtde, 0);
                expandedItems.push(...bom);
            }
        }

        const prodPrincipal = itemRows.find(i => i.IsPrincipal || true) || {};

        let itemsHtml = '';
        expandedItems.forEach((item, idx) => {
            if (item.IsPrincipal) {
                const progresso = item.TotalExecutar > 0 ? Math.min(100, Math.round((item.TotalExecutado / item.TotalExecutar) * 100)) : 0;
                itemsHtml += `
                    <tr class="row-principal">
                        <td class="text-center"><span class="badge-principal">PRINCIPAL</span></td>
                        <td class="font-mono font-bold">${item.CodDesenhoProduto || '-'}</td>
                        <td class="font-bold">${item.DescricaoProduto || '-'}</td>
                        <td class="text-center">${item.Fator || 1}</td>
                        <td class="text-right">1.00</td>
                        <td class="text-right font-bold">${Number(item.Qtde || 0).toFixed(2)}</td>
                        <td class="text-right">${Number(item.PesoTotal || 0).toFixed(2)}</td>
                        <td class="text-right font-bold">${Number(item.TotalExecutar || 0).toFixed(2)}</td>
                        <td class="text-right font-bold text-emerald">${Number(item.TotalExecutado || 0).toFixed(2)}</td>
                        <td class="text-center">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progresso}%;"></div>
                            </div>
                            <span class="progress-text">${progresso}%</span>
                        </td>
                    </tr>
                `;
            } else {
                itemsHtml += `
                    <tr class="row-subnivel ${idx % 2 === 0 ? 'bg-even' : ''}">
                        <td style="padding-left: ${6 + (item.Nivel * 10)}px;" class="text-level">
                            ↳ L${item.Nivel}
                        </td>
                        <td class="font-mono text-code">${item.CodDesenhoProduto || '-'}</td>
                        <td class="text-desc">${item.DescricaoProduto || '-'}</td>
                        <td class="text-center text-muted">${item.Fator || 1}</td>
                        <td class="text-right">${Number(item.QtdeUnitaria || 0).toFixed(2)}</td>
                        <td class="text-right font-semibold">${Number(item.QtdeTotal || 0).toFixed(2)}</td>
                        <td class="text-right text-muted">${Number(item.PesoTotal || 0).toFixed(2)}</td>
                        <td class="text-center text-muted">-</td>
                        <td class="text-center text-muted">-</td>
                        <td class="text-center text-muted">-</td>
                    </tr>
                `;
            }
        });

        const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Ordem de Produção - OS_${String(os.IdOrdemServico).padStart(5, '0')}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 8mm 8mm 12mm 8mm;
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

                /* CARIMBO TÉCNICO INDUSTRIAL (ISO 9001 / SGQ) */
                .carimbo-tecnico {
                    display: flex;
                    border: 1.5px solid #134A41;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                    background: #ffffff;
                }

                /* BLOCO ESQUERDO: DADOS DA EMPRESA */
                .bloco-empresa {
                    width: 29%;
                    border-right: 1.5px solid #134A41;
                    padding: 6px 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    background: #f8fafc;
                }
                .empresa-nome {
                    font-size: 11px;
                    font-weight: 800;
                    color: #134A41;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                .empresa-razao {
                    font-size: 8px;
                    font-weight: 600;
                    color: #334155;
                    margin-top: 2px;
                }
                .empresa-dados {
                    font-size: 7.5px;
                    color: #64748b;
                    margin-top: 3px;
                    line-height: 1.35;
                }

                /* BLOCO CENTRAL: DADOS DA OP E PROJETO */
                .bloco-documento {
                    width: 45%;
                    border-right: 1.5px solid #134A41;
                    display: flex;
                    flex-direction: column;
                }
                .doc-titulo {
                    background: #134A41;
                    color: #ffffff;
                    font-size: 10.5px;
                    font-weight: 800;
                    text-align: center;
                    padding: 4px 6px;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                }
                .doc-subcabecalho {
                    background: #f1f5f9;
                    border-bottom: 1px solid #cbd5e1;
                    padding: 3px 8px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 8.5px;
                }
                .doc-subcabecalho strong { color: #134A41; }
                .doc-metadados {
                    padding: 4px 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 2.5px;
                    font-size: 8px;
                    line-height: 1.3;
                    color: #334155;
                }

                /* BLOCO DIREITO: AUDITORIA E RASTREABILIDADE */
                .bloco-rastreabilidade {
                    width: 26%;
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc;
                }
                .rastreio-topo {
                    background: #e2e8f0;
                    color: #0f172a;
                    font-weight: 700;
                    text-align: center;
                    padding: 4px;
                    font-size: 8.5px;
                    border-bottom: 1px solid #cbd5e1;
                    letter-spacing: 0.5px;
                }
                .rastreio-corpo {
                    padding: 5px 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    font-size: 8px;
                    color: #475569;
                    flex: 1;
                    justify-content: center;
                }
                .rastreio-corpo strong { color: #0f172a; }

                /* TABELA DE COMPONENTES / BOM */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 2px;
                    font-size: 8px;
                }
                thead {
                    display: table-header-group;
                }
                tr {
                    page-break-inside: avoid;
                }
                th {
                    background-color: #134A41;
                    color: #ffffff;
                    padding: 4.5px 5px;
                    font-size: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    border: 1px solid #0f3d35;
                }
                td {
                    padding: 3.5px 5px;
                    border: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .row-principal {
                    background-color: #f1f5f9;
                    font-size: 8.5px;
                    border-bottom: 1.5px solid #94a3b8;
                }
                .row-subnivel {
                    color: #334155;
                }
                .bg-even {
                    background-color: #f8fafc;
                }
                .badge-principal {
                    background: #134A41;
                    color: #ffffff;
                    font-size: 7px;
                    font-weight: 800;
                    padding: 1.5px 4px;
                    border-radius: 2px;
                    letter-spacing: 0.5px;
                }
                .font-mono {
                    font-family: 'Courier New', Courier, monospace;
                }
                .font-bold { font-weight: 700; }
                .font-semibold { font-weight: 600; }
                .text-code {
                    font-weight: 700;
                    color: #0f172a;
                }
                .text-desc { color: #334155; }
                .text-muted { color: #94a3b8; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-emerald { color: #059669; }
                .text-level {
                    font-weight: 600;
                    color: #2563eb;
                }

                /* PROGRESS BAR */
                .progress-bar-container {
                    background: #e2e8f0;
                    height: 5px;
                    border-radius: 2.5px;
                    overflow: hidden;
                    margin-bottom: 1.5px;
                }
                .progress-bar {
                    height: 100%;
                    background: #10b981;
                }
                .progress-text {
                    font-size: 7.5px;
                    color: #475569;
                    font-weight: 700;
                }

                /* RODAPÉ DE VISTO & AUDITORIA TÉCNICA */
                .rodape-tecnico {
                    margin-top: 10px;
                    page-break-inside: avoid;
                    border-top: 1px solid #134A41;
                    padding-top: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 7.5px;
                    color: #475569;
                }
                .assinatura-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 30%;
                }
                .assinatura-linha {
                    width: 80%;
                    border-bottom: 1px solid #94a3b8;
                    margin-bottom: 3px;
                }
            </style>
        </head>
        <body>
            <!-- CARIMBO TÉCNICO INDUSTRIAL (3 BLOCOS) -->
            <div class="carimbo-tecnico">
                <!-- BLOCO 1: EMPRESA -->
                <div class="bloco-empresa">
                    <div class="empresa-nome">${empresa.nomeFantasia}</div>
                    <div class="empresa-razao">${empresa.razaoSocial}</div>
                    <div class="empresa-dados">
                        <div>CNPJ: <strong>${empresa.cnpj}</strong> | IE: ${empresa.ie}</div>
                        <div>${empresa.endereco} - ${empresa.cidadeUf}</div>
                        <div>Contato: ${empresa.contato}</div>
                    </div>
                </div>

                <!-- BLOCO 2: DADOS DA OP E PROJETO -->
                <div class="bloco-documento">
                    <div class="doc-titulo">Ordem de Produção & Estrutura de Produto (BOM)</div>
                    <div class="doc-subcabecalho">
                        <span>OP / OS Nº: <strong class="font-mono">OS_${String(os.IdOrdemServico).padStart(5, '0')}</strong></span>
                        <span>Status: <strong>${(os.Estatus || 'LIBERADA').toUpperCase()}</strong></span>
                        <span>Fator: <strong>${os.Fator || 1}</strong></span>
                    </div>
                    <div class="doc-metadados">
                        <div><strong>Projeto:</strong> ${os.Projeto || '-'} - ${os.ProjetoDescricao || ''} &bull; <strong>Tag:</strong> ${os.Tag || '-'} - ${os.TagDescricao || ''}</div>
                        <div><strong>Produto Principal:</strong> <span class="font-mono font-bold">${prodPrincipal.CodDesenhoProduto || '-'}</span> - ${prodPrincipal.DescricaoProduto || os.OSDescricao || '-'} (Qtd: <strong>${prodPrincipal.Qtde || 1}</strong>)</div>
                    </div>
                </div>

                <!-- BLOCO 3: RASTREABILIDADE E EMISSÃO -->
                <div class="bloco-rastreabilidade">
                    <div class="rastreio-topo">DOC. TÉCNICO: DOC-OP-SGQ-01</div>
                    <div class="rastreio-corpo">
                        <div><strong>Emitido por:</strong> ${usuarioEmissor}</div>
                        <div><strong>Data/Hora:</strong> ${dataHoraEmissao}</div>
                        <div><strong>Previsão de Entrega:</strong> <span style="color: #134A41; font-weight: 700;">${formatBR(os.DataPrevisao)}</span></div>
                    </div>
                </div>
            </div>

            <!-- TABELA DE ITENS COM THEAD REPETÍVEL -->
            <table>
                <thead>
                    <tr>
                        <th style="width: 7%; text-align: center;">Nível</th>
                        <th style="width: 14%; text-align: center;">Cód. Desenho</th>
                        <th style="width: 33%;">Descrição Técnica do Componente</th>
                        <th style="width: 5%; text-align: center;">Fator</th>
                        <th style="width: 7%; text-align: right;">Qtd. Unit</th>
                        <th style="width: 7%; text-align: right;">Qtd. Total</th>
                        <th style="width: 7%; text-align: right;">Peso (kg)</th>
                        <th style="width: 7%; text-align: right;">A Executar</th>
                        <th style="width: 7%; text-align: right;">Executado</th>
                        <th style="width: 6%; text-align: center;">Progresso</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- VISTO / ASSINATURAS DA QUALIDADE & PCP -->
            <div class="rodape-tecnico">
                <div class="assinatura-item">
                    <div class="assinatura-linha"></div>
                    <div>Planejamento e Controle da Produção (PCP)</div>
                </div>
                <div class="assinatura-item">
                    <div class="assinatura-linha"></div>
                    <div>Engenharia de Produção / Processos</div>
                </div>
                <div class="assinatura-item">
                    <div class="assinatura-linha"></div>
                    <div>Garantia da Qualidade (SGQ)</div>
                </div>
            </div>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            margin: { top: '8mm', right: '8mm', bottom: '12mm', left: '8mm' },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="width: 100%; font-size: 7.5px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #64748b; padding: 0 8mm; display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 2px;">
                    <span>SincoWeb Industrial ERP &bull; Ordem de Produção OS_${String(os.IdOrdemServico).padStart(5, '0')} &bull; Emitido por: ${usuarioEmissor} em ${dataHoraEmissao}</span>
                    <span>Folha <span class="pageNumber"></span> de <span class="totalPages"></span></span>
                </div>
            `
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=OS_${id}_Ordem_Producao_BOM.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Erro PDF OS:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório PDF: ' + error.message });
    }
});

module.exports = router;
