require('dotenv').config();
const mysql = require('mysql2/promise');

async function copyTable() {
    let centralConn;
    try {
        const centralConfig = {
            host: process.env.DB_HOST || process.env.CENTRAL_DB_HOST || 'lynxlocal.mysql.uhserver.com',
            user: process.env.DB_USER || 'lynxlocal',
            password: process.env.DB_PASSWORD || 'Lynx2475@',
            database: 'lynxlocal'
        };
        
        console.log('Connecting to Central DB:', centralConfig.host);
        centralConn = await mysql.createConnection(centralConfig);
        
        const targets = ['mettapaineis'];
        
        for (const target of targets) {
            console.log(`\nProcessing target: ${target}`);
            
            const [rows] = await centralConn.execute('SELECT * FROM conexoes_bancos WHERE db_name = ?', [target]);
            if (rows.length === 0) {
                console.error(`Could not find credentials for ${target} in conexoes_bancos.`);
                continue;
            }
            
            const creds = rows[0];
            const tenantConfig = {
                host: creds.db_host,
                user: creds.db_user,
                password: creds.db_pass,
                database: creds.db_name,
                port: creds.db_port || 3306
            };
            
            console.log(`Connecting to tenant DB ${target} with user ${tenantConfig.user}`);
            const tenantConn = await mysql.createConnection(tenantConfig);
            
            try {
                // 1. Fetch schema from central
                const [schemaRows] = await centralConn.execute(`SHOW CREATE TABLE producaorecursodiario`);
                const createSql = schemaRows[0]['Create Table'];
                
                // 2. Check if table exists in tenant
                let tableExists = true;
                try {
                    await tenantConn.execute(`SELECT 1 FROM producaorecursodiario LIMIT 1`);
                } catch (e) {
                    tableExists = false;
                }
                
                // 3. Create or clear table
                if (!tableExists) {
                    console.log('Creating table...');
                    await tenantConn.execute(createSql);
                } else {
                    console.log('Clearing existing table...');
                    await tenantConn.execute('DELETE FROM producaorecursodiario');
                }
                
                // 4. Fetch all rows from central
                console.log('Fetching rows from central...');
                const [dataRows] = await centralConn.execute('SELECT * FROM producaorecursodiario');
                
                // 5. Insert rows into tenant
                if (dataRows.length > 0) {
                    console.log(`Inserting ${dataRows.length} rows...`);
                    const cols = Object.keys(dataRows[0]);
                    const placeholders = cols.map(() => '?').join(', ');
                    const insertSql = `INSERT INTO producaorecursodiario (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
                    
                    for (const row of dataRows) {
                        const values = cols.map(c => row[c]);
                        await tenantConn.execute(insertSql, values);
                    }
                }
                console.log(`Successfully copied table and contents to ${target}`);
            } finally {
                await tenantConn.end();
            }
        }
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (centralConn) await centralConn.end();
    }
}

copyTable();
