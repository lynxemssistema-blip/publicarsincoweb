const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/server.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const \[rows\] = await req\.tenantDbPool\.execute\(\`[\s\S]*?LIMIT 300\s*\`\);/g;

const newQuery = `const [rows] = await req.tenantDbPool.execute(\`
            SELECT
                p.IdProjeto, p.Projeto, p.DescProjeto, 
                CASE WHEN TRIM(COALESCE(p.DescEmpresa, '')) IN ('', 'Sem cliente', 'Sem Cliente', 'SEM CLIENTE') THEN p.ClienteProjeto ELSE p.DescEmpresa END as DescEmpresa,
                p.DataPrevisao, p.DataCriacao,
                TRIM(p.Finalizado) as Finalizado, p.DataFinalizado, p.liberado, p.StatusProj, p.DescStatus,

                /* -- Tags / Pecas -- */
                COUNT(DISTINCT t.IdTag) AS QtdeTags,
                COALESCE(p.QtdeTagsExecutadas, 0) AS QtdeTagsExecutadas,
                COALESCE(p.QtdePecasExecutadas, 0) AS QtdePecasExecutadas,
                COALESCE(SUM(CAST(NULLIF(t.qtdetotal,'') AS DECIMAL(10,2))), 0) AS qtdetotalpecas,

                COALESCE(agg_os.QtdePecasTags, 0) AS QtdePecasTags,
                COALESCE(agg_os.QtdeOS, 0) AS QtdeOS,
                
                COALESCE(agg_rnc.TotalRnc, 0) AS TotalRnc,
                COALESCE(agg_rnc.qtdernc, 0) AS qtdernc,
                COALESCE(agg_rnc.qtderncPendente, 0) AS qtderncPendente,
                COALESCE(agg_rnc.qtderncFinalizada, 0) AS qtderncFinalizada,

                /* -- Aggregated Sectors -- */
                COALESCE(agg_osi.TotalCorte, 0) AS TotalCorte,
                COALESCE(agg_osi.ExecCorte, 0) AS ExecCorte,
                agg_osi.PlanejadoInicioCorte, agg_osi.PlanejadoFinalCorte,
                agg_osi.RealizadoInicioCorte, agg_osi.RealizadoFinalCorte,
                COALESCE(agg_osi.flagCorte, 0) AS flagCorte,

                COALESCE(agg_osi.TotalDobra, 0) AS TotalDobra,
                COALESCE(agg_osi.ExecDobra, 0) AS ExecDobra,
                agg_osi.PlanejadoInicioDobra, agg_osi.PlanejadoFinalDobra,
                agg_osi.RealizadoInicioDobra, agg_osi.RealizadoFinalDobra,
                COALESCE(agg_osi.flagDobra, 0) AS flagDobra,

                COALESCE(agg_osi.TotalSolda, 0) AS TotalSolda,
                COALESCE(agg_osi.ExecSolda, 0) AS ExecSolda,
                agg_osi.PlanejadoInicioSolda, agg_osi.PlanejadoFinalSolda,
                agg_osi.RealizadoInicioSolda, agg_osi.RealizadoFinalSolda,
                COALESCE(agg_osi.flagSolda, 0) AS flagSolda,

                COALESCE(agg_osi.TotalPintura, 0) AS TotalPintura,
                COALESCE(agg_osi.ExecPintura, 0) AS ExecPintura,
                agg_osi.PlanejadoInicioPintura, agg_osi.PlanejadoFinalPintura,
                agg_osi.RealizadoInicioPintura, agg_osi.RealizadoFinalPintura,
                COALESCE(agg_osi.flagPintura, 0) AS flagPintura,

                COALESCE(agg_osi.TotalMontagem, 0) AS TotalMontagem,
                COALESCE(agg_osi.ExecMontagem, 0) AS ExecMontagem,
                agg_osi.PlanejadoInicioMontagem, agg_osi.PlanejadoFinalMontagem,
                agg_osi.RealizadoInicioMontagem, agg_osi.RealizadoFinalMontagem,
                COALESCE(agg_osi.flagMontagem, 0) AS flagMontagem,

                COALESCE(agg_osi.TotalCorteaLaser, 0) AS TotalCorteaLaser,
                COALESCE(agg_osi.ExecCorteaLaser, 0) AS ExecCorteaLaser,
                agg_osi.PlanejadoInicioCorteaLaser, agg_osi.PlanejadoFinalCorteaLaser,
                agg_osi.RealizadoInicioCorteaLaser, agg_osi.RealizadoFinalCorteaLaser,
                COALESCE(agg_osi.flagCorteaLaser, 0) AS flagCorteaLaser,

                COALESCE(agg_osi.TotalPunsionadeira, 0) AS TotalPunsionadeira,
                COALESCE(agg_osi.ExecPunsionadeira, 0) AS ExecPunsionadeira,
                agg_osi.PlanejadoInicioPUNSIONADEIRA AS PlanejadoInicioPunsionadeira, agg_osi.PlanejadoFinalPUNSIONADEIRA AS PlanejadoFinalPunsionadeira,
                agg_osi.RealizadoInicioPUNSIONADEIRA AS RealizadoInicioPunsionadeira, agg_osi.RealizadoFinalPUNSIONADEIRA AS RealizadoFinalPunsionadeira,
                COALESCE(agg_osi.flagPunsionadeira, 0) AS flagPunsionadeira,

                COALESCE(agg_osi.TotalGalvanizar, 0) AS TotalGalvanizar,
                COALESCE(agg_osi.ExecGalvanizar, 0) AS ExecGalvanizar,
                agg_osi.PlanejadoInicioGALVANIZAR AS PlanejadoInicioGalvanizar, agg_osi.PlanejadoFinalGALVANIZAR AS PlanejadoFinalGalvanizar,
                agg_osi.RealizadoInicioGALVANIZAR AS RealizadoInicioGalvanizar, agg_osi.RealizadoFinalGALVANIZAR AS RealizadoFinalGalvanizar,
                COALESCE(agg_osi.flagGalvanizar, 0) AS flagGalvanizar

            FROM projetos p

            LEFT JOIN tags t ON t.IdProjeto = p.IdProjeto
                AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')

            LEFT JOIN (
            SELECT 
                os.IdProjeto,
                SUM(os.QtdeTotalItens) AS QtdePecasTags,
                COUNT(DISTINCT CASE WHEN (os.IdTag IS NOT NULL AND os.IdTag != '') THEN os.IdOrdemServico END) AS QtdeOS
            FROM ordemservico os
            WHERE (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')
            GROUP BY os.IdProjeto
            ) agg_os ON agg_os.IdProjeto = p.IdProjeto

            LEFT JOIN (
            SELECT 
                r.IdProjeto,
                COUNT(*) AS qtdernc,
                SUM(CASE WHEN r.Estatus = 'PENDENCIA' THEN 1 ELSE 0 END) AS TotalRnc,
                SUM(CASE WHEN r.Estatus = 'PENDENCIA' OR r.Estatus IS NULL OR r.Estatus = '' THEN 1 ELSE 0 END) AS qtderncPendente,
                SUM(CASE WHEN r.Estatus LIKE '%FIN%' OR r.Estatus = 'FINALIZADA' THEN 1 ELSE 0 END) AS qtderncFinalizada
            FROM ordemservicoitempendencia r
            WHERE (r.D_E_L_E_T_E IS NULL OR r.D_E_L_E_T_E <> '*')
            GROUP BY r.IdProjeto
            ) agg_rnc ON agg_rnc.IdProjeto = p.IdProjeto

            LEFT JOIN (
            SELECT 
                os.IdProjeto,
                
                SUM(CASE WHEN osi.txtCorte = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalCorte,
                SUM(CASE WHEN osi.txtCorte = '1' THEN CAST(NULLIF(osi.CorteTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecCorte,
                MIN(osi.PlanejadoInicioCorte) AS PlanejadoInicioCorte, MAX(osi.PlanejadoFinalCorte) AS PlanejadoFinalCorte,
                MIN(osi.RealizadoInicioCorte) AS RealizadoInicioCorte, MAX(osi.RealizadoFinalCorte) AS RealizadoFinalCorte,
                MAX(CASE WHEN osi.txtCorte = '1' OR osi.txtCorte = 'S' THEN 1 ELSE 0 END) AS flagCorte,

                SUM(CASE WHEN osi.txtDobra = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalDobra,
                SUM(CASE WHEN osi.txtDobra = '1' THEN CAST(NULLIF(osi.DobraTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecDobra,
                MIN(osi.PlanejadoInicioDobra) AS PlanejadoInicioDobra, MAX(osi.PlanejadoFinalDobra) AS PlanejadoFinalDobra,
                MIN(osi.RealizadoInicioDobra) AS RealizadoInicioDobra, MAX(osi.RealizadoFinalDobra) AS RealizadoFinalDobra,
                MAX(CASE WHEN osi.txtDobra = '1' OR osi.txtDobra = 'S' THEN 1 ELSE 0 END) AS flagDobra,

                SUM(CASE WHEN osi.txtSolda = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalSolda,
                SUM(CASE WHEN osi.txtSolda = '1' THEN CAST(NULLIF(osi.SoldaTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecSolda,
                MIN(osi.PlanejadoInicioSolda) AS PlanejadoInicioSolda, MAX(osi.PlanejadoFinalSolda) AS PlanejadoFinalSolda,
                MIN(osi.RealizadoInicioSolda) AS RealizadoInicioSolda, MAX(osi.RealizadoFinalSolda) AS RealizadoFinalSolda,
                MAX(CASE WHEN osi.txtSolda = '1' OR osi.txtSolda = 'S' THEN 1 ELSE 0 END) AS flagSolda,

                SUM(CASE WHEN osi.txtPintura = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalPintura,
                SUM(CASE WHEN osi.txtPintura = '1' THEN CAST(NULLIF(osi.PinturaTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecPintura,
                MIN(osi.PlanejadoInicioPintura) AS PlanejadoInicioPintura, MAX(osi.PlanejadoFinalPintura) AS PlanejadoFinalPintura,
                MIN(osi.RealizadoInicioPintura) AS RealizadoInicioPintura, MAX(osi.RealizadoFinalPintura) AS RealizadoFinalPintura,
                MAX(CASE WHEN osi.txtPintura = '1' OR osi.txtPintura = 'S' THEN 1 ELSE 0 END) AS flagPintura,

                SUM(CASE WHEN osi.TxtMontagem = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalMontagem,
                SUM(CASE WHEN osi.TxtMontagem = '1' THEN CAST(NULLIF(osi.MontagemTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecMontagem,
                MIN(osi.PlanejadoInicioMontagem) AS PlanejadoInicioMontagem, MAX(osi.PlanejadoFinalMontagem) AS PlanejadoFinalMontagem,
                MIN(osi.RealizadoInicioMontagem) AS RealizadoInicioMontagem, MAX(osi.RealizadoFinalMontagem) AS RealizadoFinalMontagem,
                MAX(CASE WHEN osi.TxtMontagem = '1' OR osi.TxtMontagem = 'S' THEN 1 ELSE 0 END) AS flagMontagem,

                SUM(CASE WHEN osi.txtCorteaLaser = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalCorteaLaser,
                SUM(CASE WHEN osi.txtCorteaLaser = '1' THEN CAST(NULLIF(osi.CorteaLaserTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecCorteaLaser,
                MIN(osi.PlanejadoInicioCorteaLaser) AS PlanejadoInicioCorteaLaser, MAX(osi.PlanejadoFinalCorteaLaser) AS PlanejadoFinalCorteaLaser,
                MIN(osi.RealizadoInicioCorteaLaser) AS RealizadoInicioCorteaLaser, MAX(osi.RealizadoFinalCorteaLaser) AS RealizadoFinalCorteaLaser,
                MAX(CASE WHEN osi.txtCorteaLaser = '1' OR osi.txtCorteaLaser = 'S' THEN 1 ELSE 0 END) AS flagCorteaLaser,

                SUM(CASE WHEN osi.txtPUNSIONADEIRA = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalPunsionadeira,
                SUM(CASE WHEN osi.txtPUNSIONADEIRA = '1' THEN CAST(NULLIF(osi.PUNSIONADEIRATotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecPunsionadeira,
                MIN(osi.PlanejadoInicioPUNSIONADEIRA) AS PlanejadoInicioPUNSIONADEIRA, MAX(osi.PlanejadoFinalPUNSIONADEIRA) AS PlanejadoFinalPUNSIONADEIRA,
                MIN(osi.RealizadoInicioPUNSIONADEIRA) AS RealizadoInicioPUNSIONADEIRA, MAX(osi.RealizadoFinalPUNSIONADEIRA) AS RealizadoFinalPUNSIONADEIRA,
                MAX(CASE WHEN osi.txtPUNSIONADEIRA = '1' OR osi.txtPUNSIONADEIRA = 'S' THEN 1 ELSE 0 END) AS flagPunsionadeira,

                SUM(CASE WHEN osi.txtGALVANIZAR = '1' THEN CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2)) ELSE 0 END) AS TotalGalvanizar,
                SUM(CASE WHEN osi.txtGALVANIZAR = '1' THEN CAST(NULLIF(osi.GALVANIZARTotalExecutado,'') AS DECIMAL(10,2)) ELSE 0 END) AS ExecGalvanizar,
                MIN(osi.PlanejadoInicioGALVANIZAR) AS PlanejadoInicioGALVANIZAR, MAX(osi.PlanejadoFinalGALVANIZAR) AS PlanejadoFinalGALVANIZAR,
                MIN(osi.RealizadoInicioGALVANIZAR) AS RealizadoInicioGALVANIZAR, MAX(osi.RealizadoFinalGALVANIZAR) AS RealizadoFinalGALVANIZAR,
                MAX(CASE WHEN osi.txtGALVANIZAR = '1' OR osi.txtGALVANIZAR = 'S' THEN 1 ELSE 0 END) AS flagGalvanizar

            FROM ordemservicoitem osi 
            INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
            WHERE (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')
            GROUP BY os.IdProjeto
            ) agg_osi ON agg_osi.IdProjeto = p.IdProjeto

            WHERE \${where}
            
            GROUP BY p.IdProjeto, agg_os.QtdePecasTags, agg_os.QtdeOS, agg_rnc.TotalRnc, agg_rnc.qtdernc, agg_rnc.qtderncPendente, agg_rnc.qtderncFinalizada, agg_osi.TotalCorte, agg_osi.ExecCorte, agg_osi.PlanejadoInicioCorte, agg_osi.PlanejadoFinalCorte, agg_osi.RealizadoInicioCorte, agg_osi.RealizadoFinalCorte, agg_osi.flagCorte, agg_osi.TotalDobra, agg_osi.ExecDobra, agg_osi.PlanejadoInicioDobra, agg_osi.PlanejadoFinalDobra, agg_osi.RealizadoInicioDobra, agg_osi.RealizadoFinalDobra, agg_osi.flagDobra, agg_osi.TotalSolda, agg_osi.ExecSolda, agg_osi.PlanejadoInicioSolda, agg_osi.PlanejadoFinalSolda, agg_osi.RealizadoInicioSolda, agg_osi.RealizadoFinalSolda, agg_osi.flagSolda, agg_osi.TotalPintura, agg_osi.ExecPintura, agg_osi.PlanejadoInicioPintura, agg_osi.PlanejadoFinalPintura, agg_osi.RealizadoInicioPintura, agg_osi.RealizadoFinalPintura, agg_osi.flagPintura, agg_osi.TotalMontagem, agg_osi.ExecMontagem, agg_osi.PlanejadoInicioMontagem, agg_osi.PlanejadoFinalMontagem, agg_osi.RealizadoInicioMontagem, agg_osi.RealizadoFinalMontagem, agg_osi.flagMontagem, agg_osi.TotalCorteaLaser, agg_osi.ExecCorteaLaser, agg_osi.PlanejadoInicioCorteaLaser, agg_osi.PlanejadoFinalCorteaLaser, agg_osi.RealizadoInicioCorteaLaser, agg_osi.RealizadoFinalCorteaLaser, agg_osi.flagCorteaLaser, agg_osi.TotalPunsionadeira, agg_osi.ExecPunsionadeira, agg_osi.PlanejadoInicioPUNSIONADEIRA, agg_osi.PlanejadoFinalPUNSIONADEIRA, agg_osi.RealizadoInicioPUNSIONADEIRA, agg_osi.RealizadoFinalPUNSIONADEIRA, agg_osi.flagPunsionadeira, agg_osi.TotalGalvanizar, agg_osi.ExecGalvanizar, agg_osi.PlanejadoInicioGALVANIZAR, agg_osi.PlanejadoFinalGALVANIZAR, agg_osi.RealizadoInicioGALVANIZAR, agg_osi.RealizadoFinalGALVANIZAR, agg_osi.flagGalvanizar

            ORDER BY p.IdProjeto DESC
            LIMIT 300
        \`);`;

if (content.match(regex)) {
  content = content.replace(regex, newQuery);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully replaced the massive query in server.js');
} else {
  console.error('Regex did not match!');
}
