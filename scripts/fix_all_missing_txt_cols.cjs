const db = require('../src/config/db.js');
const mysql = require('mysql2/promise');

const txtFlags = [
  'txtCorte', 'txtDobra', 'txtSolda', 'txtPintura', 'txtMontagem',
  'txtCorteaLaser', 'txtPUNSIONADEIRA', 'txtGALVANIZAR', 'txtACABAMENTO', 
  'txtISOMETRICO', 'txtENGENHARIA', 'txtMEDICAO', 'txtAPROVACAO'
];

async function fixAllTxtCols() {
  try {
    console.log('--- ADDING MISSING TXT FLAGS TO ALL TENANTS ---');
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

          for (const flag of txtFlags) {
            try {
              await tenantPool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${flag}\` VARCHAR(10) NULL DEFAULT '0'`);
              console.log(`[${dbName}.${table}] Adicionada ${flag}`);
            } catch (err) {
              if (err.code !== 'ER_DUP_FIELDNAME') {
                 console.error(`Erro na coluna ${flag} em ${table}:`, err.message);
              }
            }
          }
        } catch (tableErr) {
          console.error(`Erro ao processar tabela ${table} no banco ${dbName}:`, tableErr.message);
        }
      }
      
      await tenantPool.end();
    }
    console.log('\nFinalizado com sucesso!');
  } catch (err) {
    console.error('Erro geral:', err);
  } finally {
    process.exit(0);
  }
}

fixAllTxtCols();
