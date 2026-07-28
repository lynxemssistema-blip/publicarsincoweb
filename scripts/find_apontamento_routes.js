const fs = require('fs');
const content = fs.readFileSync('./src/server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('/api/apontamento') || line.includes('apontament')) {
    if (line.includes('app.post') || line.includes('app.delete') || line.includes('app.put')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
