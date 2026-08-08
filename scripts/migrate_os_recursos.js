const db = require('../src/config/db.js');

const RESOURCE_MAP = [
    { id: 1, flag: 'txtCorte', prefix: 'Corte' },
    { id: 2, flag: 'txtDobra', prefix: 'Dobra' },
    { id: 3, flag: 'txtSolda', prefix: 'Solda' },
    { id: 4, flag: 'txtPintura', prefix: 'Pintura' },
    { id: 5, flag: 'TxtMontagem', prefix: 'Montagem' },
    { id: 6, flag: 'txtMEDICAO', prefix: 'MEDICAO' },
    { id: 7, flag: 'txtISOMETRICO', prefix: 'ISOMETRICO' },
    { id: 8, flag: 'txtENGENHARIA', prefix: 'ENGENHARIA' },
    { id: 9, flag: 'txtACABAMENTO', prefix: 'ACABAMENTO' },
    { id: 10, flag: 'txtAPROVACAO', prefix: 'APROVACAO' },
    { id: 13, flag: 'txtCorteaLaser', prefix: 'CorteaLaser' },
    { id: 14, flag: 'txtEMBALAGENS', prefix: 'EMBALAGENS' },
    { id: 15, flag: 'txtTeste', prefix: 'Teste' },
    { id: 17, flag: 'txtPUNSIONADEIRA', prefix: 'PUNSIONADEIRA' },
    { id: 18, flag: 'txtGALVANIZAR', prefix: 'GALVANIZAR' }
];

function tryFloat(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    // se ja for padrao SQL YYYY-MM-DD
    if (dateStr.includes('-')) return dateStr;
    // DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
}

async function migrate() {
    let pool;
    try {
        pool = db.pool; // Ensure we use the right pool, default is lynxlocal if not specified
        const OS_LIST = [32, 33];
        console.log(`Iniciando migracao para OS: ${OS_LIST.join(', ')}...`);

        // Fetch OS items
        const [items] = await db.executeOnDefault(`
            SELECT osi.*, os.IdProjeto 
            FROM ordemservicoitem osi
            JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
            WHERE osi.IdOrdemServico IN (${OS_LIST.join(', ')})
        `);
        console.log(`Total de itens encontrados: ${items.length}`);

        for (const item of items) {
            const idOS = item.IdOrdemServico;
            const idTag = item.IdTag || 0;
            const idProjeto = item.IdProjeto || 0;
            const idMaterial = item.IdMaterial || 0;
            const codMat = item.CodMatFabricante || item.codMatFabricante || '';

            for (const resMap of RESOURCE_MAP) {
                // If resource flag is '1' or 'S'
                if (item[resMap.flag] === '1' || item[resMap.flag] === 'S') {
                    // console.log(`Item ${item.IdOrdemServicoItem}: Found resource ${resMap.prefix}`);
                    
                    const idProcesso = resMap.id;
                    const seq = tryFloat(item[`${resMap.prefix}Sequencia`]) || 99;
                    const tSetup = tryFloat(item[`${resMap.prefix}TempoSetup`]);
                    const tPadrao = tryFloat(item[`${resMap.prefix}TempoPadrao`]);
                    const tTotal = tryFloat(item[`${resMap.prefix}TotalTempo`]);
                    
                    const planInicio = parseDate(item[`PlanejadoInicio${resMap.prefix}`]) || null;
                    const planFinal = parseDate(item[`PlanejadoFinal${resMap.prefix}`]) || null;
                    const realInicio = parseDate(item[`RealizadoInicio${resMap.prefix}`]) || null;
                    const realFinal = parseDate(item[`RealizadoFinal${resMap.prefix}`]) || null;
                    
                    const tExecutado = tryFloat(item[`${resMap.prefix}TotalExecutado`]);
                    const tExecutar = tryFloat(item[`${resMap.prefix}TotalExecutar`]);
                    const diasProd = tryFloat(item[`${resMap.prefix}DiasProducao`]);

                    // Check if already exists in material_processo
                    const [existing] = await db.executeOnDefault(
                        `SELECT IdMaterialProcesso FROM material_processo 
                         WHERE (IdMaterial = ? OR codmatFabricante = ?) AND IdProcesso = ? AND IdOrdemServico = ?`,
                        [idMaterial, codMat, idProcesso, idOS]
                    );

                    if (existing.length > 0) {
                        // Update
                        await db.executeOnDefault(
                            `UPDATE material_processo SET 
                                SequenciaExecucao=?, TempoEstimadoMin=?, TempoPadraoMin=?,
                                IdTag=?, IdProjeto=?, PlanejadoInicio=?, PlanejadoFinal=?,
                                RealizadoInicio=?, RealizadoFinal=?, TotalExecutado=?, TotalExecutar=?, DiasProducao=?
                             WHERE IdMaterialProcesso = ?`,
                            [
                                seq, tSetup, tPadrao, idTag, idProjeto,
                                planInicio, planFinal, realInicio, realFinal,
                                tExecutado, tExecutar, diasProd,
                                existing[0].IdMaterialProcesso
                            ]
                        );
                    } else {
                        // Insert
                        await db.executeOnDefault(
                            `INSERT INTO material_processo 
                            (IdMaterial, codmatFabricante, IdProcesso, SequenciaExecucao, 
                             TempoEstimadoMin, TempoPadraoMin, Ativo, DataCriacao, UsuarioCriacao,
                             IdOrdemServico, IdTag, IdProjeto, 
                             PlanejadoInicio, PlanejadoFinal, RealizadoInicio, RealizadoFinal,
                             TotalExecutado, TotalExecutar, DiasProducao)
                            VALUES (?, ?, ?, ?, ?, ?, 'A', NOW(), 'Sistema', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                idMaterial, codMat, idProcesso, seq,
                                tSetup, tPadrao, idOS, idTag, idProjeto,
                                planInicio, planFinal, realInicio, realFinal,
                                tExecutado, tExecutar, diasProd
                            ]
                        );
                    }
                }
            }
        }

        console.log("Migração concluída com sucesso!");

    } catch (err) {
        console.error("Erro na migração:", err);
    } finally {
        process.exit();
    }
}

migrate();
