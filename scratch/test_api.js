const http = require('http');

http.get('http://localhost:3032/api/apontamento/item/1/all', {
  headers: {
    'tenant-id': 'LYNXLOCAL'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
