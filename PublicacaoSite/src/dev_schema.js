const express = require('express');
const router = express.Router();
const db = require('./config/db');

router.get('/check-pulsionadeira', async (req, res) => {
    try {
        const tenantPool = db.getPoolByName('lynxems_sinco_bd1');
        if (!tenantPool) return res.json({error: 'No pool'});
        
        const [cols] = await tenantPool.query("SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'lynxems_sinco_bd1' AND COLUMN_NAME LIKE '%PULSIONADEIRA%'");
        
        const [tables] = await tenantPool.query("SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'lynxems_sinco_bd1' AND DATA_TYPE IN ('varchar', 'text', 'longtext')");
        
        let usages = [];
        for (const t of tables) {
            if (t.TABLE_NAME === 'processofabricacao') continue;
            try {
                const [r] = await tenantPool.query(`SELECT 1 FROM \`${t.TABLE_NAME}\` WHERE \`${t.COLUMN_NAME}\` LIKE '%PULSIONADEIRA%' LIMIT 1`);
                if (r.length > 0) usages.push(`${t.TABLE_NAME}.${t.COLUMN_NAME}`);
            } catch(e) {}
        }
        
        res.json({cols, usages});
    } catch(e) {
        res.json({error: e.message});
    }
});

module.exports = router;
