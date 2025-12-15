/*
  backfill-mbom-projectid.js

  Usage (PowerShell):
    $env:DB_HOST='localhost'; $env:DB_USER='root'; $env:DB_PASSWORD='pwd'; $env:DB_NAME='saidb'; node .\scripts\backfill-mbom-projectid.js

  Behavior:
  - Connects to the database using the project's DB helper (app/config/db.js).
  - Adds `projectId` INT NULL column to mbomSum if it doesn't exist.
  - Updates mbomSum.projectId = jobMaster.id where jobNum matches.
  - Shows summary counts before and after.

  Safety notes:
  - Run on a backup or a replica first.
  - This script is intended to be temporary; remove when done.
*/

const dbConfig = require('../app/config/database.js');
const DB = require('../app/config/db.js');

const database = dbConfig.database;
const mbomTableName = dbConfig.MBOM_summary_table || 'mbomSum';
const jobMasterTableName = dbConfig.JOBMASTER_table || 'jobMaster';

function makeQualified(tbl) {
  // If repo config indicates a database, qualify it; otherwise use raw name
  return database ? `\`${database}\`.\`${tbl}\`` : `\`${tbl}\``;
}

async function main() {
  // Initialize DB pool from environment vars if provided
  const connOpts = {
    host: process.env.DB_HOST || process.env.DBHOST || (dbConfig.connection && dbConfig.connection.host),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : (dbConfig.connection && dbConfig.connection.port),
    user: process.env.DB_USER || process.env.DBUSER || (dbConfig.connection && dbConfig.connection.user),
    password: process.env.DB_PASSWORD || process.env.DB_PASS || (dbConfig.connection && dbConfig.connection.password),
    database: process.env.DB_NAME || process.env.DB_DATABASE || database
  };

  if (!connOpts.user || !connOpts.host || !connOpts.database) {
    console.error('Missing DB connection info. Provide DB_HOST, DB_USER, DB_PASSWORD and DB_NAME environment variables or configure app/config/database.local.js');
    process.exit(2);
  }

  console.log('Initializing DB connection to', `${connOpts.user}@${connOpts.host}:${connOpts.port}/${connOpts.database}`);
  try {
    DB.init(connOpts);
  } catch (e) {
    console.error('DB.init failed:', e && e.message ? e.message : e);
    process.exit(2);
  }

  const mbomTbl = makeQualified(mbomTableName);
  const jmTbl = makeQualified(jobMasterTableName);

  try {
    // Check if column exists
    const colCheckSql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`;
    const colRows = await DB.querySql(colCheckSql, [connOpts.database, mbomTableName, 'projectId']);
    const exists = Array.isArray(colRows) && colRows.length && Number(colRows[0].cnt) > 0;

    if (!exists) {
      console.log('Adding `projectId` column to', mbomTbl);
      const alterSql = `ALTER TABLE ${mbomTbl} ADD COLUMN projectId INT NULL`;
      await DB.querySql(alterSql);
      console.log('Column added.');
    } else {
      console.log('Column `projectId` already exists on', mbomTbl);
    }

    // Report counts before
    const beforeSql = `SELECT COUNT(*) AS cnt FROM ${mbomTbl} WHERE projectId IS NULL OR projectId = ''`;
    const beforeRows = await DB.querySql(beforeSql);
    const beforeCnt = (Array.isArray(beforeRows) && beforeRows[0]) ? Number(beforeRows[0].cnt) : 0;
    console.log('mbomSum rows missing projectId before update:', beforeCnt);

    // Perform the backfill: set mbomSum.projectId = jobMaster.id where jobNum matches
    // Use an UPDATE with JOIN to avoid accidental duplicates
    const updateSql = `UPDATE ${mbomTbl} m JOIN ${jmTbl} j ON m.jobNum = j.jobNum SET m.projectId = j.id WHERE (m.projectId IS NULL OR m.projectId = '')`;
    const res = await DB.querySql(updateSql);
    // mysql2 returns an object for UPDATE; we can't rely on rows; run post-check

    // Report counts after
    const afterSql = `SELECT COUNT(*) AS cnt FROM ${mbomTbl} WHERE projectId IS NULL OR projectId = ''`;
    const afterRows = await DB.querySql(afterSql);
    const afterCnt = (Array.isArray(afterRows) && afterRows[0]) ? Number(afterRows[0].cnt) : 0;
    console.log('mbomSum rows missing projectId after update:', afterCnt);

    // Show how many rows were updated (best effort: count rows with projectId not null)
    const filledSql = `SELECT COUNT(*) AS cnt FROM ${mbomTbl} WHERE projectId IS NOT NULL AND projectId != ''`;
    const filledRows = await DB.querySql(filledSql);
    const filledCnt = (Array.isArray(filledRows) && filledRows[0]) ? Number(filledRows[0].cnt) : 0;
    console.log('mbomSum rows with projectId now:', filledCnt);

    console.log('Backfill complete. Verify results and backup as needed.');
  } catch (err) {
    console.error('Error during migration:', err && err.message ? err.message : err);
  } finally {
    try { await DB.close(); } catch(e) { /* ignore */ }
    process.exit(0);
  }
}

main();
