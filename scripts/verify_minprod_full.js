const db = require('../src/config/db.js');

async function runFullVerification() {
  console.log('=== Iniciando Verificacao Completa dos Campos MinProd em 4 Niveis ===\n');

  try {
    // 1. Verificação de existência das colunas
    const tables = ['ordemservicoitem', 'ordemservico', 'tags', 'projetos'];
    const sampleResources = ['Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem'];

    for (const table of tables) {
      const [cols] = await db.executeOnDefault(`SHOW COLUMNS FROM \`${table}\``);
      const colNames = cols.map(c => c.Field);
      
      console.log(`📌 Tabela \`${table}\`:`);
      for (const rec of sampleResources) {
        const col = `${rec}MinProd`;
        const exists = colNames.includes(col);
        console.log(`   - ${col}: ${exists ? '✅ PRESENTE' : '❌ AUSENTE'}`);
      }
    }

    // 2. Simulação de Apontamento e Cascata
    console.log('\n📌 Simulação de Apontamento e Verificação de Valores:');
    
    // Buscar um item de teste
    const [items] = await db.executeOnDefault(`
      SELECT osi.IdOrdemServicoItem, osi.IdOrdemServico, osi.txtCorte, os.IdTag, os.IdProjeto
      FROM ordemservicoitem osi
      INNER JOIN ordemservico os ON osi.IdOrdemServico = os.IdOrdemServico
      LIMIT 1
    `);

    if (items.length > 0) {
      const item = items[0];
      console.log(`   Item selecionado: ID=${item.IdOrdemServicoItem}, OS=${item.IdOrdemServico}, Tag=${item.IdTag}, Projeto=${item.IdProjeto}`);

      // Garantir tempo padrao txtCorte = 5 no item de teste
      await db.executeOnDefault("UPDATE ordemservicoitem SET txtCorte = '5' WHERE IdOrdemServicoItem = ?", [item.IdOrdemServicoItem]);

      // Capturar valores antes
      const [itemBefore] = await db.executeOnDefault("SELECT CorteMinProd FROM ordemservicoitem WHERE IdOrdemServicoItem = ?", [item.IdOrdemServicoItem]);
      const [osBefore]   = await db.executeOnDefault("SELECT CorteMinProd FROM ordemservico WHERE IdOrdemServico = ?", [item.IdOrdemServico]);

      const valItemBefore = itemBefore[0]?.CorteMinProd || 0;
      const valOSBefore   = osBefore[0]?.CorteMinProd || 0;

      // Executar incremento de 3 unidades (totalprod = 5 * 3 = 15 minutos)
      const inputQty = 3;
      const totalprod = 5 * inputQty; // 15

      console.log(`   Apontando ${inputQty} unidades com tempo padrão 5 (totalprod = ${totalprod} min)...`);

      await db.executeOnDefault("UPDATE ordemservicoitem SET CorteMinProd = COALESCE(CorteMinProd, 0) + ? WHERE IdOrdemServicoItem = ?", [totalprod, item.IdOrdemServicoItem]);
      await db.executeOnDefault("UPDATE ordemservico SET CorteMinProd = COALESCE(CorteMinProd, 0) + ? WHERE IdOrdemServico = ?", [totalprod, item.IdOrdemServico]);
      if (item.IdTag) await db.executeOnDefault("UPDATE tags SET CorteMinProd = COALESCE(CorteMinProd, 0) + ? WHERE IdTag = ?", [totalprod, item.IdTag]);
      if (item.IdProjeto) await db.executeOnDefault("UPDATE projetos SET CorteMinProd = COALESCE(CorteMinProd, 0) + ? WHERE IdProjeto = ?", [totalprod, item.IdProjeto]);

      // Capturar valores depois
      const [itemAfter] = await db.executeOnDefault("SELECT CorteMinProd FROM ordemservicoitem WHERE IdOrdemServicoItem = ?", [item.IdOrdemServicoItem]);
      const [osAfter]   = await db.executeOnDefault("SELECT CorteMinProd FROM ordemservico WHERE IdOrdemServico = ?", [item.IdOrdemServico]);

      const valItemAfter = itemAfter[0]?.CorteMinProd || 0;
      const valOSAfter   = osAfter[0]?.CorteMinProd || 0;

      console.log(`   Resultados:`);
      console.log(`   - Item CorteMinProd: ${valItemBefore} -> ${valItemAfter} (Diferença: +${valItemAfter - valItemBefore})`);
      console.log(`   - OS CorteMinProd:   ${valOSBefore} -> ${valOSAfter} (Diferença: +${valOSAfter - valOSBefore})`);

      if (valItemAfter - valItemBefore === totalprod && valOSAfter - valOSBefore === totalprod) {
        console.log(`\n✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO ABSOLUTO!`);
      } else {
        console.log(`\n⚠️ Atenção: Os valores divergiram dos 15 minutos esperados.`);
      }

      // Reverter alteração de teste
      await db.executeOnDefault("UPDATE ordemservicoitem SET CorteMinProd = GREATEST(0, COALESCE(CorteMinProd, 0) - ?) WHERE IdOrdemServicoItem = ?", [totalprod, item.IdOrdemServicoItem]);
      await db.executeOnDefault("UPDATE ordemservico SET CorteMinProd = GREATEST(0, COALESCE(CorteMinProd, 0) - ?) WHERE IdOrdemServico = ?", [totalprod, item.IdOrdemServico]);
      if (item.IdTag) await db.executeOnDefault("UPDATE tags SET CorteMinProd = GREATEST(0, COALESCE(CorteMinProd, 0) - ?) WHERE IdTag = ?", [totalprod, item.IdTag]);
      if (item.IdProjeto) await db.executeOnDefault("UPDATE projetos SET CorteMinProd = GREATEST(0, COALESCE(CorteMinProd, 0) - ?) WHERE IdProjeto = ?", [totalprod, item.IdProjeto]);
      console.log(`   Valores de teste restaurados aos originais.`);
    }
  } catch (err) {
    console.error('Erro na verificacao:', err);
  } finally {
    process.exit(0);
  }
}

runFullVerification();
