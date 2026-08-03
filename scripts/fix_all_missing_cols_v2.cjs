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
    console.log('--- ADDING ALL MISSING COLUMNS ONE BY ONE ---');
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

          let missingCols = [];

          // General cols
          for (const g of generalCols) {
             missingCols.push({ name: g, type: 'DECIMAL(10,2) DEFAULT 0' });
          }

          // Resource specific cols
          for (const rec of staticResources) {
             missingCols.push({ name: `${rec}TempoSetup`, type: 'DECIMAL(10,2) DEFAULT 0' });
             missingCols.push({ name: `${rec}TempoPadrao`, type: 'DECIMAL(10,2) DEFAULT 0' });
             missingCols.push({ name: `${rec}TotalTempo`, type: 'DECIMAL(10,2) DEFAULT 0' });
             missingCols.push({ name: `${rec}Sequencia`, type: 'INT DEFAULT 0' });
          }

          for (const col of missingCols) {
            try {
              await tenantPool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${col.name}\` ${col.type}`);
              console.log(`[${dbName}.${table}] Adicionada ${col.name}`);
            } catch (err) {
              if (err.code !== 'ER_DUP_FIELDNAME') {
                 console.error(`Erro na coluna ${col.name} em ${table}:`, err.message);
              }
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

fixAllCols();
