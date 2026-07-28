const db = require('../src/config/db.js');

async function debugOS32Api() {
  console.log('=====================================================');
  console.log('DEBUGGING REAL DATABASE API RETRIEVAL FOR OS 32');
  console.log('=====================================================');

  // Query OS 32 Header
  const [osRows] = await db.executeOnDefault("SELECT * FROM ordemservico WHERE IdOrdemServico = 32");
  const os = osRows[0];
  console.log('\n--- OS Header (IdOrdemServico = 32) ---');
  console.log('PlanejadoInicioCorte:', os.PlanejadoInicioCorte);
  console.log('PlanejadoFinalCorte:', os.PlanejadoFinalCorte);
  console.log('PlanejadoInicioPULSIONADEIRA:', os.PlanejadoInicioPULSIONADEIRA);
  console.log('PlanejadoFinalPULSIONADEIRA:', os.PlanejadoFinalPULSIONADEIRA);
  console.log('PlanejadoInicioGALVANIZAR:', os.PlanejadoInicioGALVANIZAR);
  console.log('PlanejadoFinalGALVANIZAR:', os.PlanejadoFinalGALVANIZAR);

  // Query OS 32 Items
  const [itemRows] = await db.executeOnDefault("SELECT * FROM ordemservicoitem WHERE IdOrdemServico = 32");
  console.log('\n--- OS Items count:', itemRows.length);
  itemRows.forEach((item, idx) => {
    console.log(`\nItem #${idx + 1} (IdOrdemServicoItem = ${item.IdOrdemServicoItem}):`);
    console.log('  PlanejadoInicioCorte:', item.PlanejadoInicioCorte);
    console.log('  PlanejadoFinalCorte:', item.PlanejadoFinalCorte);
    console.log('  PlanejadoInicioPULSIONADEIRA:', item.PlanejadoInicioPULSIONADEIRA);
    console.log('  PlanejadoFinalPULSIONADEIRA:', item.PlanejadoFinalPULSIONADEIRA);
    console.log('  PlanejadoInicioGALVANIZAR:', item.PlanejadoInicioGALVANIZAR);
    console.log('  PlanejadoFinalGALVANIZAR:', item.PlanejadoFinalGALVANIZAR);
  });

  process.exit(0);
}

debugOS32Api();
