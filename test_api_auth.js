const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        const token = json.token;
        console.log('Got token:', !!token);
        
        const req2 = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/ordemservico/1/itens',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'tenant': 'lynxlocal'
            }
        }, res2 => {
            let data2 = '';
            res2.on('data', d => data2 += d);
            res2.on('end', () => {
                const j2 = JSON.parse(data2);
                console.log('Items returned:', j2.data ? j2.data.length : j2);
                if(j2.data && j2.data.length > 0) console.log(j2.data.map(i => i.CodMatFabricante));
            });
        });
        req2.end();
    } catch(e) {
        console.error('Error parsing login:', e);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({ username: 'superadmin', password: '123' }));
req.end();
