const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Listar todos os veículos ativos (que não tenham D_E_L_E_T_E='*' ou algo do tipo)
router.get('/', async (req, res) => {
    try {
        const tenantPool = req.tenantDbPool || req.app.locals.pool;
        let idMatriz = req.tenantUser?.tenantId;
        if (!idMatriz) {
            idMatriz = req.user?.idMatriz || null;
        }
        
        let query = "SELECT IdVeiculo, Veiculo, Placa, DataCadastro FROM veiculo WHERE (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')";
        let queryParams = [];
        
        if (idMatriz) {
            query += " AND IdMatriz = ?";
            queryParams.push(idMatriz);
        }
        
        const [rows] = await tenantPool.execute(query, queryParams);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[Tipos Transporte] Erro GET:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao buscar veículos.' });
    }
});

// Criar veículo
router.post('/', async (req, res) => {
    try {
        const tenantPool = req.tenantDbPool || req.app.locals.pool;
        let idMatriz = req.tenantUser?.tenantId;
        if (!idMatriz) {
            idMatriz = req.user?.idMatriz || null;
        }

        const { Veiculo, Placa } = req.body;
        
        if (!Veiculo || !Placa) {
            return res.status(400).json({ success: false, message: 'Veículo e Placa são obrigatórios.' });
        }
        
        // Formatar DataCadastro para dd/mm/yyyy
        const dateObj = new Date();
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        const dataCadastro = `${dd}/${mm}/${yyyy}`;

        const [result] = await tenantPool.execute(
            `INSERT INTO veiculo (Veiculo, Placa, DataCadastro, IdMatriz) VALUES (?, ?, ?, ?)`,
            [Veiculo, Placa, dataCadastro, idMatriz || null]
        );

        res.json({ success: true, message: 'Veículo inserido com sucesso.', id: result.insertId });
    } catch (error) {
        console.error('[Tipos Transporte] Erro POST:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao inserir veículo.' });
    }
});

// Alterar veículo
router.put('/:id', async (req, res) => {
    try {
        const tenantPool = req.tenantDbPool || req.app.locals.pool;
        let idMatriz = req.tenantUser?.tenantId;
        if (!idMatriz) {
            idMatriz = req.user?.idMatriz || null;
        }

        const id = req.params.id;
        const { Veiculo, Placa } = req.body;
        
        if (!Veiculo || !Placa) {
            return res.status(400).json({ success: false, message: 'Veículo e Placa são obrigatórios.' });
        }

        let query = "UPDATE veiculo SET Veiculo = ?, Placa = ? WHERE IdVeiculo = ?";
        let queryParams = [Veiculo, Placa, id];

        if (idMatriz) {
            query += " AND IdMatriz = ?";
            queryParams.push(idMatriz);
        }

        const [result] = await tenantPool.execute(query, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Veículo não encontrado ou sem permissão.' });
        }

        res.json({ success: true, message: 'Veículo atualizado com sucesso.' });
    } catch (error) {
        console.error('[Tipos Transporte] Erro PUT:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao atualizar veículo.' });
    }
});

// Deletar veículo (Soft Delete)
router.delete('/:id', async (req, res) => {
    try {
        const tenantPool = req.tenantDbPool || req.app.locals.pool;
        let idMatriz = req.tenantUser?.tenantId;
        let usuario = req.user?.nome || req.user?.NomeCompleto || 'Sistema';
        
        if (!idMatriz) {
            idMatriz = req.user?.idMatriz || null;
        }
        
        const id = req.params.id;
        
        const dateObj = new Date();
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        const dataDelete = `${dd}/${mm}/${yyyy}`;

        let query = "UPDATE veiculo SET D_E_L_E_T_E = '*', DATAD_E_L_E_T_E = ?, UsuarioD_E_L_E_T_E = ? WHERE IdVeiculo = ?";
        let queryParams = [dataDelete, usuario, id];

        if (idMatriz) {
            query += " AND IdMatriz = ?";
            queryParams.push(idMatriz);
        }

        const [result] = await tenantPool.execute(query, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Veículo não encontrado ou sem permissão.' });
        }

        res.json({ success: true, message: 'Veículo deletado com sucesso.' });
    } catch (error) {
        console.error('[Tipos Transporte] Erro DELETE:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao deletar veículo.' });
    }
});

module.exports = router;
