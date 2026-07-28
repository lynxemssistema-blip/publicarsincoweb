const db = require('../src/config/db.js');

const staticResources = [
  'Corte',
  'Dobra',
  'Solda',
  'Pintura',
  'Montagem',
  'GALVANIZAR',
  'PULSIONADEIRA',
  'ACABAMENTO',
  'ISOMETRICO',
  'ENGENHARIA',
  'MEDICAO',
  'APROVACAO',
  'CorteaLaser'
];

async function updateMinProdSchema() {
  try {
    const [dbs] = await db.executeOnDefault('SHOW DATABASES');
    for (const dbRow of dbs) {
      const dbName = dbRow.Database;
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) continue;

      console.log(`\n=== Verificando Banco: ${dbName} ===`);
      const targetTables = ['ordemservicoitem', 'ordemservico', 'tags', 'projetos'];

      for (const table of targetTables) {
        try {
          const [tables] = await db.executeOnDefault(`SHOW TABLES FROM \`${dbName}\` LIKE '${table}'`);
          if (tables.length === 0) continue;

          const [cols] = await db.executeOnDefault(`SHOW COLUMNS FROM \`${dbName}\`.\`${table}\``);
          const existingCols = cols.map(c => c.Field);

          // Buscar todos os recursos descritos no ordemservicoitem
          let resources = [...staticResources];
          if (table === 'ordemservicoitem') {
            for (const col of existingCols) {
              if (col.startsWith('txt') && col !== 'txtSoldagem' && col !== 'txtTipoDesenho' && col !== 'txtItemEstoque') {
                const rec = col.substring(3);
                if (rec && !resources.includes(rec)) {
                  resources.push(rec);
                }
              }
              if (col.endsWith('TotalExecutado')) {
                const rec = col.replace('TotalExecutado', '');
                if (rec && !resources.includes(rec)) {
                  resources.push(rec);
                }
              }
            }
          }

          for (const rec of resources) {
            let recName = rec;
            if (recName.toLowerCase() === 'montagem') recName = 'Montagem';
            
            const minProdCol = `${recName}MinProd`;

            if (!existingCols.includes(minProdCol)) {
              console.log(`[${dbName}.${table}] Criando coluna ${minProdCol}...`);
              await db.executeOnDefault(`ALTER TABLE \`${dbName}\`.\`${table}\` ADD COLUMN \`${minProdCol}\` INT DEFAULT 0`);
              console.log(`[${dbName}.${table}] Coluna ${minProdCol} criada com sucesso!`);
            } else {
              console.log(`[${dbName}.${table}] Coluna ${minProdCol} ja existe.`);
            }
          }
        } catch (tableErr) {
          console.error(`Erro ao processar tabela ${table} no banco ${dbName}:`, tableErr.message);
        }
      }
    }
    console.log('\n✅ Atualizacao do esquema dos campos MinProd concluida com sucesso!');
  } catch (err) {
    console.error('Erro geral ao atualizar esquema MinProd:', err);
  } finally {
    process.exit(0);
  }
}

updateMinProdSchema();
