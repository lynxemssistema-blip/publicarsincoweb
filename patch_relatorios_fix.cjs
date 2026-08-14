const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'src', 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

if (!serverContent.includes('./routes/relatorioOs')) {
    serverContent = serverContent.replace("app.listen(PORT, '0.0.0.0', async () => {", 
`// Rota de relatórios de OS adicionada dinamicamente
app.use('/api/ordemservico', tenantMiddleware, require('./routes/relatorioOs'));

app.listen(PORT, '0.0.0.0', async () => {`);
    fs.writeFileSync(serverFile, serverContent);
    console.log('server.js modificado para usar relatorioOs.js com sucesso real.');
} else {
    console.log('server.js já contém o import de relatorioOs.js');
}
