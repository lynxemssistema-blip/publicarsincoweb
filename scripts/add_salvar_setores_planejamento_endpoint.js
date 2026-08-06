const fs = require('fs');
const path = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/src/server.js';
let code = fs.readFileSync(path, 'utf8');

const endpointCode = `
// ==========================================
// SALVAR DATAS DE PLANEJAMENTO EM LOTE (PROD SETORES)
// ==========================================
app.put('/api/projetos/:id/datas-planejamento', async (req, res) => {
    try {
        const projetoId = req.params.id;
        const { tagIds, datas } = req.body;

        if (!tagIds || tagIds.length === 0) {
            return res.status(400).json({ error: 'Nenhuma tag informada.' });
        }

        const tagsInClause = tagIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)).join(',');
        if (!tagsInClause) return res.status(400).json({ error: 'IDs de tags inválidos.' });

        const SECTORS_DB = {
          'Corte': { tagTxt: 'txtCORTE', osTxt: 'txtCorte', planIni: 'PlanejadoInicioCorte', planFim: 'PlanejadoFinalCorte' },
          'Dobra': { tagTxt: 'txtDOBRA', osTxt: 'txtDobra', planIni: 'PlanejadoInicioDobra', planFim: 'PlanejadoFinalDobra' },
          'Solda': { tagTxt: 'txtSOLDA', osTxt: 'txtSolda', planIni: 'PlanejadoInicioSolda', planFim: 'PlanejadoFinalSolda' },
          'Pintura': { tagTxt: 'txtPINTURA', osTxt: 'txtPintura', planIni: 'PlanejadoInicioPintura', planFim: 'PlanejadoFinalPintura' },
          'Montagem': { tagTxt: 'txtMONTAGEM', osTxt: 'TxtMontagem', planIni: 'PlanejadoInicioMontagem', planFim: 'PlanejadoFinalMontagem' },
          'Punsionadeira': { tagTxt: 'txtPUNSIONADEIRA', osTxt: 'txtPUNSIONADEIRA', planIni: 'PlanejadoInicioPUNSIONADEIRA', planFim: 'PlanejadoFinalPUNSIONADEIRA' },
          'CorteaLaser': { tagTxt: 'txtCorteaLaser', osTxt: 'txtCorteaLaser', planIni: 'PlanejadoInicioCorteaLaser', planFim: 'PlanejadoFinalCorteaLaser' },
          'Galvanizar': { tagTxt: 'txtGALVANIZAR', osTxt: 'txtGALVANIZAR', planIni: 'PlanejadoInicioGALVANIZAR', planFim: 'PlanejadoFinalGALVANIZAR' }
        };

        const conn = await queryPool.getConnection();
        await conn.beginTransaction();

        try {
            for (const sectorId of Object.keys(datas)) {
                const sec = SECTORS_DB[sectorId];
                if (!sec) continue;
                
                const ini = datas[sectorId].ini;
                const fim = datas[sectorId].fim;
                if (!ini && !fim) continue; 

                const iniFormatted = ini ? ini + ' 00:00:00' : null;
                const fimFormatted = fim ? fim + ' 23:59:59' : null;

                const updateTagsParams = [];
                let setClause = '';
                if (iniFormatted) { setClause += sec.planIni + ' = ?'; updateTagsParams.push(iniFormatted); }
                if (fimFormatted) {
                    if (setClause) setClause += ', ';
                    setClause += sec.planFim + ' = ?';
                    updateTagsParams.push(fimFormatted);
                }

                const queryTags = 'UPDATE tags SET ' + setClause + ' WHERE IdTag IN (' + tagsInClause + ') AND (TRIM(' + sec.tagTxt + ') = "1" OR TRIM(' + sec.tagTxt + ') = "S" OR TRIM(' + sec.tagTxt + ') = "SIM")';
                await conn.query(queryTags, updateTagsParams);

                const queryOSI = 'UPDATE ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico SET ' + setClause.replace(new RegExp(sec.planIni, 'g'), 'osi.' + sec.planIni).replace(new RegExp(sec.planFim, 'g'), 'osi.' + sec.planFim) + ' WHERE os.IdTag IN (' + tagsInClause + ') AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = "" OR os.D_E_L_E_T_E = " ") AND (osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = "" OR osi.D_E_L_E_T_E = " ") AND (TRIM(osi.' + sec.osTxt + ') = "1" OR TRIM(osi.' + sec.osTxt + ') = "S")';
                await conn.query(queryOSI, updateTagsParams);
            }

            await conn.commit();
            res.json({ success: true, message: 'Datas salvas' });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
});
`;

if (!code.includes('/api/projetos/:id/datas-planejamento')) {
    const insertionPoint = code.lastIndexOf('app.listen(');
    if (insertionPoint !== -1) {
        code = code.slice(0, insertionPoint) + endpointCode + '\\n' + code.slice(insertionPoint);
        fs.writeFileSync(path, code);
        
        const gitPath = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/src/server_git.js';
        if (fs.existsSync(gitPath)) {
            let gitCode = fs.readFileSync(gitPath, 'utf8');
            if (!gitCode.includes('/api/projetos/:id/datas-planejamento')) {
                const gitInsertionPoint = gitCode.lastIndexOf('app.listen(');
                if (gitInsertionPoint !== -1) {
                    gitCode = gitCode.slice(0, gitInsertionPoint) + endpointCode + '\\n' + gitCode.slice(gitInsertionPoint);
                    fs.writeFileSync(gitPath, gitCode);
                }
            }
        }
        
        console.log('Added endpoint to server.js');
    }
} else {
    console.log('Endpoint already exists.');
}
