const db = require('../src/config/db');

async function test() {
    try {
        const tenantDbPool = await db.getTenantDbPool('amceletrica');
        
        const [rows] = await tenantDbPool.execute(`
            SELECT PlanejadoInicioCorte, PlanejadoFinalCorte, PlanejadoInicioDobra, PlanejadoFinalDobra, PlanejadoInicioSolda, PlanejadoFinalSolda, PlanejadoInicioPintura, PlanejadoFinalPintura, PlanejadoInicioMontagem, PlanejadoFinalMontagem, PlanejadoInicioCorteaLaser, PlanejadoFinalCorteaLaser, PlanejadoInicioPUNSIONADEIRA, PlanejadoFinalPUNSIONADEIRA, PlanejadoInicioGALVANIZAR, PlanejadoFinalGALVANIZAR, CorteDiasProducao, DobraDiasProducao, SoldaDiasProducao, PinturaDiasProducao, MontagemDiasProducao, CorteaLaserDiasProducao, PunsionadeiraDiasProducao, GalvanizarDiasProducao, CorteMinProd, DobraMinProd, SoldaMinProd, PinturaMinProd, MontagemMinProd, CorteaLaserMinProd, PUNSIONADEIRAMinProd, GALVANIZARMinProd, IdOrdemServicoItem, IdOrdemServico, DescResumo, DescDetal, Fator,
                QtdeTotal, Peso, AreaPintura, Acabamento, Unidade,
                Espessura, Altura, Largura,
                CodMatFabricante, MaterialSW, EnderecoArquivo,
                ProdutoPrincipal,
                DataPrevisao, qtde, Data_Liberacao_Engenharia, OrdemServicoItemFinalizado, NumeroDobras, AreaPinturaUnitario, PesoUnitario,
                OrdemServicoItemFinalizado as Finalizado,
                txtCorte, sttxtCorte, CortePercentual,
                txtDobra, sttxtDobra, DobraPercentual,
                txtSolda, sttxtSolda, SoldaPercentual,
                txtPintura, sttxtPintura, PinturaPercentual,
                TxtMontagem, sttxtMontagem, MontagemPercentual,
                txtCorteaLaser, CorteaLaserPercentual,
                txtPUNSIONADEIRA, PUNSIONADEIRAPercentual,
                txtGALVANIZAR, GALVANIZARPercentual,
                Liberado_Engenharia,
                -- Tempos de produção globais
                TempoSetup, TempoPadrao, TotalTempo,
                -- Tempos por recurso
                CorteTempoSetup, CorteTempoPadrao, CorteTotalTempo,
                DobraTempoSetup, DobraTempoPadrao, DobraTotalTempo,
                SoldaTempoSetup, SoldaTempoPadrao, SoldaTotalTempo,
                PinturaTempoSetup, PinturaTempoPadrao, PinturaTotalTempo,
                MontagemTempoSetup, MontagemTempoPadrao, MontagemTotalTempo,
                CorteaLaserTempoSetup, CorteaLaserTempoPadrao, CorteaLaserTotalTempo,
                PunsionadeiraTempoSetup, PunsionadeiraTempoPadrao, PunsionadeiraTotalTempo,
                GalvanizarTempoSetup, GalvanizarTempoPadrao, GalvanizarTotalTempo,
                CorteSequencia, DobraSequencia, SoldaSequencia, PinturaSequencia,
                MontagemSequencia, CorteaLaserSequencia, PunsionadeiraSequencia,
                GalvanizarSequencia, EngenhariaSequencia
            FROM ordemservicoitem
            WHERE IdOrdemServico = ? AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')
        `, [1484]);
        console.log('Query succeeded. Rows:', rows.length);
    } catch(e) {
        console.error('SQL Error:', e.message);
    }
    process.exit();
}
test();
