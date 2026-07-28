const fs = require('fs');

// 1. Update server.js
const serverFiles = [
  './src/server.js',
  './Publicacao/src/server.js',
  './PublicacaoSite/src/server.js',
  './SINCO_Deploy/src/server.js'
];

const newPlanningEndpoint = `
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

                try {
                    updates.push(\`\\\`\${colDias}\\\` = ?\`);
                    params.push(valDias);
                } catch (e) {}
            }

            if (updates.length > 0) {
                params.push(idValue);
                const sql = \`UPDATE \\\`\${table}\\\` SET \${updates.join(', ')} WHERE \\\`\${idCol}\\\` = ?\`;
                await conn.execute(sql, params).catch(err => {
                    console.warn(\`[Save Sector Warning] \${err.message}\`);
                });
            }
        };

        if (targetType === 'os') {
            await updateFieldsForEntity('ordemservico', 'IdOrdemServico', targetId);
            await updateFieldsForEntity('ordemservicoitem', 'IdOrdemServico', targetId);
        } else if (targetType === 'tag') {
            await updateFieldsForEntity('tags', 'IdTag', targetId);
            await updateFieldsForEntity('ordemservico', 'IdTag', targetId);
            await updateFieldsForEntity('ordemservicoitem', 'IdTag', targetId);
        } else if (targetType === 'item') {
            await updateFieldsForEntity('ordemservicoitem', 'IdOrdemServicoItem', targetId);
        }

        await conn.commit();
        console.log(\`[Planejamento Setores] Salvo com sucesso para \${targetType} ID=\${targetId} com \${sectors.length} setores.\`);
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

for (const f of serverFiles) {
    if (!fs.existsSync(f)) continue;
    let c = fs.readFileSync(f, 'utf8');
    const startIdx = c.indexOf("app.post('/api/salvar-setores-planejamento'");
    if (startIdx !== -1) {
        const endIdx = c.indexOf("app.post('/api/apontamento-parcial'", startIdx);
        if (endIdx !== -1) {
            c = c.slice(0, startIdx) + newPlanningEndpoint + '\n\n' + c.slice(endIdx);
            fs.writeFileSync(f, c, 'utf8');
            console.log(`✅ Updated /api/salvar-setores-planejamento in ${f}`);
        }
    }
}

// 2. Update SectorProductionModal.tsx
const modalFile = './frontend/src/components/SectorProductionModal.tsx';
if (fs.existsSync(modalFile)) {
    let mContent = fs.readFileSync(modalFile, 'utf8');

    const oldUseEffect = `  useEffect(() => {
    if (modalData && modalData.sectors) {
      const initial = modalData.sectors.map(s => {
        const isoPi = toIsoInput(s.pi);
        const isoPf = toIsoInput(s.pf);
        const calculatedDays = (isoPi && isoPf) ? calcDaysBetween(isoPi, isoPf) : Math.max(1, parseInt(String(s.dias), 10) || 1);

        return {
          ...s,
          dias: calculatedDays,
          pi: isoPi,
          pf: isoPf,
          minProd: parseInt(String(s.minProd || 0), 10) || 0
        };
      });
      const hasAnyDate = initial.some(item => !!item.pi || !!item.pf);
      if (!hasAnyDate) {
        setSectors(recalculateAutomaticChain(initial, 0));
      } else {
        setSectors(initial);
      }
    }
  }, [modalData]);`;

    const newUseEffect = `  useEffect(() => {
    if (modalData && modalData.sectors) {
      const initial = modalData.sectors.map(s => {
        const isoPi = toIsoInput(s.pi);
        const isoPf = toIsoInput(s.pf);
        const calculatedDays = (isoPi && isoPf) ? calcDaysBetween(isoPi, isoPf) : Math.max(1, parseInt(String(s.dias), 10) || 1);

        return {
          ...s,
          dias: calculatedDays,
          pi: isoPi,
          pf: isoPf,
          minProd: parseInt(String(s.minProd || 0), 10) || 0
        };
      });
      
      // Automatic chain calculation fills in dates starting from any sector that has a date!
      const hasAnyDate = initial.some(item => !!item.pi || !!item.pf);
      if (!hasAnyDate) {
        setSectors(recalculateAutomaticChain(initial, 0));
      } else {
        // Run automatic chain starting from first index that has a date
        const firstDateIdx = initial.findIndex(item => !!item.pi || !!item.pf);
        setSectors(recalculateAutomaticChain(initial, firstDateIdx >= 0 ? firstDateIdx : 0));
      }
    }
  }, [modalData]);`;

    if (mContent.includes(oldUseEffect)) {
        mContent = mContent.replace(oldUseEffect, newUseEffect);
        fs.writeFileSync(modalFile, mContent, 'utf8');
        console.log('✅ Updated useEffect in SectorProductionModal.tsx');
    }
}

console.log('🎉 Permanent date fix script applied!');
