#!/usr/bin/env node
/*
  scripts/createSchema.js
  Converted to mysql2/promise with async/await.
  This script extracts CREATE/INSERT/DROP/USE statements from the backup
  (`scripts/createSchema.js.bak`) or from this file itself and runs them in
  order. Use --dry-run (or -n) to print extracted SQL without executing.
*/

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dbConfig = require('../../app/config/database');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run') || args.includes('-n');

function makeConnOptions(cfg) {
  const c = Object.assign({}, cfg.connection || cfg);
  if (!c.host) c.host = 'localhost';
  c.multipleStatements = true;
  return c;
}

const SQL = [];

function extractSqlFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const txt = fs.readFileSync(filePath, 'utf8');

  const results = [];

  // Helper: parse a JavaScript expression starting at index i (position of char after '(')
  // Returns {expr, endIndex}
  function parseFirstArg(txt, i) {
    let expr = '';
    let inSingle = false;
    let inDouble = false;
    let inBack = false;
    let escape = false;
    let depth = 0; // parentheses depth inside expression
    for (let pos = i; pos < txt.length; pos++) {
      const ch = txt[pos];
      expr += ch;
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (inSingle) { if (ch === "'") inSingle = false; continue; }
      if (inDouble) { if (ch === '"') inDouble = false; continue; }
      if (inBack) { if (ch === '`') inBack = false; continue; }
      if (ch === "'") { inSingle = true; continue; }
      if (ch === '"') { inDouble = true; continue; }
      if (ch === '`') { inBack = true; continue; }
      if (ch === '(') { depth++; continue; }
      if (ch === ')') {
        if (depth === 0) {
          // reached the closing parenthesis of connection.query(...)
          return { expr: expr.trim().replace(/\)\s*$/,'').trim(), end: pos };
        }
        depth--; continue;
      }
      // a top-level comma separates first arg and callback
      if (ch === ',' && depth === 0) {
        return { expr: expr.slice(0, -1).trim(), end: pos };
      }
    }
    return { expr: expr.trim(), end: txt.length };
  }

  // Find all occurrences of connection.query( and parse the first arg
  let idx = 0;
  while ((idx = txt.indexOf('connection.query', idx)) !== -1) {
    const paren = txt.indexOf('(', idx);
    if (paren === -1) break;
    const parsed = parseFirstArg(txt, paren + 1);
    idx = parsed.end + 1;
    const expr = parsed.expr;
    if (!expr) continue;
    // Try to evaluate the expression to a string, supplying dbConfig
    try {
      const value = new Function('dbConfig', 'return ' + expr + ';')(dbConfig);
      if (typeof value === 'string') {
        const s = value.trim();
        results.push(s.endsWith(';') ? s : s + ';');
        continue;
      }
      if (value && typeof value.toString === 'function') {
        const s = String(value).trim();
        if (s) results.push(s.endsWith(';') ? s : s + ';');
        continue;
      }
    } catch (e) {
      // Attempt textual replacement of dbConfig.<key> references and simple concatenation patterns
      try {
        let replaced = expr.replace(/\bdbConfig\.database\b/g, JSON.stringify(dbConfig.database));
        // replace table variable references like dbConfig.some_table -> actual table name
        replaced = replaced.replace(/\bdbConfig\.([A-Za-z0-9_]+)\b/g, (m2, p1) => {
          return JSON.stringify(dbConfig[p1] || '');
        });
        // Evaluate the simplified expression
        const value2 = new Function('return ' + replaced + ';')();
        if (typeof value2 === 'string') {
          const s = value2.trim();
          results.push(s.endsWith(';') ? s : s + ';');
          continue;
        }
      } catch (e2) {
        // fail silently for this expression
      }
    }
  }

  // Fallback scan for raw SQL blocks
  const fallbackRe = /(?:DROP\s+SCHEMA[\s\S]*?;|CREATE\s+DATABASE[\s\S]*?;|USE\s+[^;]+;|CREATE\s+TABLE[\s\S]*?;|INSERT\s+INTO[\s\S]*?;)/gi;
  const fallback = txt.match(fallbackRe) || [];
  for (const f of fallback) {
    let s = f.trim();
    if (!s) continue;
    // If the fallback contains dbConfig references or concatenation, attempt to normalize
    if (/\bdbConfig\b|\+/.test(s)) {
      try {
        const replaced = s.replace(/\bdbConfig\.([A-Za-z0-9_]+)\b/g, (m2, p1) => JSON.stringify(dbConfig[p1] || ''));
        // Try to evaluate expressions that use + concatenation and quoted pieces
        const evaluated = new Function('return ' + replaced + ';')();
        if (typeof evaluated === 'string' && evaluated.trim()) {
          s = evaluated.trim();
        }
      } catch (e) {
        // As a fallback, remove common JS concatenation tokens and stray quotes
        s = s.replace(/'\s*\+\s*|\+\s*'/g, '').replace(/"\s*\+\s*|\+\s*"/g, '');
      }
    }
    results.push(s.endsWith(';') ? s : s + ';');
  }

  // Deduplicate and filter out JS artifacts
  const seen = new Set();
  const deduped = results.filter(r => { if (seen.has(r)) return false; seen.add(r); return true; });
  const sqlOnly = deduped.filter(r => {
    if (!/^(DROP|CREATE|USE|INSERT|ALTER|SET|GRANT)\b/i.test(r)) return false;
    if (/\bdbConfig\b|function\(|connection\.|console\.|\breturn\b|=>/.test(r)) return false;
    return true;
  });
  return sqlOnly;
}

const bakPath = path.join(__dirname, 'createSchema.js.bak');
const srcPath = fs.existsSync(bakPath) ? bakPath : path.join(__dirname, 'createSchema.js');
const extracted = extractSqlFromFile(srcPath);
if (extracted.length) SQL.push(...extracted);
else {
  // Minimal safe fallbacks if extraction fails
  SQL.push(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database};`);
  SQL.push(`USE ${dbConfig.database};`);
}

async function run() {
  if (DRY_RUN) {
    console.log('DRY RUN: extracted', SQL.length, 'statements. Showing first 50:');
    SQL.slice(0, 50).forEach((s, i) => {
      console.log(`-- [${i + 1}] -----------------\n${s}\n`);
    });
    return;
  }

  const connOptions = makeConnOptions(dbConfig);
  const conn = await mysql.createConnection(connOptions);
  try {
    for (let i = 0; i < SQL.length; i++) {
      const stmt = SQL[i];
      if (!stmt || !stmt.trim()) continue;
      try {
        await conn.query(stmt);
        if (i % 10 === 0) process.stdout.write('.');
      } catch (e) {
        console.error(`\nError executing statement #${i + 1}:`, e && e.message ? e.message : e);
        console.error('SQL snippet:', stmt.substring(0, 300).replace(/\n/g, ' '));
        throw e;
      }
    }
    console.log('\nSuccess: Schema Created!');
  } finally {
    try { await conn.end(); } catch (e) { /* ignore */ }
  }
}

run().catch(err => {
  console.error('Script failed:', err && err.message ? err.message : err);
  process.exit(1);
});
