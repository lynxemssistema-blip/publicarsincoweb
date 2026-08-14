const { query } = require('./src/config/db');

async function run() {
    try {
        const [rows] = await query("DESCRIBE material_processo");
        console.log(rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch(e) {
        console.error(e.message);
        process.exit(1);
    }
}
run();
