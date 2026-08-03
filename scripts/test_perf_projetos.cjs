const db = require('../src/config/db.js');
const mysql = require('mysql2/promise');

async function testPerformance() {
  const [tenants] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE ativo = 1 AND db_name = "amceletrica"');
  const tenantRow = tenants[0];
  const pool = mysql.createPool({
    host: tenantRow.db_host,
    user: tenantRow.db_user,
    password: tenantRow.db_pass,
    database: tenantRow.db_name,
    port: tenantRow.db_port || 3306
  });

  const query = `
    SELECT
      p.IdProjeto, p.Projeto, p.DescProjeto, 
      CASE WHEN TRIM(COALESCE(p.DescEmpresa, '')) IN ('', 'Sem cliente', 'Sem Cliente', 'SEM CLIENTE') THEN p.ClienteProjeto ELSE p.DescEmpresa END as DescEmpresa,
      p.DataPrevisao, p.DataCriacao,
      TRIM(p.Finalizado) as Finalizado, p.DataFinalizado, p.liberado, p.StatusProj, p.DescStatus,

      /* -- Tags / Pecas nativos da tabela Projetos -- */
      COUNT(t.IdTag) AS QtdeTags,
      COALESCE(p.QtdeTagsExecutadas, 0) AS QtdeTagsExecutadas,
      COALESCE((SELECT SUM(os.QtdeTotalItens) FROM ordemservico os WHERE (os.IdProjeto = p.IdProjeto OR (os.Projeto = p.Projeto AND p.Projeto IS NOT NULL)) AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')), 0) AS QtdePecasTags,
      COALESCE(p.QtdePecasExecutadas, 0) AS QtdePecasExecutadas,

      /* -- OS Count -- conta apenas OS cujo IdTag pertence a uma tag do projeto */
      COALESCE((SELECT COUNT(*) FROM ordemservico os 
                 INNER JOIN tags t ON t.IdTag = os.IdTag 
                  AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')
                 WHERE t.IdProjeto = p.IdProjeto
                   AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')), 0) AS QtdeOS,

      /* -- RNC -- */
      COALESCE((SELECT COUNT(*) FROM ordemservicoitempendencia r
                 WHERE r.IdProjeto = p.IdProjeto
                   AND (r.D_E_L_E_T_E IS NULL OR r.D_E_L_E_T_E <> '*')
                   AND r.Estatus = 'PENDENCIA'), 0) AS TotalRnc,

      COALESCE((SELECT COUNT(*) FROM ordemservicoitempendencia r
                 WHERE r.IdProjeto = p.IdProjeto
                   AND (r.D_E_L_E_T_E IS NULL OR r.D_E_L_E_T_E <> '*')), 0) AS qtdernc,

      COALESCE((SELECT COUNT(*) FROM ordemservicoitempendencia r
                 WHERE r.IdProjeto = p.IdProjeto
                   AND (r.D_E_L_E_T_E IS NULL OR r.D_E_L_E_T_E <> '*')
                   AND (r.Estatus = 'PENDENCIA' OR r.Estatus IS NULL OR r.Estatus = '')), 0) AS qtderncPendente,

      COALESCE((SELECT COUNT(*) FROM ordemservicoitempendencia r
                 WHERE r.IdProjeto = p.IdProjeto
                   AND (r.D_E_L_E_T_E IS NULL OR r.D_E_L_E_T_E <> '*')
                   AND (r.Estatus LIKE '%FIN%' OR r.Estatus = 'FINALIZADA')), 0) AS qtderncFinalizada,
                   
      /* -- Novas req -- */
      COALESCE(SUM(CAST(NULLIF(t.qtdetotal,'') AS DECIMAL(10,2))), 0) AS qtdetotalpecas,

      /* -- Setor Corte -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtCorte = '1') AS TotalCorte,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.CorteTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtCorte = '1') AS ExecCorte,
      (SELECT MIN(osi.PlanejadoInicioCorte) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioCorte, 
      (SELECT MAX(osi.PlanejadoFinalCorte) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalCorte,
      (SELECT MIN(osi.RealizadoInicioCorte) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioCorte, 
      (SELECT MAX(osi.RealizadoFinalCorte) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalCorte,

      /* -- Setor Dobra -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtDobra = '1') AS TotalDobra,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.DobraTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtDobra = '1') AS ExecDobra,
      (SELECT MIN(osi.PlanejadoInicioDobra) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioDobra, 
      (SELECT MAX(osi.PlanejadoFinalDobra) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalDobra,
      (SELECT MIN(osi.RealizadoInicioDobra) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioDobra, 
      (SELECT MAX(osi.RealizadoFinalDobra) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalDobra,

      /* -- Setor Solda -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtSolda = '1') AS TotalSolda,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.SoldaTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtSolda = '1') AS ExecSolda,
      (SELECT MIN(osi.PlanejadoInicioSolda) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioSolda, 
      (SELECT MAX(osi.PlanejadoFinalSolda) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalSolda,
      (SELECT MIN(osi.RealizadoInicioSolda) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioSolda, 
      (SELECT MAX(osi.RealizadoFinalSolda) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalSolda,

      /* -- Setor Pintura -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtPintura = '1') AS TotalPintura,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.PinturaTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtPintura = '1') AS ExecPintura,
      (SELECT MIN(osi.PlanejadoInicioPintura) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioPintura, 
      (SELECT MAX(osi.PlanejadoFinalPintura) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalPintura,
      (SELECT MIN(osi.RealizadoInicioPintura) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioPintura, 
      (SELECT MAX(osi.RealizadoFinalPintura) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalPintura,

      /* -- Setor Montagem -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.TxtMontagem = '1') AS TotalMontagem,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.MontagemTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.TxtMontagem = '1') AS ExecMontagem,
      (SELECT MIN(osi.PlanejadoInicioMontagem) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioMontagem, 
      (SELECT MAX(osi.PlanejadoFinalMontagem) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalMontagem,
      (SELECT MIN(osi.RealizadoInicioMontagem) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioMontagem, 
      (SELECT MAX(osi.RealizadoFinalMontagem) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalMontagem,

      /* -- Setor Corte a Laser -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtCorteaLaser = '1') AS TotalCorteaLaser,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.CorteaLaserTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtCorteaLaser = '1') AS ExecCorteaLaser,
      (SELECT MIN(osi.PlanejadoInicioCorteaLaser) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioCorteaLaser, 
      (SELECT MAX(osi.PlanejadoFinalCorteaLaser) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalCorteaLaser,
      (SELECT MIN(osi.RealizadoInicioCorteaLaser) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioCorteaLaser, 
      (SELECT MAX(osi.RealizadoFinalCorteaLaser) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalCorteaLaser,

      /* -- Setor Punsionadeira -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtPUNSIONADEIRA = '1') AS TotalPunsionadeira,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.PUNSIONADEIRATotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtPUNSIONADEIRA = '1') AS ExecPunsionadeira,
      (SELECT MIN(osi.PlanejadoInicioPUNSIONADEIRA) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioPunsionadeira, 
      (SELECT MAX(osi.PlanejadoFinalPUNSIONADEIRA) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalPunsionadeira,
      (SELECT MIN(osi.RealizadoInicioPUNSIONADEIRA) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioPunsionadeira, 
      (SELECT MAX(osi.RealizadoFinalPUNSIONADEIRA) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalPunsionadeira,

      /* -- Setor Galvanizar -- */
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.QtdeTotal,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtGALVANIZAR = '1') AS TotalGalvanizar,
      (SELECT COALESCE(SUM(CAST(NULLIF(osi.GALVANIZARTotalExecutado,'') AS DECIMAL(10,2))), 0) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ') AND osi.txtGALVANIZAR = '1') AS ExecGalvanizar,
      (SELECT MIN(osi.PlanejadoInicioGALVANIZAR) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoInicioGalvanizar, 
      (SELECT MAX(osi.PlanejadoFinalGALVANIZAR) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as PlanejadoFinalGalvanizar,
      (SELECT MIN(osi.RealizadoInicioGALVANIZAR) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoInicioGalvanizar, 
      (SELECT MAX(osi.RealizadoFinalGALVANIZAR) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as RealizadoFinalGalvanizar,


      (SELECT MAX(CASE WHEN osi.txtCorte = '1' OR osi.txtCorte = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagCorte,
      (SELECT MAX(CASE WHEN osi.txtDobra = '1' OR osi.txtDobra = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagDobra,
      (SELECT MAX(CASE WHEN osi.txtSolda = '1' OR osi.txtSolda = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagSolda,
      (SELECT MAX(CASE WHEN osi.txtPintura = '1' OR osi.txtPintura = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagPintura,
      (SELECT MAX(CASE WHEN osi.TxtMontagem = '1' OR osi.TxtMontagem = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagMontagem,
      (SELECT MAX(CASE WHEN osi.txtCorteaLaser = '1' OR osi.txtCorteaLaser = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagCorteaLaser,
      (SELECT MAX(CASE WHEN osi.txtPUNSIONADEIRA = '1' OR osi.txtPUNSIONADEIRA = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagPunsionadeira,
      (SELECT MAX(CASE WHEN osi.txtGALVANIZAR = '1' OR osi.txtGALVANIZAR = 'S' THEN 1 ELSE 0 END) FROM ordemservicoitem osi INNER JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico WHERE os.IdProjeto = p.IdProjeto AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')) as flagGalvanizar

    FROM projetos p
    LEFT JOIN tags t ON t.IdProjeto = p.IdProjeto
        AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')
    WHERE COALESCE(p.D_E_L_E_T_E,'') = '' AND (TRIM(COALESCE(p.liberado,'')) = 'S' OR TRIM(COALESCE(p.liberado,'')) = 'SIM') AND TRIM(COALESCE(p.Finalizado,'')) != 'C'
    GROUP BY p.IdProjeto
    ORDER BY p.IdProjeto DESC
    LIMIT 300
  `;

  console.log("Running massive query on amceletrica...");
  console.time('queryTime');
  try {
    const [rows] = await pool.execute(query);
    console.timeEnd('queryTime');
    console.log(`Found ${rows.length} projects`);
  } catch(e) {
    console.timeEnd('queryTime');
    console.error("Query failed:", e.message);
  } finally {
    process.exit(0);
  }
}
testPerformance();
