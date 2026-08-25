const pool = require('./config/db');

async function fix() {
    try {
        // 1. Get all recent estornos in romaneioitemcontrole
        const [estornos] = await pool.query("SELECT * FROM romaneioitemcontrole WHERE Situacao = 'ESTORNO' AND DATE(DataCriacao) >= '2026-06-16'");
        
        console.log('Estornos found:', estornos.length);
        
        for (const est of estornos) {
            console.log('Fixing item:', est.IdRomaneioItem);
            
            // Revert QtdeUsuario (which we wrongly increased before)
            // Decrease QtdeTotalRetorno (since estorno of retorno means we undo the return)
            await pool.query(
                "UPDATE romaneioitem SET QtdeUsuario = QtdeUsuario - ?, QtdeTotalRetorno = GREATEST(0, QtdeTotalRetorno - ?) WHERE IdRomaneioItem = ?",
                [est.qtdeUsuario, est.qtdeUsuario, est.IdRomaneioItem]
            );
            
            // Also fix the status to ITEM LOCALIZADO if QtdeTotalRetorno is 0
            await pool.query(
                "UPDATE romaneioitem SET Situacao = 'ITEM LOCALIZADO' WHERE IdRomaneioItem = ? AND QtdeTotalRetorno = 0", 
                [est.IdRomaneioItem]
            );
        }
        
        console.log('Done fixing.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fix();
