const db = require('./src/config/db');

async function test() {
    try {
        console.log("Initializing DB...");
        // Pass dummy config to initPool to set default pool
        db.initPool({
            host: process.env.CENTRAL_DB_HOST || 'lynxlocal.mysql.uhserver.com',
            user: process.env.CENTRAL_DB_USER || 'lynxlocal_root',
            password: process.env.CENTRAL_DB_PASS || 'lynx@2022',
            database: process.env.CENTRAL_DB_NAME || 'lynxlocal',
        });
        
        const [dbs] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE db_name = "amceletrica"');
        if (!dbs || dbs.length === 0) throw new Error("amceletrica not found");
        const connInfo = dbs[0];
        
        const pool = await db.getTenantPool(connInfo.db_name);
        
        const idTag = 556;
        console.log(`Checking query for IdTag = ${idTag}...`);
        
        const sql = `
            SELECT 
                IdOrdemServico, IdTag, IdProjeto, Descricao, OrdemServicoFinalizado, Liberado_Engenharia, 
                Data_Liberacao_Engenharia, DataPrevisao, Fator, EnderecoOrdemServico, NumeroOPOmie,
                
                COALESCE(QtdeTotalItens, 0) AS QtdeTotalItens,
                COALESCE(QtdeItensExecutados, 0) AS QtdeItensExecutados,
                
                COALESCE(QtdeTotalPecas, 0) AS QtdeTotalPecas,
                COALESCE(QtdepecasExecutadas, 0) AS QtdePecasExecutadas,

                COALESCE(PesoTotal, 0) AS PesoTotal,
                COALESCE(AreaPinturaTotal, 0) AS AreaPinturaTotal,

                CorteTotalExecutar, CorteTotalExecutado,
                DobraTotalExecutar, DobraTotalExecutado,
                SoldaTotalExecutar, SoldaTotalExecutado,
                PinturaTotalExecutar, PinturaTotalExecutado,
                MontagemTotalExecutar, MontagemTotalExecutado,
                CorteaLaserTotalExecutar, CorteaLaserTotalExecutado,
                PlanejadoInicioCorte, PlanejadoFinalCorte,
                PlanejadoInicioPUNSIONADEIRA, PlanejadoFinalPUNSIONADEIRA,
                PlanejadoInicioGALVANIZAR, PlanejadoFinalGALVANIZAR,
                
                PunsionadeiraTotalExecutar, PunsionadeiraTotalExecutado,
                GalvanizarTotalExecutar, GalvanizarTotalExecutado
            FROM ordemservico 
            WHERE (IdTag = ?) AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '' OR D_E_L_E_T_E = ' ')
            ORDER BY IdOrdemServico
        `;
        
        const [rows] = await pool.execute(sql, [idTag]);
        console.log("Success. Rows:", rows.length);
        if (rows.length === 0) {
            console.log("Checking raw OS for IdTag = 556 without DELETE clause:");
            const [rows2] = await pool.execute(`SELECT IdOrdemServico, IdTag, D_E_L_E_T_E FROM ordemservico WHERE IdTag = ?`, [idTag]);
            console.log("Raw OS data:", rows2);
        }
        
    } catch (e) {
        console.error('Query error:', e);
    }
    process.exit(0);
}

test();
