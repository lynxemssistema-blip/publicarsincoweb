const fs = require('fs');

const content = fs.readFileSync('./src/server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('/api/acompanhamento/projetos')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
        // Print 30 lines after
        for (let i = 1; i <= 40; i++) {
            if (lines[idx + i]) {
                console.log(`Line ${idx + 1 + i}: ${lines[idx + i]}`);
            }
        }
    }
});
