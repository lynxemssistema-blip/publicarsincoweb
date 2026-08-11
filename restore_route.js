const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'src/server.js');
let c = fs.readFileSync(serverFile, 'utf8');

if (!c.includes('/materiais-em-processo')) {
    const route = `
app.get('/api/ordemservico/:id/materiais-em-processo', tenantMiddleware, async (req, res) => {
    try {
        const osId = req.params.id;
        const { idProjeto, idTag } = req.query;

        let sql = \`
            SELECT mp.codmatFabricante, m.DescResumo, mp.TotalExecutar as Qtde,
                   mp.IdProcesso, pf.processofabricacao, mp.TempoSetupMin, mp.TempoPadraoMin, mp.TempoEstimadoMin
            FROM material_processo mp
            LEFT JOIN processofabricacao pf ON mp.IdProcesso = pf.IdProcessoFabricacao
            LEFT JOIN material m ON mp.IdMaterial = m.IdMaterial
            WHERE mp.IdOrdemServico = ? \`;
        const params = [osId];

        if (idProjeto) { sql += \` AND mp.IdProjeto = ?\`; params.push(idProjeto); }
        if (idTag) { sql += \` AND mp.IdTag = ?\`; params.push(idTag); }

        sql += \` ORDER BY mp.codmatFabricante, mp.SequenciaExecucao ASC\`;

        const [rows] = await req.tenantDbPool.execute(sql, params);

        const mats = {};
        for (const r of rows) {
            if (!r.codmatFabricante) continue;
            if (!mats[r.codmatFabricante]) {
                mats[r.codmatFabricante] = {
                    codmatfabricante: r.codmatFabricante,
                    desc: r.DescResumo,
                    qtde: Number(r.Qtde) || 1,
                    recursoTempos: {}
                };
            }
            if (r.processofabricacao) {
                const key = r.processofabricacao.trim().replace(/\\s+/g, '');
                mats[r.codmatFabricante].recursoTempos[key] = {
                    tempoSetup: Number(r.TempoSetupMin || r.TempoEstimadoMin || 0),
                    tempoPadrao: Number(r.TempoPadraoMin || 0),
                    label: r.processofabricacao
                };
            }
        }
        
        res.json({ success: true, data: Object.values(mats) });
    } catch (e) {
        console.error('Erro ao buscar materiais na OS:', e);
        res.status(500).json({ success: false, message: 'Erro', error: e.message });
    }
});
`;
    // Find a good place to inject it. Before '/api/ordemservico/:id/itens-codigos'
    c = c.replace("app.get('/api/ordemservico/:id/itens-codigos', tenantMiddleware", route + "\napp.get('/api/ordemservico/:id/itens-codigos', tenantMiddleware");
    fs.writeFileSync(serverFile, c, 'utf8');
}
console.log('Restored backend route');
