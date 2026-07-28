const db = require('../src/config/db.js');

async function migrateColumnsToCamelCase() {
  console.log('=====================================================');
  console.log('STANDARDIZING MYSQL COLUMNS TO CAMELCASE (Requirement 2)');
  console.log('=====================================================');

  const tables = ['ordemservico', 'ordemservicoitem', 'tags'];

  for (const table of tables) {
    console.log(`\nChecking table: [${table}]...`);
    try {
      const [cols] = await db.executeOnDefault(`SHOW COLUMNS FROM \`${table}\``);
      const colNames = cols.map(c => c.Field);

      // Check Pulsionadeira
      if (colNames.includes('PlanejadoInicioPULSIONADEIRA') && !colNames.includes('PlanejadoInicioPulsionadeira')) {
        console.log(`Adding PlanejadoInicioPulsionadeira & PlanejadoFinalPulsionadeira & PulsionadeiraMinProd to ${table}...`);
        await db.executeOnDefault(`ALTER TABLE \`${table}\` ADD COLUMN \`PlanejadoInicioPulsionadeira\` VARCHAR(50) DEFAULT NULL`);
        await db.executeOnDefault(`ALTER TABLE \`${table}\` ADD COLUMN \`PlanejadoFinalPulsionadeira\` VARCHAR(50) DEFAULT NULL`);
        await db.executeOnDefault(`ALTER TABLE \`${table}\` ADD COLUMN \`PulsionadeiraMinProd\` INT DEFAULT 0`);
      }

      // Copy data for Pulsionadeira
      if (colNames.includes('PlanejadoInicioPULSIONADEIRA')) {
        await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoInicioPulsionadeira\` = \`PlanejadoInicioPULSIONADEIRA\` WHERE (\`PlanejadoInicioPulsionadeira\` IS NULL OR \`PlanejadoInicioPulsionadeira\` = '') AND \`PlanejadoInicioPULSIONADEIRA\` IS NOT NULL`);
        await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoFinalPulsionadeira\` = \`PlanejadoFinalPULSIONADEIRA\` WHERE (\`PlanejadoFinalPulsionadeira\` IS NULL OR \`PlanejadoFinalPulsionadeira\` = '') AND \`PlanejadoFinalPULSIONADEIRA\` IS NOT NULL`);
        await db.executeOnDefault(`UPDATE \`${table}\` SET \`PulsionadeiraMinProd\` = \`PULSIONADEIRAMinProd\` WHERE (\`PulsionadeiraMinProd\` IS NULL OR \`PulsionadeiraMinProd\` = 0) AND \`PULSIONADEIRAMinProd\` > 0`);
        console.log(`Copied PULSIONADEIRA data to Pulsionadeira in ${table}`);
      }

      // Check Galvanizar
      if (colNames.includes('PlanejadoInicioGALVANIZAR') && !colNames.includes('PlanejadoInicioGalvanizar')) {
        console.log(`Adding PlanejadoInicioGalvanizar & PlanejadoFinalGalvanizar & GalvanizarMinProd to ${table}...`);
        await db.executeOnDefault(`ALTER TABLE \`${table}\` ADD COLUMN \`PlanejadoInicioGalvanizar\` VARCHAR(50) DEFAULT NULL`);
        await db.executeOnDefault(`ALTER TABLE \`${table}\` ADD COLUMN \`PlanejadoFinalGalvanizar\` VARCHAR(50) DEFAULT NULL`);
        await db.executeOnDefault(`ALTER TABLE \`${table}\` ADD COLUMN \`GalvanizarMinProd\` INT DEFAULT 0`);
      }

      // Copy data for Galvanizar
      if (colNames.includes('PlanejadoInicioGALVANIZAR')) {
        await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoInicioGalvanizar\` = \`PlanejadoInicioGALVANIZAR\` WHERE (\`PlanejadoInicioGalvanizar\` IS NULL OR \`PlanejadoInicioGalvanizar\` = '') AND \`PlanejadoInicioGALVANIZAR\` IS NOT NULL`);
        await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoFinalGalvanizar\` = \`PlanejadoFinalGALVANIZAR\` WHERE (\`PlanejadoFinalGalvanizar\` IS NULL OR \`PlanejadoFinalGalvanizar\` = '') AND \`PlanejadoFinalGALVANIZAR\` IS NOT NULL`);
        await db.executeOnDefault(`UPDATE \`${table}\` SET \`GalvanizarMinProd\` = \`GALVANIZARMinProd\` WHERE (\`GalvanizarMinProd\` IS NULL OR \`GalvanizarMinProd\` = 0) AND \`GALVANIZARMinProd\` > 0`);
        console.log(`Copied GALVANIZAR data to Galvanizar in ${table}`);
      }

    } catch (err) {
      console.error(`Error updating table ${table}:`, err.message);
    }
  }

  console.log('\n🎉 Column Standardization completed!');
  process.exit(0);
}

migrateColumnsToCamelCase();
