const http = require('http');

const data = JSON.stringify({
    processofabricacao: 'CORTE',
    CodigoProcessoFabricacao: '',
    Fabrica: 'SIM',
    DataLiberada: 'NAO',
    Setup: 0,
    TempoPadrao: 0
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/recursos/1',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test', // Mock or real token needed? We might get 401.
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => { console.log(`Status: ${res.statusCode}`, responseBody); });
});

req.on('error', (e) => { console.error(`Problem with request: ${e.message}`); });
req.write(data);
req.end();
