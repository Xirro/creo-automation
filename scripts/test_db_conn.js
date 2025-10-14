const mysql = require('mysql2/promise');

(async function main(){
  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'saidb',
    port: Number(process.env.DB_PORT || 3306),
    connectTimeout: 7000,
    ssl: process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined
  };
  try {
    console.log('Testing DB connection to', cfg.host, 'user', cfg.user);
    const conn = await mysql.createConnection(cfg);
    const [rows] = await conn.query('SELECT VERSION() AS v');
    console.log('Connected. MySQL version:', rows[0].v);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
