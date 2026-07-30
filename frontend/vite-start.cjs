// Wrapper CJS para iniciar o Vite dev server via PM2 no Windows
// O frontend usa "type":"module" entao este arquivo deve ser .cjs
const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname);

console.log('[ViteWrapper] Iniciando Vite em:', frontendDir);

// Usa npm run dev para garantir que o Vite seja encontrado corretamente
const vite = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development', FORCE_COLOR: '0' }
});

vite.stdout.on('data', (data) => {
    process.stdout.write(data);
});

vite.stderr.on('data', (data) => {
    process.stderr.write(data);
});

vite.on('error', (err) => {
    console.error('[ViteWrapper] Erro ao iniciar Vite:', err.message);
    process.exit(1);
});

vite.on('exit', (code) => {
    console.log('[ViteWrapper] Vite encerrou com codigo', code);
    process.exit(code ?? 0);
});

process.on('SIGINT',  () => { vite.kill('SIGINT');  });
process.on('SIGTERM', () => { vite.kill('SIGTERM'); });
