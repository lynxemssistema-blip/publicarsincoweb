const db = require('../src/config/db.js');
const mysql = require('mysql2/promise');

const staticResources = [
  'Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem',
  'GALVANIZAR', 'Punsionadeira', 'ACABAMENTO', 'ISOMETRICO',
  'ENGENHARIA', 'MEDICAO', 'APROVACAO', 'CorteaLaser'
];

async function addMinProd() {
  try {
    console.log('--- ADDING MINPROD COLUMNS ---');
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

          for (const rec of staticResources) {
            let recName = rec;
            const colName = `${recName}MinProd`;

            if (!existingCols.includes(colName)) {
              console.log(`[${dbName}.${table}] Criando coluna ${colName}...`);
              await tenantPool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` INT DEFAULT 0`);
              console.log(`[${dbName}.${table}] Coluna ${colName} criada com sucesso!`);
            }
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

addMinProd();
