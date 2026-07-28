const db = require('../src/config/db.js');

async function inspectOS32() {
  try {
    const [rows] = await db.executeOnDefault("SELECT * FROM ordemservico WHERE IdOrdemServico = 32");
    if (rows && rows.length > 0) {
      console.log('--- OS 32 DATA ---');
      const os = rows[0];
      for (const [key, val] of Object.entries(os)) {
        if (val !== null && val !== '' && val !== undefined) {
          console.log(`${key}:`, val);
        }
      }
    } else {
      console.log('OS 32 not found');
    }

    const [itemRows] = await db.executeOnDefault("SELECT * FROM ordemservicoitem WHERE IdOrdemServico = 32");
    console.log('--- OS 32 ITEMS DATA ---');
    console.log('Items count:', itemRows.length);
    itemRows.forEach((item, i) => {
      console.log(`Item ${i + 1} (ID=${item.IdOrdemServicoItem}):`);
      for (const [key, val] of Object.entries(item)) {
        if (val !== null && val !== '' && val !== undefined) {
          console.log(`  ${key}:`, val);
        }
      }
    });

  } catch (err) {
    console.error('Error inspecting OS 32:', err);
  } finally {
    process.exit(0);
  }
}

inspectOS32();
