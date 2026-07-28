const pool = require('./src/config/db');

async function check() {
    let conn;
    try {
        conn = await pool.getConnection();
        const osId = 33;

        console.log(`--- CHECKING COLUMNS ON ordemservico ---`);
        const [osCols] = await conn.execute(`SHOW COLUMNS FROM ordemservico`);
        const colNames = osCols.map(c => c.Field);
        
        const checkList = ['TempoSetup', 'TempoPadrao', 'TotalTempo', 'TotalSetup', 'TotalPadrao', 'DobraTempoSetup', 'PulsionadeiraTempoSetup'];
        for (const c of checkList) {
            console.log(`Column ${c} on ordemservico: ${colNames.includes(c) ? 'EXISTS' : 'MISSING ❌'}`);
        }

        console.log(`\n--- CHECKING VALUES FOR OS #${osId} ---`);
        const [osRows] = await conn.execute(`SELECT IdOrdemServico, QtdeTotalItens, QtdeTotalPecas, TempoSetup, TempoPadrao, TotalTempo, DobraTempoSetup, DobraTempoPadrao, DobraTotalTempo, PulsionadeiraTempoSetup, PulsionadeiraTempoPadrao, PulsionadeiraTotalTempo FROM ordemservico WHERE IdOrdemServico = ?`, [osId]);
        console.log('Current ordemservico row:', osRows[0]);

        console.log(`\n--- CHECKING SUMS OF ordemservicoitem FOR OS #${osId} ---`);
        const [itemSums] = await conn.execute(`
            SELECT 
                COUNT(*) as countItems,
                SUM(QtdeTotal) as sumPecas,
                SUM(TempoSetup) as sumSetup,
                SUM(TempoPadrao) as sumPadrao,
                SUM(TotalTempo) as sumTotal,
                SUM(DobraTempoSetup) as sumDobraSetup,
                SUM(DobraTempoPadrao) as sumDobraPadrao,
                SUM(DobraTotalTempo) as sumDobraTotal,
                SUM(PulsionadeiraTempoSetup) as sumPulsiSetup,
                SUM(PulsionadeiraTempoPadrao) as sumPulsiPadrao,
                SUM(PulsionadeiraTotalTempo) as sumPulsiTotal
            FROM ordemservicoitem 
            WHERE IdOrdemServico = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e = '')
        `, [osId]);
        console.log('Item sums:', itemSums[0]);

    } catch (e) {
        console.error(e);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

check();
