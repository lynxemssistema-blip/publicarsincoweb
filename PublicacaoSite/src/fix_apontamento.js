const fs = require('fs');
const file = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/src/server.js';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /app\.get\('\/api\/apontamento\/:setor', async \(req, res\) => \{\r?\n\s*const setor = req\.params\.setor\.toLowerCase\(\);\r?\n\s*const setorConfig = setorColumns\[setor\];\r?\n\r?\n\s*if \(!setorConfig\) \{\r?\n\s*return res\.status\(400\)\.json\(\{[\s\S]*?\}\);\r?\n\s*\}\r?\n/;
const r1Replace = `app.get('/api/apontamento/:setor', async (req, res) => {
    const setor = req.params.setor.toLowerCase();
    let setorConfig = setorColumns[setor];

    if (!setorConfig) {
        const cap = setor.charAt(0).toUpperCase() + setor.slice(1);
        setorConfig = {
            txt: 'txt'+cap, percentual: cap+'Percentual', status: 'sttxt'+cap,
            total: cap+'TotalExecutado', executar: cap+'TotalExecutar',
            inicio: 'RealizadoInicio'+cap, final: 'RealizadoFinal'+cap,
            userInicio: 'UsuarioRealizadoInicio'+cap, userFinal: 'UsuarioRealizadoFinal'+cap
        };
    }\n`;
content = content.replace(regex1, r1Replace);

const regex2 = /app\.get\('\/api\/apontamento\/item\/:id\/:processo', async \(req, res\) => \{\r?\n\s*const \{ id, processo \} = req\.params;\r?\n\s*const isAll = processo\.toLowerCase\(\) === 'all';\r?\n\s*const setorConfig = setorColumns\[processo\.toLowerCase\(\)\] \|\| setorColumns\['mapa'\];.*?\r?\n/;
const r2Replace = `app.get('/api/apontamento/item/:id/:processo', async (req, res) => {
    const { id, processo } = req.params;
    const isAll = processo.toLowerCase() === 'all';
    let setorConfig = setorColumns[processo.toLowerCase()];
    if (!setorConfig && !isAll) {
        const cap = processo.charAt(0).toUpperCase() + processo.slice(1).toLowerCase();
        setorConfig = {
            txt: 'txt'+cap, percentual: cap+'Percentual', status: 'sttxt'+cap,
            total: cap+'TotalExecutado', executar: cap+'TotalExecutar',
            inicio: 'RealizadoInicio'+cap, final: 'RealizadoFinal'+cap,
            userInicio: 'UsuarioRealizadoInicio'+cap, userFinal: 'UsuarioRealizadoFinal'+cap
        };
    } else if (!setorConfig) {
        setorConfig = setorColumns['mapa'];
    }\n`;
content = content.replace(regex2, r2Replace);

const regex3 = /const currentSetorConfig = setorColumns\[setor\.toLowerCase\(\)\];/;
const r3Replace = `let currentSetorConfig = setorColumns[setor.toLowerCase()];
        if (!currentSetorConfig) {
            const cap = setor.charAt(0).toUpperCase() + setor.slice(1).toLowerCase();
            currentSetorConfig = {
                txt: 'txt'+cap, percentual: cap+'Percentual', status: 'sttxt'+cap,
                total: cap+'TotalExecutado', executar: cap+'TotalExecutar',
                inicio: 'RealizadoInicio'+cap, final: 'RealizadoFinal'+cap,
                userInicio: 'UsuarioRealizadoInicio'+cap, userFinal: 'UsuarioRealizadoFinal'+cap
            };
        }`;
content = content.replace(regex3, r3Replace);

const regex4 = /const proximoSetorConfig = proximoSetor \? setorColumns\[proximoSetor\.toLowerCase\(\)\] : null;/;
const r4Replace = `let proximoSetorConfig = null;
        if (proximoSetor) {
            proximoSetorConfig = setorColumns[proximoSetor.toLowerCase()];
            if (!proximoSetorConfig) {
                const cap = proximoSetor.charAt(0).toUpperCase() + proximoSetor.slice(1).toLowerCase();
                proximoSetorConfig = {
                    txt: 'txt'+cap, percentual: cap+'Percentual', status: 'sttxt'+cap,
                    total: cap+'TotalExecutado', executar: cap+'TotalExecutar',
                    inicio: 'RealizadoInicio'+cap, final: 'RealizadoFinal'+cap,
                    userInicio: 'UsuarioRealizadoInicio'+cap, userFinal: 'UsuarioRealizadoFinal'+cap
                };
            }
        }`;
content = content.replace(regex4, r4Replace);

fs.writeFileSync(file, content);
console.log('Modified server.js successfully');
