const fs = require('fs');
const path = require('path');

const routeContent = `
const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const fs = require('fs');

// Helper to resolve pool
const db = (req) => req.tenantDbPool || req.app.locals.pool;

// Helper to format date
const formatBR = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return \`\${day}/\${month}/\${d.getFullYear()}\`;
};

router.get('/:id/relatorio/excel', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = db(req);

        // Busca dados da OS, Projeto e Tag
        const [osRows] = await pool.execute(
            \`SELECT o.IdOrdemServico, o.Descricao as OSDescricao, o.DataEmissao, o.EnderecoOrdemServico,
                    t.Tag, t.Descricao as TagDescricao, t.DataPrevisao,
                    p.Projeto, p.Descricao as ProjetoDescricao
             FROM ordemservico o
             LEFT JOIN tags t ON o.IdTag = t.IdTag
             LEFT JOIN projetos p ON o.IdProjeto = p.IdProjeto
             WHERE o.IdOrdemServico = ?\`,
            [id]
        );

        if (osRows.length === 0) {
            return res.status(404).json({ success: false, message: 'OS não encontrada' });
        }

        const os = osRows[0];

        // Busca os itens da OS e suas quantidades processadas
        // Subquery para material_processo, buscando a quantidade máxima planejada e executada por material
        const [itemRows] = await pool.execute(
            \`SELECT i.IdOrdemServicoItem, i.IdMaterial, i.CodDesenhoProduto, i.DescricaoProduto, i.Qtde, i.Fator, i.PesoTotal,
                    COALESCE(mp.MaxTotalExecutado, 0) as TotalExecutado,
                    COALESCE(mp.MaxTotalExecutar, i.Qtde) as TotalExecutar
             FROM ordemservicoitem i
             LEFT JOIN (
                 SELECT IdMaterial, MAX(TotalExecutado) as MaxTotalExecutado, MAX(TotalExecutar) as MaxTotalExecutar
                 FROM material_processo
                 WHERE IdOrdemServico = ?
                 GROUP BY IdMaterial
             ) mp ON i.IdMaterial = mp.IdMaterial
             WHERE i.IdOrdemServico = ?\`,
            [id, id]
        );

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Relatório OS');

        // Estilos
        const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134A41' } }; // Sinco dark green

        // Cabeçalho da OS
        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = \`RELATÓRIO DE ORDEM DE SERVIÇO - OS_\${String(os.IdOrdemServico).padStart(5, '0')}\`;
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = headerFill;
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        sheet.addRow(['Projeto:', \`\${os.Projeto} - \${os.ProjetoDescricao || ''}\`, '', '', 'Data Emissão:', formatBR(os.DataEmissao)]);
        sheet.addRow(['Tag:', \`\${os.Tag} - \${os.TagDescricao || ''}\`, '', '', 'Previsão:', formatBR(os.DataPrevisao)]);
        sheet.addRow(['Descrição OS:', os.OSDescricao, '', '', 'Endereço:', os.EnderecoOrdemServico]);
        
        sheet.addRow([]); // Pulo de linha

        // Cabeçalho dos Itens
        const headerRow = sheet.addRow([
            'Cód. Desenho', 'Descrição do Produto', 'Fator', 'Qtde OS', 'Peso Total', 'Qtde a Executar', 'Qtde Executada', 'Progresso'
        ]);

        headerRow.eachCell(cell => {
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Adiciona itens
        itemRows.forEach(item => {
            const progresso = item.TotalExecutar > 0 ? (item.TotalExecutado / item.TotalExecutar) : 0;
            const row = sheet.addRow([
                item.CodDesenhoProduto,
                item.DescricaoProduto,
                item.Fator,
                item.Qtde,
                item.PesoTotal,
                item.TotalExecutar,
                item.TotalExecutado,
                progresso
            ]);
            row.getCell(8).numFmt = '0.00%';
        });

        // Ajusta larguras
        sheet.columns = [
            { width: 20 }, { width: 50 }, { width: 10 }, { width: 10 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
        ];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', \`attachment; filename=OS_\${id}_Relatorio.xlsx\`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Erro Excel OS:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório Excel' });
    }
});

router.get('/:id/relatorio/pdf', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = db(req);

        const [osRows] = await pool.execute(
            \`SELECT o.IdOrdemServico, o.Descricao as OSDescricao, o.DataEmissao, o.EnderecoOrdemServico,
                    t.Tag, t.Descricao as TagDescricao, t.DataPrevisao,
                    p.Projeto, p.Descricao as ProjetoDescricao
             FROM ordemservico o
             LEFT JOIN tags t ON o.IdTag = t.IdTag
             LEFT JOIN projetos p ON o.IdProjeto = p.IdProjeto
             WHERE o.IdOrdemServico = ?\`,
            [id]
        );

        if (osRows.length === 0) {
            return res.status(404).json({ success: false, message: 'OS não encontrada' });
        }

        const os = osRows[0];

        const [itemRows] = await pool.execute(
            \`SELECT i.IdOrdemServicoItem, i.IdMaterial, i.CodDesenhoProduto, i.DescricaoProduto, i.Qtde, i.Fator, i.PesoTotal,
                    COALESCE(mp.MaxTotalExecutado, 0) as TotalExecutado,
                    COALESCE(mp.MaxTotalExecutar, i.Qtde) as TotalExecutar
             FROM ordemservicoitem i
             LEFT JOIN (
                 SELECT IdMaterial, MAX(TotalExecutado) as MaxTotalExecutado, MAX(TotalExecutar) as MaxTotalExecutar
                 FROM material_processo
                 WHERE IdOrdemServico = ?
                 GROUP BY IdMaterial
             ) mp ON i.IdMaterial = mp.IdMaterial
             WHERE i.IdOrdemServico = ?\`,
            [id, id]
        );

        let itemsHtml = '';
        itemRows.forEach(item => {
            const progresso = item.TotalExecutar > 0 ? Math.min(100, Math.round((item.TotalExecutado / item.TotalExecutar) * 100)) : 0;
            itemsHtml += \`
                <tr>
                    <td>\${item.CodDesenhoProduto || '-'}</td>
                    <td>\${item.DescricaoProduto || '-'}</td>
                    <td class="text-center">\${item.Fator || 1}</td>
                    <td class="text-center">\${item.Qtde || 0}</td>
                    <td class="text-center">\${item.PesoTotal || 0}</td>
                    <td class="text-center">\${item.TotalExecutar}</td>
                    <td class="text-center">\${item.TotalExecutado}</td>
                    <td class="text-center">
                        <div class="progress-bar-container">
                            <div class="progress-bar \${progresso === 100 ? 'bg-green' : 'bg-gold'}" style="width: \${progresso}%"></div>
                        </div>
                        <span class="progress-text">\${progresso}%</span>
                    </td>
                </tr>
            \`;
        });

        const html = \`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Roboto', 'Inter', sans-serif; margin: 0; padding: 20px; color: #333; font-size: 12px; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #134A41; padding-bottom: 15px; margin-bottom: 20px; }
                .header-left { width: 70%; }
                .header-right { width: 30%; text-align: right; }
                h1 { color: #134A41; margin: 0 0 10px 0; font-size: 20px; text-transform: uppercase; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
                .info-box { background: #f8f9fa; border-left: 4px solid #F1B52F; padding: 10px; }
                .info-box span { font-weight: bold; color: #134A41; display: block; margin-bottom: 5px; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background-color: #134A41; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
                td { padding: 8px; border-bottom: 1px solid #eee; }
                tr:nth-child(even) { background-color: #fcfcfc; }
                .text-center { text-align: center; }
                .progress-bar-container { background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 3px; }
                .progress-bar { height: 100%; }
                .bg-green { background-color: #22c55e; }
                .bg-gold { background-color: #F1B52F; }
                .progress-text { font-size: 10px; color: #666; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-left">
                    <h1>Ordem de Serviço: OS_\${String(os.IdOrdemServico).padStart(5, '0')}</h1>
                    <div><strong>Descrição:</strong> \${os.OSDescricao || '-'}</div>
                </div>
                <div class="header-right">
                    <div><strong>Data de Emissão:</strong><br>\${formatBR(os.DataEmissao)}</div>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-box">
                    <span>PROJETO</span>
                    \${os.Projeto} - \${os.ProjetoDescricao || ''}
                </div>
                <div class="info-box">
                    <span>TAG / PREVISÃO</span>
                    \${os.Tag} - \${os.TagDescricao || ''} <br>
                    Previsão: \${formatBR(os.DataPrevisao)}
                </div>
            </div>

            <h3 style="color: #134A41; margin-bottom: 10px;">Itens da Ordem de Serviço</h3>
            <table>
                <thead>
                    <tr>
                        <th>Cod. Desenho</th>
                        <th>Descrição do Produto</th>
                        <th class="text-center">Fator</th>
                        <th class="text-center">Qtde OS</th>
                        <th class="text-center">Peso(kg)</th>
                        <th class="text-center">A Executar</th>
                        <th class="text-center">Executado</th>
                        <th class="text-center" style="width: 80px;">Progresso</th>
                    </tr>
                </thead>
                <tbody>
                    \${itemsHtml}
                </tbody>
            </table>
        </body>
        </html>
        \`;

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }, printBackground: true });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', \`attachment; filename=OS_\${id}_Relatorio.pdf\`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Erro PDF OS:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório PDF' });
    }
});

module.exports = router;
`;

fs.writeFileSync(path.join(__dirname, 'src', 'routes', 'relatorioOs.js'), routeContent);
console.log('src/routes/relatorioOs.js criado com sucesso!');

// Agora injetar o router no server.js
const serverFile = path.join(__dirname, 'src', 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

const regexListen = /app\.listen\([^)]+\)\s*{/g;
if (!serverContent.includes('./routes/relatorioOs')) {
    serverContent = serverContent.replace(regexListen, (match) => {
        return `// Rota de relatórios de OS adicionada dinamicamente
app.use('/api/ordemservico', tenantMiddleware, require('./routes/relatorioOs'));

${match}`;
    });
    fs.writeFileSync(serverFile, serverContent);
    console.log('server.js modificado para usar relatorioOs.js');
} else {
    console.log('server.js já contém o import de relatorioOs.js');
}
