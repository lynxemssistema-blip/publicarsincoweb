const db = require('../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'SincoWebSecret2026!KeySecure';

const tenantMiddleware = async (req, res, next) => {
    // 1. Get Token from Authorization header or Query
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    // 2. Public / Bypassed routes that don't require tenant auth token
    const pathStr = req.originalUrl || req.url || '';
    if (
        pathStr.includes('visao-geral') ||
        pathStr.includes('login') ||
        pathStr.includes('public') ||
        pathStr.includes('download') ||
        pathStr.includes('pdf') ||
        pathStr.includes('manutencao') ||
        pathStr.includes('acompanhamento') ||
        pathStr.includes('material') ||
        pathStr.includes('ordemservico')
    ) {
        return next();
    }

    if (!token) {
        console.warn(`[TenantMiddleware] No token provided for ${req.url}`);
        return res.status(401).json({ success: false, message: 'Autenticação necessária' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const tenantDbName = decoded.dbName;

        if (!tenantDbName) {
            return res.status(403).json({ success: false, message: 'Contexto de banco de dados não encontrado no token' });
        }

        if (!db.hasPool(tenantDbName)) {
            const [rows] = await db.executeOnDefault(
                'SELECT * FROM conexoes_bancos WHERE db_name = ? AND ativo = 1',
                [tenantDbName]
            );

            if (rows.length > 0) {
                const config = rows[0];
                const dbConfig = {
                    host: config.db_host,
                    user: config.db_user,
                    password: config.db_pass,
                    database: config.db_name,
                    port: config.db_port || 3306
                };
                db.initPool(dbConfig);
                console.log(`[Tenant] Lazy-loaded pool for: ${tenantDbName}`);
            } else {
                if (tenantDbName !== process.env.CENTRAL_DB_NAME && tenantDbName !== 'lynxlocal') {
                    console.warn(`[Tenant] Requested DB '${tenantDbName}' from token not found in registry.`);
                    return res.status(404).json({ success: false, message: 'Banco de dados do cliente não encontrado' });
                }
            }
        }

        req.tenantDbPool = db.getPoolByName(tenantDbName);
        req.tenantUser = decoded;

        next();
    } catch (error) {
        console.error('[TenantMiddleware] Error verifying token:', error.message);
        return res.status(401).json({ success: false, message: 'Sessão inválida ou token expirado' });
    }
};

module.exports = tenantMiddleware;
