const fs = require('fs');

let s = fs.readFileSync('src/server.js', 'utf8');

// 1. Re-apply ORDER BY fix
s = s.replace(
    "ORDER BY mp.SequenciaExecucao ASC, mp.IdMaterialProcesso ASC`,",
    "ORDER BY COALESCE(mp.IdOrdemServico, 0) ASC, COALESCE(mp.IdTag, 0) ASC, COALESCE(mp.IdProjeto, 0) ASC, mp.SequenciaExecucao ASC, mp.IdMaterialProcesso ASC`,"
);

// 2. Extract getRoute
let r = fs.readFileSync('scripts/add_rota2.js', 'utf8');
let routeCode = r.split('const getRoute = `')[1].split('`;')[0];

// 3. Unescape
routeCode = routeCode.replace(/\\`/g, '`');
routeCode = routeCode.replace(/\\\$/g, '$');
// Fix the REPLACE syntax error
routeCode = routeCode.replace("REPLACE(LOWER(Descricao), \\' \\', \\'\\')", "REPLACE(LOWER(Descricao), ' ', '')");

// 4. Inject
if (!s.includes('/api/material-processo/apontamentos/:recurso')) {
    s = s.replace("app.get('/api/apontamento/mapa/producao'", routeCode + "\n\napp.get('/api/apontamento/mapa/producao'");
}

fs.writeFileSync('src/server.js', s);
console.log('Clean injection done');
