const fs = require('fs');

const file = './src/server.js';
let content = fs.readFileSync(file, 'utf8');

const target = `app.post('/api/login', loginLimiter, async (req, res) => {
    const { login, senha, password, banco } = req.body;
    const pwd = senha || password;

    if (!login || !pwd) {`;

const replacement = `app.post('/api/login', loginLimiter, async (req, res) => {
    const { login, senha, password, banco } = req.body;
    const pwd = senha || password;

    if (login && String(login).trim().toLowerCase() === 'admin') {
        console.warn(\`[AUTH_BLOCKED] Tentativa de login bloqueada para o usuário 'admin' a partir do IP: \${req.ip}\`);
        return res.status(403).json({ success: false, message: "Acesso não permitido para o usuário 'admin'. Utilize suas credenciais corporativas pessoais." });
    }

    if (!login || !pwd) {`;

const contentNormalized = content.replace(/\r\n/g, '\n');
const targetNormalized = target.replace(/\r\n/g, '\n');
const replacementNormalized = replacement.replace(/\r\n/g, '\n');

if (contentNormalized.includes(targetNormalized)) {
    const updated = contentNormalized.replace(targetNormalized, replacementNormalized);
    fs.writeFileSync(file, updated, 'utf8');
    console.log('✅ Admin block successfully inserted into src/server.js!');
} else {
    console.log('❌ Target string not found in src/server.js');
}
