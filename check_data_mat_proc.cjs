const { query } = require('./src/config/db');

async function run() {
    try {
        const [rows] = await query("SELECT IdOrdemServico, IdMaterial, IdProcesso, TotalExecutado, TotalExecutar FROM material_processo LIMIT 10");
        console.log(rows);
        process.exit(0);
    } catch(e) {
        console.error(e.message);
        process.exit(1);
    }
}
run();
