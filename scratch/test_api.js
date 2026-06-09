const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/apontamento/dobra',
    method: 'GET',
    headers: {
        'x-tenant-db': 'amceletrica'
    }
};

const start = Date.now();
const req = http.request(options, res => {
    let data = '';
    res.on('data', d => {
        data += d;
    });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Time taken:', Date.now() - start, 'ms');
        
        try {
            const json = JSON.parse(data);
            console.log('Success:', json.success);
            console.log('Rows returned:', json.data.length);
            console.log('Total pagination:', json.pagination.total);
            if(json.data.length > 0) {
                console.log('First Item QtdeProduzidaHistory:', json.data[0].QtdeProduzidaHistory);
                console.log('First Item NomeProdutoPrincipal:', json.data[0].NomeProdutoPrincipal);
            }
        } catch(e) {
            console.log('Failed to parse JSON:', data.substring(0, 100));
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
