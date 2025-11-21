const mysql = require('mysql2/promise');

// DATABASE INFORMATION (TABLE NAMES)
// This module now supports runtime initialization of the connection pool
// via init(connectionOptions). If not initialized, calls will throw.
let repoConfig = require('./database.js');
let database = repoConfig.database;

let pool = null;
let currentConnSignature = null;

function createPoolFromOptions(connOptions) {
    if (!connOptions) throw new Error('No connection options provided to create pool');
    const opts = {
        host: connOptions.host,
        port: connOptions.port,
        user: connOptions.user,
        password: connOptions.password,
        database: connOptions.database,
        waitForConnections: true,
        connectionLimit: connOptions.connectionLimit || 10,
        queueLimit: 0,
        // respect ssl flag if provided
        ssl: connOptions.ssl ? { rejectUnauthorized: false } : undefined
    };
    pool = mysql.createPool(opts);
    // simple signature to detect changes
    currentConnSignature = `${opts.host}:${opts.port}:${opts.user}@${opts.database}`;
}

function init(connOptions) {
    createPoolFromOptions(connOptions);
}

function isInitialized() {
    return pool !== null;
}

async function getSqlConnection() {
    if (!pool) throw new Error('Database pool not initialized. Call init(connOptions) after login.');
    const connection = await pool.getConnection();
    return connection;
}

// querySql returns only the rows to preserve existing call-sites
async function querySql(query, params) {
    if (!pool) throw new Error('Database not initialized');
    // Log the query and params for debugging when DEBUG_MODE is enabled
    const debugEnabled = (process.env.DEBUG_MODE === 'true');
    try {
        if (typeof params !== 'undefined') {
            if (debugEnabled) console.log('DEBUG DB QUERY:', query, params);
            const [rows] = await pool.query(query, params);
            return rows;
        } else {
            if (debugEnabled) console.log('DEBUG DB QUERY:', query, 'NO_PARAMS');
            const [rows] = await pool.query(query);
            return rows;
        }
    } catch (err) {
        if (debugEnabled) console.error('DEBUG DB QUERY ERROR:', err && err.message ? err.message : err);
        throw err;
    }
}

async function close() {
    if (pool) {
        try { await pool.end(); } catch (e) { /* ignore */ }
        pool = null;
    }
}

// If the repo default contains connection info (for local dev), initialize
try {
    if (repoConfig && repoConfig.connection && repoConfig.connection.user) {
        // Only initialize if repo config has an explicit user/password filled in
        createPoolFromOptions(repoConfig.connection);
        console.log('Initialized DB pool from repo config (development)');
    }
} catch (e) {
    console.warn('DB init from repo config skipped or failed:', e && e.message ? e.message : e);
}

module.exports = {
    init,
    isInitialized,
    getSqlConnection,
    querySql,
    close
};