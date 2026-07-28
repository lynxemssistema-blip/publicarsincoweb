const fs = require('fs');

const content = fs.readFileSync('./src/server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('ordemservico') || line.toLowerCase().includes('/api/')) {
        if (line.includes('app.get') || line.includes('app.post')) {
            console.log(`Line ${idx + 1}: ${line.trim()}`);
        }
    }
});
