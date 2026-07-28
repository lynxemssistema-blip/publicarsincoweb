const pool = require('./src/config/db');

async function fix() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('--- Iniciando Correção e Certificação no Banco de Dados ---');

        // 1. Atualizar ordemservicoitem onde 'qtde' está NULL ou 0
        const [resItem] = await conn.execute(`
            UPDATE ordemservicoitem 
            SET qtde = COALESCE(NULLIF(QtdeTotal, 0), 1)
            WHERE (qtde IS NULL OR qtde = 0)
              AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')
        `);
        console.log(`[1] Registros em 'ordemservicoitem' com 'qtde' preenchido: ${resItem.affectedRows}`);

        // 2. Atualizar 'QtdeTotalItens' (COUNT) e 'QtdeTotalPecas' (SUM QtdeTotal) em 'ordemservico'
        const [resOS] = await conn.execute(`
            UPDATE ordemservico os
            SET 
                QtdeTotalItens = (
                    SELECT COALESCE(COUNT(*), 0) 
                    FROM ordemservicoitem oi 
                    WHERE oi.IdOrdemServico = os.IdOrdemServico 
                      AND (oi.d_e_l_e_t_e IS NULL OR oi.d_e_l_e_t_e = '')
                ),
                QtdeTotalPecas = (
                    SELECT COALESCE(SUM(oi.QtdeTotal), 0) 
                    FROM ordemservicoitem oi 
                    WHERE oi.IdOrdemServico = os.IdOrdemServico 
                      AND (oi.d_e_l_e_t_e IS NULL OR oi.d_e_l_e_t_e = '')
                )
            WHERE (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '')
        `);
        console.log(`[2] Ordens de serviço recalculadas (QtdeTotalItens / QtdeTotalPecas): ${resOS.affectedRows}`);

        // 3. Amostragem de verificação
        const [sample] = await conn.execute(`
            SELECT 
                os.IdOrdemServico,
                os.QtdeTotalItens,
                os.QtdeTotalPecas,
                (SELECT COUNT(*) FROM ordemservicoitem oi WHERE oi.IdOrdemServico = os.IdOrdemServico AND (oi.D_E_L_E_T_E IS NULL OR oi.D_E_L_E_T_E = '')) AS CountRealItens,
                (SELECT SUM(oi.QtdeTotal) FROM ordemservicoitem oi WHERE oi.IdOrdemServico = os.IdOrdemServico AND (oi.D_E_L_E_T_E IS NULL OR oi.D_E_L_E_T_E = '')) AS SumRealPecas
            FROM ordemservico os
            WHERE (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '')
            LIMIT 5
        `);
        console.log('\n--- Amostra de Verificação ---');
        console.table(sample);

    } catch (e) {
        console.error('Erro na correção:', e);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

fix();
