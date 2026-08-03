const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // point directly to .env in parent folder

async function updateTagsSchema() {
  try {
    const defaultPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'lynxlocal',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    const [dbs] = await defaultPool.execute('SELECT * FROM conexoes_bancos WHERE ativo = 1');
    
    for (const dbRow of dbs) {
      const dbName = dbRow.db_name;
      if (!dbName) continue;
      console.log(`\n=== Verificando Banco: ${dbName} ===`);
      const table = 'tags';
      
      try {
        const tenantPool = mysql.createPool({
            host: dbRow.host,
            user: dbRow.user,
            password: dbRow.password,
            database: dbName,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0
        });

        const [tables] = await tenantPool.execute(`SHOW TABLES LIKE '${table}'`);
        if (tables.length === 0) {
            console.log(`Tabela tags nao existe em ${dbName}`);
            tenantPool.end();
            continue;
        }

        const [cols] = await tenantPool.execute(`SHOW COLUMNS FROM \`${table}\``);
        const existingCols = cols.map(c => c.Field.toLowerCase());

        const resources = ['CorteaLaser', 'PUNSIONADEIRA', 'GALVANIZAR', 'Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem'];
        
        for (const res of resources) {
            const colsToAdd = [
                { name: `PlanejadoInicio${res}`, type: 'DATETIME NULL' },
                { name: `PlanejadoFinal${res}`, type: 'DATETIME NULL' },
                { name: `RealizadoInicio${res}`, type: 'DATETIME NULL' },
                { name: `RealizadoFinal${res}`, type: 'DATETIME NULL' }
            ];
            
            for (const col of colsToAdd) {
                if (!existingCols.includes(col.name.toLowerCase())) {
                    console.log(`[${dbName}.${table}] Criando coluna ${col.name}...`);
                    try {
                        await tenantPool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${col.name}\` ${col.type}`);
                        console.log(`[${dbName}.${table}] Coluna ${col.name} criada com sucesso!`);
                    } catch(err) {
                        console.error(`Erro ao criar ${col.name}:`, err.message);
                    }
                }
            }
        }
        tenantPool.end();
      } catch (tableErr) {
        console.error(`Erro ao processar tabela ${table} no banco ${dbName}:`, tableErr.message);
      }
    }
    console.log('\n✅ Atualizacao do esquema de tags concluida com sucesso!');
    defaultPool.end();
  } catch (err) {
    console.error('Erro geral ao atualizar esquema:', err);
  } finally {
    process.exit(0);
  }
}

updateTagsSchema();
