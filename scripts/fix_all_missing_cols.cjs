const db = require('../src/config/db.js');
const mysql = require('mysql2/promise');

const staticResources = [
  'Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem',
  'GALVANIZAR', 'Punsionadeira', 'ACABAMENTO', 'ISOMETRICO',
  'ENGENHARIA', 'MEDICAO', 'APROVACAO', 'CorteaLaser'
];

const generalCols = [
  'TempoSetup', 'TempoPadrao', 'TotalTempo'
];

async function fixAllCols() {
  try {
    console.log('--- ADDING ALL MISSING COLUMNS ---');
    const [tenants] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE ativo = 1');
    
    for (const tenantRow of tenants) {
      const dbName = tenantRow.db_name;
      console.log(`\n=== Verificando Banco: ${dbName} ===`);
      let tenantPool;
      try {
        tenantPool = mysql.createPool({
          host: tenantRow.db_host,
          user: tenantRow.db_user,
          password: tenantRow.db_pass,
          database: tenantRow.db_name,
          port: tenantRow.db_port || 3306
        });
      } catch (err) {
        console.error(`Erro ao conectar ao tenant ${dbName}:`, err.message);
        continue;
      }

      const targetTables = ['ordemservicoitem', 'ordemservico', 'tags', 'projetos'];

      for (const table of targetTables) {
        try {
          const [tables] = await tenantPool.execute(`SHOW TABLES LIKE '${table}'`);
          if (tables.length === 0) continue;

          const [cols] = await tenantPool.execute(`SHOW COLUMNS FROM \`${table}\``);
          const existingCols = cols.map(c => c.Field);

          let alterParts = [];

          // General cols
          for (const g of generalCols) {
             if (!existingCols.includes(g)) {
                alterParts.push(`ADD COLUMN \`${g}\` DECIMAL(10,2) DEFAULT 0`);
             }
          }

          // Resource specific cols
          for (const rec of staticResources) {
             const c1 = `${rec}TempoSetup`;
             const c2 = `${rec}TempoPadrao`;
             const c3 = `${rec}TotalTempo`;
             const c4 = `${rec}Sequencia`;

             if (!existingCols.includes(c1)) alterParts.push(`ADD COLUMN \`${c1}\` DECIMAL(10,2) DEFAULT 0`);
             if (!existingCols.includes(c2)) alterParts.push(`ADD COLUMN \`${c2}\` DECIMAL(10,2) DEFAULT 0`);
             if (!existingCols.includes(c3)) alterParts.push(`ADD COLUMN \`${c3}\` DECIMAL(10,2) DEFAULT 0`);
             if (!existingCols.includes(c4)) alterParts.push(`ADD COLUMN \`${c4}\` INT DEFAULT 0`);
          }

          if (alterParts.length > 0) {
            console.log(`[${dbName}.${table}] Adicionando ${alterParts.length} colunas...`);
            // Execute all alters in one query? No, MySQL allows multiple ADD COLUMN separated by commas
            const query = `ALTER TABLE \`${table}\` ${alterParts.join(', ')}`;
            await tenantPool.execute(query);
            console.log(`[${dbName}.${table}] Colunas criadas com sucesso!`);
          } else {
             console.log(`[${dbName}.${table}] Nenhuma coluna faltando.`);
          }
        } catch (tableErr) {
          console.error(`Erro ao processar tabela ${table} no banco ${dbName}:`, tableErr.message);
        }
      }
    }
    console.log('\nFinalizado!');
  } catch (err) {
    console.error('Erro geral:', err);
  } finally {
    process.exit(0);
  }
}

fixAllCols();
