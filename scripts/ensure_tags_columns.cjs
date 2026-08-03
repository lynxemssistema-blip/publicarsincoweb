const mysql = require('mysql2/promise');
const db = require('../src/config/db.js');

async function ensureTagsColumns() {
    try {
        const [dbs] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE ativo = 1');
        
        for (const connInfo of dbs) {
            const dbName = connInfo.db_name;
            console.log(`\n=== Verificando Banco (Tenant): ${dbName} ===`);
            
            try {
                const tenantPool = mysql.createPool({
                    host: connInfo.host,
                    user: connInfo.user,
                    password: connInfo.password,
                    database: dbName,
                    waitForConnections: true,
                    connectionLimit: 5,
                    queueLimit: 0
                });

                const [cols] = await tenantPool.execute(`SHOW COLUMNS FROM tags`);
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
                            console.log(`[${dbName}.tags] Criando coluna ${col.name}...`);
                            try {
                                await tenantPool.execute(`ALTER TABLE tags ADD COLUMN \`${col.name}\` ${col.type}`);
                                console.log(`[${dbName}.tags] Coluna ${col.name} criada com sucesso!`);
                            } catch(err) {
                                console.error(`Erro ao criar ${col.name}:`, err.message);
                            }
                        }
                    }
                }
                
                tenantPool.end();
            } catch (err) {
                console.error(`Erro ao processar banco ${dbName}:`, err.message);
            }
        }
        console.log('\n✅ Atualizacao do esquema concluida com sucesso!');
    } catch(e) {
        console.error('Erro:', e.message);
    } finally {
        process.exit(0);
    }
}

ensureTagsColumns();
