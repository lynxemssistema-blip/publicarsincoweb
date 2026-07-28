const db = require('../src/config/db.js');

async function copyCamelcaseDates() {
  const tables = ['ordemservico', 'ordemservicoitem', 'tags'];

  for (const table of tables) {
    try {
      await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoInicioPulsionadeira\` = \`PlanejadoInicioPULSIONADEIRA\` WHERE (\`PlanejadoInicioPulsionadeira\` IS NULL OR \`PlanejadoInicioPulsionadeira\` = '') AND \`PlanejadoInicioPULSIONADEIRA\` IS NOT NULL AND \`PlanejadoInicioPULSIONADEIRA\` <> ''`).catch(() => {});
      await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoFinalPulsionadeira\` = \`PlanejadoFinalPULSIONADEIRA\` WHERE (\`PlanejadoFinalPulsionadeira\` IS NULL OR \`PlanejadoFinalPulsionadeira\` = '') AND \`PlanejadoFinalPULSIONADEIRA\` IS NOT NULL AND \`PlanejadoFinalPULSIONADEIRA\` <> ''`).catch(() => {});

      await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoInicioGalvanizar\` = \`PlanejadoInicioGALVANIZAR\` WHERE (\`PlanejadoInicioGalvanizar\` IS NULL OR \`PlanejadoInicioGalvanizar\` = '') AND \`PlanejadoInicioGALVANIZAR\` IS NOT NULL AND \`PlanejadoInicioGALVANIZAR\` <> ''`).catch(() => {});
      await db.executeOnDefault(`UPDATE \`${table}\` SET \`PlanejadoFinalGalvanizar\` = \`PlanejadoFinalGALVANIZAR\` WHERE (\`PlanejadoFinalGalvanizar\` IS NULL OR \`PlanejadoFinalGalvanizar\` = '') AND \`PlanejadoFinalGALVANIZAR\` IS NOT NULL AND \`PlanejadoFinalGALVANIZAR\` <> ''`).catch(() => {});

      console.log(`✅ Synced CamelCase column values for table [${table}]`);
    } catch (err) {
      console.error(`Error in table ${table}:`, err.message);
    }
  }

  process.exit(0);
}

copyCamelcaseDates();
