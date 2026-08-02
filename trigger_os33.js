const mysql = require('mysql2/promise');
const fs = require('fs');

const dbConfig = {
    host: 'lynxlocal.mysql.uhserver.com',
    user: 'lynxlocal',
    password: 'jHAzhFG848@yN@U',
    database: 'lynxlocal'
};

async function run() {
    const conn = await mysql.createConnection(dbConfig);
    
    // carregar a função do server.js (gambiarra rápida pegando do arquivo)
    const serverCode = fs.readFileSync('src/server.js', 'utf8');
    
    // achar o código da função 
    const startIndex = serverCode.indexOf('async function recalcularQuantidadesTotais');
    // a função termina lá pela linha 16365
    // let's just do it manually by extracting the code
    
    const [rows] = await conn.execute(`SELECT IdOrdemServico FROM ordemservico WHERE IdOrdemServico = 33`);
    if(rows.length > 0) {
        // vou colocar o fetch() no server.js local pra trigar a API
        // actually, no, we can just make a dummy PUT request to one of the items!
        // wait, I don't have the API running here locally. I will just use fetch against localhost
    }
    await conn.end();
}

run().catch(console.error);
