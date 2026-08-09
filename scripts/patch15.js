const fs = require('fs');
const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /let whereClause,\s*whereArgs;\s*if\s*\(\s*itemIdMaterial\s*>\s*0\s*\)\s*\{\s*whereClause\s*=\s*'IdMaterial\s*=\s*\?\s*AND\s*IdProcesso\s*=\s*\?';\s*whereArgs\s*=\s*\[itemIdMaterial,\s*vals.IdProcesso\];\s*\}\s*else\s*\{\s*whereClause\s*=\s*'codmatFabricante\s*=\s*\?\s*AND\s*IdProcesso\s*=\s*\?';\s*whereArgs\s*=\s*\[itemCodMatFabricante\s*\|\|\s*'',\s*vals.IdProcesso\];\s*\}/g;

const regex2 = /let maxWhereClause,\s*maxWhereArgs;\s*if\s*\(\s*itemIdMaterial\s*>\s*0\s*\)\s*\{\s*maxWhereClause\s*=\s*'IdMaterial\s*=\s*\?';\s*maxWhereArgs\s*=\s*\[itemIdMaterial\];\s*\}\s*else\s*\{\s*maxWhereClause\s*=\s*'codmatFabricante\s*=\s*\?';\s*maxWhereArgs\s*=\s*\[itemCodMatFabricante\s*\|\|\s*''\];\s*\}/g;

content = content.replace(regex1, `let whereClause = 'codmatFabricante = ? AND IdProcesso = ?';
                        let whereArgs = [itemCodMatFabricante || '', vals.IdProcesso];`);

content = content.replace(regex2, `let maxWhereClause = 'codmatFabricante = ?';
                let maxWhereArgs = [itemCodMatFabricante || ''];`);

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced successfully');
