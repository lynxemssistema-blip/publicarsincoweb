const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config({path: 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/.env'});

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME
    });

    const [rows] = await conn.execute(`
            SELECT
                IdTag, Tag, DescTag, DataEntrada, DataPrevisao, QtdeTag, QtdeLiberada, SaldoTag, ValorTag, StatusTag,
                QtdeOSExecutadas, QtdePecasOS, QtdePecasExecutadas, PercentualPecas, PercentualOS,
                qtdetotal, Finalizado, qtdernc, PesoTotal, ProjetistaPlanejado, PlanejadoInicioEngenharia, PlanejadoFinalEngenharia,
                txtCORTE, txtDOBRA, txtPINTURA, txtPUNSIONADEIRA, txtCorteaLaser, txtGALVANIZAR,
                PlanejadoInicioCorte, PlanejadoFinalCorte,
                PlanejadoInicioDobra, PlanejadoFinalDobra,
                PlanejadoInicioSolda, PlanejadoFinalSolda,
                PlanejadoInicioPintura, PlanejadoFinalPintura,
                PlanejadoInicioMontagem, PlanejadoFinalMontagem,
                PlanejadoInicioPUNSIONADEIRA, PlanejadoFinalPUNSIONADEIRA,
                PlanejadoInicioCorteaLaser, PlanejadoFinalCorteaLaser,
                PlanejadoInicioGALVANIZAR, PlanejadoFinalGALVANIZAR,
                NULL AS Observacao,
                PlanejadoInicioMedicao,   PlanejadoFinalMedicao,   RealizadoInicioMedicao,   RealizadoFinalMedicao,
                PlanejadoInicioIsometrico, PlanejadoFinalIsometrico, RealizadoInicioIsometrico, RealizadoFinalIsometrico,
                PlanejadoInicioAprovacao,  PlanejadoFinalAprovacao,  RealizadoInicioAprovacao,  RealizadoFinalAprovacao,
                PlanejadoInicioAcabamento, PlanejadoFinalAcabamento, RealizadoInicioAcabamento, RealizadoFinalAcabamento,
                PlanejadoInicioExpedicao,  PlanejadoFinalExpedicao,  RealizadoInicioExpedicao,  realizadoFinalExpedicao
            FROM tags
            WHERE IdProjeto = 87
              AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')
    `);

    console.log('Result:', rows);
    await conn.end();
}
run();
