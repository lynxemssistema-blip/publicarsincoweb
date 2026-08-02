const fs = require('fs');

function buildFields(prefix, tableAlias, parentTableAlias) {
    const sectors = ['Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem', 'CorteaLaser', 'Pulsionadeira', 'Galvanizar', 'Engenharia'];
    let str = '';
    for (const sec of sectors) {
        str += `
                    ${sec}TempoSetup = (SELECT COALESCE(SUM(${tableAlias}.${sec}TempoSetup), 0) FROM ${parentTableAlias} ${tableAlias} WHERE ${tableAlias}.${prefix} = t.${prefix} AND (${tableAlias}.D_E_L_E_T_E IS NULL OR ${tableAlias}.D_E_L_E_T_E = '' OR ${tableAlias}.D_E_L_E_T_E = ' ')),
                    ${sec}TotalSetup = (SELECT COALESCE(SUM(${tableAlias}.${sec}TotalSetup), 0) FROM ${parentTableAlias} ${tableAlias} WHERE ${tableAlias}.${prefix} = t.${prefix} AND (${tableAlias}.D_E_L_E_T_E IS NULL OR ${tableAlias}.D_E_L_E_T_E = '' OR ${tableAlias}.D_E_L_E_T_E = ' ')),
                    ${sec}TempoPadrao = (SELECT COALESCE(SUM(${tableAlias}.${sec}TempoPadrao), 0) FROM ${parentTableAlias} ${tableAlias} WHERE ${tableAlias}.${prefix} = t.${prefix} AND (${tableAlias}.D_E_L_E_T_E IS NULL OR ${tableAlias}.D_E_L_E_T_E = '' OR ${tableAlias}.D_E_L_E_T_E = ' ')),
                    ${sec}TotalPadrao = (SELECT COALESCE(SUM(${tableAlias}.${sec}TotalPadrao), 0) FROM ${parentTableAlias} ${tableAlias} WHERE ${tableAlias}.${prefix} = t.${prefix} AND (${tableAlias}.D_E_L_E_T_E IS NULL OR ${tableAlias}.D_E_L_E_T_E = '' OR ${tableAlias}.D_E_L_E_T_E = ' ')),
                    ${sec}TotalTempo = (SELECT COALESCE(SUM(${tableAlias}.${sec}TotalTempo), 0) FROM ${parentTableAlias} ${tableAlias} WHERE ${tableAlias}.${prefix} = t.${prefix} AND (${tableAlias}.D_E_L_E_T_E IS NULL OR ${tableAlias}.D_E_L_E_T_E = '' OR ${tableAlias}.D_E_L_E_T_E = ' ')),
                    ${sec}DiasProducao = (SELECT CASE WHEN SUM(${tableAlias}.${sec}TotalTempo) > 0 THEN CEIL(SUM(${tableAlias}.${sec}TotalTempo) / 480) ELSE 0 END FROM ${parentTableAlias} ${tableAlias} WHERE ${tableAlias}.${prefix} = t.${prefix} AND (${tableAlias}.D_E_L_E_T_E IS NULL OR ${tableAlias}.D_E_L_E_T_E = '' OR ${tableAlias}.D_E_L_E_T_E = ' ')),`;
    }
    return str;
}

const tagsInjection = buildFields('IdTag', 'os', 'ordemservico').replace(/t\.IdTag/g, 't.IdTag');
const projInjection = buildFields('IdProjeto', 't2', 'tags').replace(/t\.IdProjeto/g, 'p.IdProjeto').replace(/t2\.IdProjeto = t\.IdProjeto/g, 't2.IdProjeto = p.IdProjeto');


let file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('GalvanizarTempoSetup = (SELECT COALESCE(SUM(os.GalvanizarTempoSetup)')) {
    const tagAnchor = "CorteTotalExecutado = (SELECT COALESCE(SUM(os.CorteTotalExecutado), 0) FROM ordemservico os WHERE os.IdTag = t.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),";
    content = content.replace(tagAnchor, tagsInjection + '\n                    ' + tagAnchor);
    
    const projAnchor = "CorteTotalExecutado = (SELECT COALESCE(SUM(t.CorteTotalExecutado), 0) FROM tags t WHERE t.IdProjeto = p.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),";
    content = content.replace(projAnchor, projInjection + '\n                    ' + projAnchor);

    fs.writeFileSync(file, content, 'utf8');
    console.log("Patched server.js with cascata sum logic.");
} else {
    console.log("Already patched.");
}
