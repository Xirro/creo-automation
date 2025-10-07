const mysql = require('mysql');
const Promise = require("bluebird");

Promise.promisifyAll(mysql);
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);


//DATABASE INFORMATION (TABLE NAMES)
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
        database: connOptions.database
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

function getSqlConnection() {
    if (!pool) throw new Error('Database pool not initialized. Call init(connOptions) after login.');
    return pool.getConnectionAsync().disposer(function (connection) {
        connection.release();
    });
}

function querySql (query, params) {
    if (!pool) return Promise.reject(new Error('Database not initialized'));
    return Promise.using(getSqlConnection(), function (connection) {
        if (typeof params !== 'undefined'){
            return connection.queryAsync(query, params);
        } else {
            return connection.queryAsync(query);
        }
    });
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
    querySql
};