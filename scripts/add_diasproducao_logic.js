const fs = require('fs');

const path = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/src/server.js';
let code = fs.readFileSync(path, 'utf8');

// I will find the SECTORS_DB and add diasProd to it
const regexDB = /const SECTORS_DB = \{[\s\S]*?\};/;
const newDB = `const SECTORS_DB = {
          'Corte': { osTxt: 'txtCorte', planIni: 'PlanejadoInicioCorte', planFim: 'PlanejadoFinalCorte', diasProd: 'CorteDiasProducao' },
          'Dobra': { osTxt: 'txtDobra', planIni: 'PlanejadoInicioDobra', planFim: 'PlanejadoFinalDobra', diasProd: 'DobraDiasProducao' },
          'Solda': { osTxt: 'txtSolda', planIni: 'PlanejadoInicioSolda', planFim: 'PlanejadoFinalSolda', diasProd: 'SoldaDiasProducao' },
          'Pintura': { osTxt: 'txtPintura', planIni: 'PlanejadoInicioPintura', planFim: 'PlanejadoFinalPintura', diasProd: 'PinturaDiasProducao' },
          'Montagem': { osTxt: 'TxtMontagem', planIni: 'PlanejadoInicioMontagem', planFim: 'PlanejadoFinalMontagem', diasProd: 'MontagemDiasProducao' },
          'Punsionadeira': { osTxt: 'txtPUNSIONADEIRA', planIni: 'PlanejadoInicioPUNSIONADEIRA', planFim: 'PlanejadoFinalPUNSIONADEIRA', diasProd: 'PunsionadeiraDiasProducao' },
          'CorteaLaser': { osTxt: 'txtCorteaLaser', planIni: 'PlanejadoInicioCorteaLaser', planFim: 'PlanejadoFinalCorteaLaser', diasProd: 'CorteaLaserDiasProducao' },
          'Galvanizar': { osTxt: 'txtGALVANIZAR', planIni: 'PlanejadoInicioGALVANIZAR', planFim: 'PlanejadoFinalGALVANIZAR', diasProd: 'GalvanizarDiasProducao' }
        };`;
code = code.replace(regexDB, newDB);

// Now I will find where setClauseTags is executed and append diasProd
const regexUpdate = /if \(setClauseTags\.length > 0\) \{/g;
code = code.replace(regexUpdate, `
                if (iniBr || fimBr) {
                    setClauseTags.push(\`\${sec.diasProd} = DATEDIFF(STR_TO_DATE(\${sec.planFim}, '%d/%m/%Y'), STR_TO_DATE(\${sec.planIni}, '%d/%m/%Y'))\`);
                }
                if (setClauseTags.length > 0) {`);

// Now for setClauseOsi
const regexUpdateOsi = /if \(setClauseOsi\.length > 0\) \{/g;
code = code.replace(regexUpdateOsi, `
                if (iniBr || fimBr) {
                    setClauseOsi.push(\`osi.\${sec.diasProd} = DATEDIFF(STR_TO_DATE(osi.\${sec.planFim}, '%d/%m/%Y'), STR_TO_DATE(osi.\${sec.planIni}, '%d/%m/%Y'))\`);
                }
                if (setClauseOsi.length > 0) {`);

fs.writeFileSync(path, code);
console.log('Patched DiasProducao in datas-planejamento endpoint');
