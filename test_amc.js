const db = require('./src/config/db');

async function test() {
    try {
        const [dbs] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE db_name = "amceletrica"');
        const connInfo = dbs[0];
        console.log(connInfo);

        const mysql = require('mysql2/promise');
        const pool = mysql.createPool({
            host: connInfo.db_host,
            user: connInfo.db_user,
            password: connInfo.db_pass,
            database: connInfo.db_name
        });

        const extraResources = [
            'Medicao', 'Isometrico', 'Aprovacao', 'Acabamento', 'Expedicao'
        ];
        
        for (const res of extraResources) {
            const colsToAdd = [
                { name: `PlanejadoInicio${res}`, type: 'DATETIME NULL' },
                { name: `PlanejadoFinal${res}`, type: 'DATETIME NULL' },
                { name: `RealizadoInicio${res}`, type: 'DATETIME NULL' },
                { name: `RealizadoFinal${res}`, type: 'DATETIME NULL' }
            ];
            
            for (const col of colsToAdd) {
                try {
                    await pool.execute(`ALTER TABLE tags ADD COLUMN \`${col.name}\` ${col.type}`);
                    console.log(`Column ${col.name} added to tags`);
                } catch(err) {
                    if (err.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`Error adding ${col.name}:`, err.message);
                    }
                }
            }
        }

        const percentualResources = [
            'CorteaLaser', 'PUNSIONADEIRA', 'GALVANIZAR'
        ];

        for (const res of percentualResources) {
            const col = { name: `${res}Percentual`, type: 'DECIMAL(10,2) DEFAULT 0' };
            try {
                await pool.execute(`ALTER TABLE tags ADD COLUMN \`${col.name}\` ${col.type}`);
                console.log(`Column ${col.name} added to tags`);
            } catch(err) {
                if (err.code !== 'ER_DUP_FIELDNAME') {
                    console.error(`Error adding ${col.name}:`, err.message);
                }
            }
        }

        pool.end();
        console.log('Done tags update for amceletrica');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

test();
