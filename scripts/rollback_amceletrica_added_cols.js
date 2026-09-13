const mysql = require("mysql2/promise");

// Exatamente as 57 colunas adicionadas pela migracao (log task-286)
const COLS_TO_DROP = [
  "UsuarioRealizadoInicioCorteaLaser",
  "UsuarioRealizadoFinalCorteaLaser",
  "sttxtPUNSIONADEIRA",
  "UsuarioRealizadoInicioPUNSIONADEIRA",
  "UsuarioRealizadoFinalPUNSIONADEIRA",
  "sttxtGALVANIZAR",
  "UsuarioRealizadoInicioGALVANIZAR",
  "UsuarioRealizadoFinalGALVANIZAR",
  "CorteTotalSetup",
  "CorteTotalPadrao",
  "DobraTotalSetup",
  "DobraTotalPadrao",
  "SoldaTotalSetup",
  "SoldaTotalPadrao",
  "PinturaTotalSetup",
  "PinturaTotalPadrao",
  "MontagemTotalSetup",
  "MontagemTotalPadrao",
  "CorteaLaserTotalSetup",
  "CorteaLaserTotalPadrao",
  "PunsionadeiraTotalSetup",
  "PunsionadeiraTotalPadrao",
  "GalvanizarTotalSetup",
  "GalvanizarTotalPadrao",
  "EngenhariaTotalSetup",
  "EngenhariaTotalPadrao",
  "APROVACAOSequencia",
  "PlanejadoInicioTODOS",
  "PlanejadoFinalTODOS",
  "RealizadoInicioTODOS",
  "RealizadoFinalTODOS",
  "UsuarioPlanejadoInicioTODOS",
  "TODOSTotalExecutar",
  "TODOSTotalExecutado",
  "TODOSPercentual",
  "txtTODOS",
  "TODOSSequencia",
  "PlanejadoInicioEMBALAGENS",
  "PlanejadoFinalEMBALAGENS",
  "RealizadoInicioEMBALAGENS",
  "RealizadoFinalEMBALAGENS",
  "UsuarioPlanejadoInicioEMBALAGENS",
  "EMBALAGENSTotalExecutar",
  "EMBALAGENSTotalExecutado",
  "EMBALAGENSPercentual",
  "txtEMBALAGENS",
  "EMBALAGENSSequencia",
  "PlanejadoInicioTeste",
  "PlanejadoFinalTeste",
  "RealizadoInicioTeste",
  "RealizadoFinalTeste",
  "UsuarioPlanejadoInicioTeste",
  "TesteTotalExecutar",
  "TesteTotalExecutado",
  "TestePercentual",
  "txtTeste",
  "TesteSequencia"
];

async function run() {
  const amc = await mysql.createConnection({
    host: "amceletrica.mysql.uhserver.com", user: "brunoamc",
    password: "jHAzhFG848@yN@U", database: "amceletrica", port: 3306
  });
  console.log("[OK] Conectado a amceletrica");

  // Verificar quais realmente existem antes de dropar
  const [cols] = await amc.execute("DESCRIBE ordemservicoitem");
  const existing = new Set(cols.map(c => c.Field));

  let dropped = 0, skipped = 0, failed = 0;

  for (const col of COLS_TO_DROP) {
    // Tentar nome exato e variante com acento
    const colName = existing.has(col) ? col : 
                    (col === "APROVACAOSequencia" && existing.has("APROVAÇÃOSequencia") ? "APROVAÇÃOSequencia" : col);

    if (!existing.has(colName)) {
      console.log("[SKIP] " + col + " (nao existe)");
      skipped++;
      continue;
    }

    try {
      await amc.execute("ALTER TABLE `ordemservicoitem` DROP COLUMN `" + colName + "`");
      console.log("[DROP] " + colName);
      dropped++;
    } catch(e) {
      console.error("[FAIL] " + colName + ": " + e.message);
      failed++;
    }
  }

  console.log("=== DROP: " + dropped + "  |  SKIP: " + skipped + "  |  FAIL: " + failed + " ===");
  await amc.end();
}

run().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
