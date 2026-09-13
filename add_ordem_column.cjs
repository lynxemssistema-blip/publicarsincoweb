const db = require('./src/config/db.js');

async function run() {
  try {
    const [dbs] = await db.executeOnDefault('SHOW DATABASES');
    for (const row of dbs) {
      const dbName = row.Database;
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) continue;
      
      try {
        const [tables] = await db.executeOnDefault(`SHOW TABLES FROM \`${dbName}\` LIKE 'montapeca'`);
        if (tables.length > 0) {
          console.log(`[${dbName}] Found montapeca. Checking columns...`);
          const [cols] = await db.executeOnDefault(`SHOW COLUMNS FROM \`${dbName}\`.\`montapeca\``);
          const colNames = cols.map(c => c.Field);
          
          if (!colNames.includes('Ordem')) {
             console.log(`[${dbName}] Adding Ordem...`);
             await db.executeOnDefault(`ALTER TABLE \`${dbName}\`.\`montapeca\` ADD COLUMN Ordem INT(11) DEFAULT 0`);
          } else {
             console.log(`[${dbName}] Ordem already exists.`);
          }
        }
      } catch (e) {
         console.error(`Error on db ${dbName}:`, e.message);
      }
    }
  } catch (e) { console.error(e); }
  console.log("Global schema update completed.");
  process.exit(0);
}

run();
