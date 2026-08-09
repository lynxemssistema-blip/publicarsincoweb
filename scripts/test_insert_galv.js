const db = require('../src/config/db');
(async () => {
    try {
        const [res] = await db.execute(
            `INSERT INTO material_processo (IdMaterial, codmatFabricante, IdProcesso, SequenciaExecucao, TempoEstimadoMin, TempoPadraoMin, Ativo, UsuarioCriacao, DataCriacao, IdMatriz) VALUES (?, ?, ?, ?, ?, ?, 'A', ?, NOW(), ?)`,
            [0, 'NHA14022', 18, 30, 3, 6, 'Sistema', null]
        );
        console.log('Inserted:', res.insertId);
    } catch(e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
