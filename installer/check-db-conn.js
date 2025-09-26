#!/usr/bin/env node
// Simple DB connection checker used by the installer and postinstall helper.
// Uses mysql2 (already a project dependency) to attempt an authenticated
// connection and optionally use SSL with the CA cert path provided.

const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node check-db-conn.js --host HOST --port PORT --user USER --password PASS --name DBNAME --ssl 0|1 [--ca CA_PATH]');
  process.exit(3);
}

const argv = require('process').argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const val = argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : '1';
    args[key] = val;
  }
}

if (!args.host || !args.port || !args.user) {
  usage();
}

const host = args.host;
const port = parseInt(args.port, 10) || 3306;
const user = args.user;
const password = args.password || '';
const database = args.name || '';
const sslFlag = args.ssl === '1' || args.ssl === 'true' || args.ssl === 'yes';
const caPath = args.ca ? path.resolve(args.ca) : null;

async function run() {
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (e) {
    console.error('mysql2 module not found. Make sure the bundled node_modules are present.');
    process.exit(4);
  }

  const connOpts = {
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 5000,
  };

  if (sslFlag) {
    try {
      if (!caPath || !fs.existsSync(caPath)) {
        console.error('SSL requested but CA file not found: ' + caPath);
        process.exit(5);
      }
      connOpts.ssl = { ca: fs.readFileSync(caPath) };
    } catch (e) {
      console.error('Failed to read CA file: ' + e.message);
      process.exit(6);
    }
  }

  let conn;
  try {
    conn = await mysql.createConnection(connOpts);
    // Try a simple query to verify authentication
    await conn.query('SELECT 1');
    await conn.end();
    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('FAIL: ' + (err && err.message ? err.message : String(err)));
    try { if (conn) await conn.end(); } catch (e) {}
    process.exit(2);
  }
}

run();
