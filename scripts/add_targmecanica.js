const mysql = require('mysql2/promise');

const centralConfig = {
    host: 'lynxlocal.mysql.uhserver.com',
    user: 'lynxlocal',
    password: 'jHAzhFG848@yN@U',
    database: 'lynxlocal',
    port: 3306
};

async function addTargMecanica() {
    let connection;
    try {
        console.log('Connecting to central database...');
        connection = await mysql.createConnection(centralConfig);
        console.log('Connected.');

        const [rows] = await connection.execute(
            'SELECT id FROM conexoes_bancos WHERE db_name = ?',
            ['targetmecanica']
        );

        if (rows.length > 0) {
            console.log('TargMecanica database connection already exists.');
        } else {
            console.log('Inserting TargMecanica database connection...');
            await connection.execute(`
                INSERT INTO conexoes_bancos 
                (nome_cliente, db_host, db_user, db_pass, db_name, db_port, ativo)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                'TargMecanica',
                'targetmecanica.mysql.uhserver.com',
                'targetmec',
                'jHAzhFG848@yN@U',
                'targetmecanica',
                3306,
                1
            ]);
            console.log('TargMecanica added successfully.');
        }

    } catch (error) {
        console.error('Error adding TargMecanica:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addTargMecanica();
