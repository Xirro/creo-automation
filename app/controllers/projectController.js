//needed to export all the functions found next to "exports."
exports = {};
module.exports = exports;

//misc imports
const url = require('url');
const queryString = require('query-string');

//Database information (table names)
const dbConfig = require('../config/database.js');
const database = dbConfig.database;

//Database interaction function (querySql)
//querySql takes 2 arguments, query (the sql string to be passed)
//and params (if there are ?'s in the query, these values will be inserted in their place)
//second argument params is optional, you only need to include it if you need to insert values into the string
//querySql returns the result of the sql query
const DB = require('../config/db.js');
// Wrap the DB.querySql call so we can log queries when DEBUG_MODE enables server logging
const querySql = function(sql, params){
    if (DEBUG_SERVER) {
        try {
            // capture a stack trace and extract the immediate caller
            const err = new Error();
            // exclude this wrapper from the captured stack so the next frame is the caller
            Error.captureStackTrace(err, querySql);
            const stack = err.stack || '';
            const stackLines = stack.split('\n').map(s => s.trim()).filter(Boolean);
            // stackLines[0] is the 'Error' message, stackLines[1] should be the caller
            const callerLine = stackLines[1] || stackLines[2] || '';
            const caller = callerLine.replace(/^at\s+/, '');
            console.log('SQL QUERY called from:', caller);
            console.log('SQL QUERY:', sql, params, '\n');
        } catch(e) {
            // ignore logging errors
        }
    }
    return DB.querySql(sql, params);
};
const Promise = require('bluebird');

// Debug mode controlled by environment variable DEBUG_MODE.
// Accept values: 'true' (both), 'server', 'client', 'both', otherwise 'false'.
const DEBUG_MODE = (process.env.DEBUG_MODE || 'false');
const DEBUG_SERVER = (DEBUG_MODE === 'true' || DEBUG_MODE === 'server' || DEBUG_MODE === 'both');
const DEBUG_CLIENT = (DEBUG_MODE === 'true' || DEBUG_MODE === 'client' || DEBUG_MODE === 'both');

// Controller: render Projects main page with a list of MBOM summaries (projects)
exports.projectMain = async function(req, res) {
    try {
        // Read from the jobMaster table and left-join customers to resolve customer name
        const jobMasterTable = (dbConfig && dbConfig.JOBMASTER_table) ? dbConfig.JOBMASTER_table : 'jobMaster';
        const customersTable = (dbConfig && dbConfig.CUSTOMERS_table) ? dbConfig.CUSTOMERS_table : 'customers';
        const jmTable = (database) ? `${database}.${jobMasterTable}` : jobMasterTable;
        const cTable = (database) ? `${database}.${customersTable}` : customersTable;
        // Support pagination via ?page=<n>&limit=<n> and server-side search via ?q=
        const reqPage = parseInt(req.query.page, 10) || 1;
        const reqLimit = parseInt(req.query.limit, 10) || 25;
        const q = (req.query.q || '').trim();

        // --- search query parser -------------------------------------------------
        // Supports:
        //  - quoted phrases: "final build"
        //  - fielded tokens: jobNum:123, bill:ABC, pm:Bob
        //  - negation: -cust:Acme or -obsolete
        //  - plain tokens search across default columns
        function parseSearchQuery(raw){
            if(!raw) return {clauses: [], params: []};
            const clauses = [];
            const params = [];

            // tokenize preserving quoted phrases using a simpler approach
            // matches either "quoted phrase" or non-space sequences
            const rawTokens = raw.match(/"[^"]+"|\S+/g) || [];
            const tokens = rawTokens.map(tok => {
                let t = tok;
                let neg = false;
                if(t.startsWith('-')){ neg = true; t = t.slice(1); }
                // strip surrounding quotes
                if(t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
                // detect fielded token key:val
                const idx = t.indexOf(':');
                if(idx > 0){
                    const key = t.slice(0, idx).toLowerCase();
                    const val = t.slice(idx + 1);
                    return { neg: neg, key: key, val: val };
                }
                return { neg: neg, key: null, val: t };
            });

            // alias map for fields
            const fieldMap = {
                jobnum: 'jm.jobNum', job: 'jm.jobNum', job_number: 'jm.jobNum',
                title: 'jm.jobTitle', jobtitle: 'jm.jobTitle', job_name: 'jm.jobTitle',
                pm: 'jm.projectManager', projectmanager: 'jm.projectManager', manager: 'jm.projectManager',
                bill: 'jm.billCode', billcode: 'jm.billCode',
                cust: 'cust', customer: 'cust', custnum: 'cust', customerid: 'cust'
            };

            // helper to make LIKE param
            const makeLike = (s)=> (s.indexOf('%') !== -1 ? s : ('%' + s + '%'));

            tokens.forEach(t => {
                const val = (t.val || '').trim();
                if(!val) return;
                if(t.key){
                    const mapped = fieldMap[t.key] || null;
                    if(mapped === 'cust'){
                        const clause = '(c.customerName LIKE ? OR jm.custNum LIKE ?)';
                        const p1 = makeLike(val);
                        if(t.neg){
                            clauses.push('NOT ' + clause);
                            params.push(p1, p1);
                        } else {
                            clauses.push(clause);
                            params.push(p1, p1);
                        }
                    } else if(mapped){
                        const clause = mapped + ' LIKE ?';
                        const p = makeLike(val);
                        if(t.neg){ clauses.push('NOT (' + clause + ')'); params.push(p); }
                        else { clauses.push(clause); params.push(p); }
                    } else {
                        // unknown key: treat as free-text against defaults
                        const clause = '(jm.jobNum LIKE ? OR jm.jobTitle LIKE ? OR jm.projectManager LIKE ? OR jm.billCode LIKE ? OR c.customerName LIKE ? OR jm.custNum LIKE ?)';
                        const like = makeLike(val);
                        if(t.neg){ clauses.push('NOT ' + clause); params.push(like, like, like, like, like, like); }
                        else { clauses.push(clause); params.push(like, like, like, like, like, like); }
                    }
                } else {
                    // plain token: search across default columns
                    const clause = '(jm.jobNum LIKE ? OR jm.jobTitle LIKE ? OR jm.projectManager LIKE ? OR jm.billCode LIKE ? OR c.customerName LIKE ? OR jm.custNum LIKE ?)';
                    const like = makeLike(val);
                    if(t.neg){ clauses.push('NOT ' + clause); params.push(like, like, like, like, like, like); }
                    else { clauses.push(clause); params.push(like, like, like, like, like, like); }
                }
            });

            // fallback: if no clauses produced (parser failed), treat entire raw as a plain token
            if(clauses.length === 0 && raw.trim()){
                const like = makeLike(raw.trim());
                const clause = '(jm.jobNum LIKE ? OR jm.jobTitle LIKE ? OR jm.projectManager LIKE ? OR jm.billCode LIKE ? OR c.customerName LIKE ? OR jm.custNum LIKE ?)';
                clauses.push(clause);
                params.push(like, like, like, like, like, like);
            }

            return {clauses: clauses, params: params};
        }
        // --- end parser ---------------------------------------------------------
        // sanitize values
        let page = Math.max(1, reqPage);
        const limit = Math.max(1, reqLimit); // no upper cap

        // Build SQL with optional search
        let sql = `
            SELECT jm.id, jm.jobNum, jm.jobTitle, COALESCE(c.customerName, jm.custNum) AS custName,
                   jm.projectManager, jm.billCode
            FROM ${jmTable} jm
            LEFT JOIN ${cTable} c ON jm.custNum = c.customerID
        `;
        const params = [];
        // build WHERE clause (reuse for count)
        let parsed = { clauses: [], params: [] };
        if (q) {
            parsed = parseSearchQuery(q);
            if(parsed.clauses.length){
                sql += ' WHERE ' + parsed.clauses.join(' AND ');
                parsed.params.forEach(p => params.push(p));
            }
        }

        // get total count for pagination
        let totalRows = 0;
        try {
            const countSql = `SELECT COUNT(*) AS cnt FROM ${jmTable} jm LEFT JOIN ${cTable} c ON jm.custNum = c.customerID` + (parsed.clauses.length ? (' WHERE ' + parsed.clauses.join(' AND ')) : '');
            const countRows = await querySql(countSql, parsed.params.length ? parsed.params.slice() : []);
            if (Array.isArray(countRows) && countRows.length) totalRows = Number(countRows[0].cnt) || 0;
        } catch(e) {
            if (DEBUG_SERVER) console.error('projectMain: count query failed', e);
            totalRows = 0;
        }

        // compute total pages and ensure requested page is within range
        const totalPages = Math.max(1, Math.ceil(totalRows / limit));
        if (page > totalPages) page = totalPages;
        const offset = (page - 1) * limit;

        sql += ` ORDER BY jm.id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const rows = await querySql(sql, params);

        const projects = Array.isArray(rows) ? rows.map(r => ({
            id: r.id,
            jobNum: r.jobNum,
            jobTitle: r.jobTitle,
            custName: r.custName,
            projectManager: r.projectManager,
            billCode: r.billCode
        })) : [];

        res.locals.title = 'Projects';
        return res.render('Projects/projectMain', { projects: projects, message: null, page: page, limit: limit, q: q, totalRows: totalRows, totalPages: totalPages });
    } catch (err) {
        console.error('projectMain: DB error', err && err.stack ? err.stack : err);
        // Render page with empty projects and an error message
        res.locals.title = 'Projects';
        return res.render('Projects/projectMain', { projects: [], message: 'Failed to load projects.' });
    }
};

// (Optional) Simple create project handler — renders a small form. We'll export a GET and POST
exports.createProjectForm = function(req, res) {
    res.locals.title = 'Create Project';
    return res.render('Projects/createProject', { formValues: {} });
};

exports.createProject = async function(req, res) {
    try {
        const payload = req.body || {};
        const jobNum = (payload.jobNum || '').trim();
        const releaseNum = (payload.releaseNum || '').trim();
        const jobName = (payload.jobName || '').trim();
        const customer = (payload.customer || '').trim();
        const boardDesignation = (payload.boardDesignation || '').trim();

        if (!jobNum || !releaseNum || !jobName) {
            return res.render('Projects/createProject', { formValues: payload, message: 'Job #, Release and Job Name are required.' });
        }

        const mbomTable = (dbConfig && dbConfig.MBOM_summary_table) ? dbConfig.MBOM_summary_table : 'mbomSum';
        // Configurable column name used to store project id on the MBOM summary table
        const mbomProjectIdCol = (dbConfig && dbConfig.MBOM_projectId) ? dbConfig.MBOM_projectId : 'projectId';

        // If a projectId is provided in the payload or as a route param, include it in the INSERT
        let insertCols = ['jobNum', 'releaseNum', 'jobName', 'customer', 'boardDesignation'];
        let placeholders = ['?', '?', '?', '?', '?'];
        const params = [ jobNum, releaseNum, jobName, customer, boardDesignation ];

        // prefer explicit payload.projectId; fall back to req.params.id when present
        let providedProjectId = null;
        if (payload && typeof payload.projectId !== 'undefined' && payload.projectId !== null && String(payload.projectId).trim() !== '') {
            const p = Number(payload.projectId);
            if (!Number.isNaN(p)) providedProjectId = p;
        } else if (req && req.params && typeof req.params.id !== 'undefined' && req.params.id !== null && String(req.params.id).trim() !== '') {
            const p = Number(req.params.id);
            if (!Number.isNaN(p)) providedProjectId = p;
        }

        if (providedProjectId !== null) {
            insertCols.push(mbomProjectIdCol);
            placeholders.push('?');
            params.push(providedProjectId);
        }

        const sql = `INSERT INTO ${mbomTable} (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await querySql(sql, params);
        return res.redirect('/projects');
    } catch (err) {
        console.error('createProject: DB error', err && err.stack ? err.stack : err);
        return res.render('Projects/createProject', { formValues: req.body || {}, message: 'Failed to create project.' });
    }
};

// Render a single project's dashboard (draft)
exports.projectDashboard = async function(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) {
            // no project id provided — render an empty dashboard with default sort
            const viewSort = 'mbomID';
            const viewDir = 'DESC';
            res.locals.title = 'Project Dashboard';
            return res.render('Projects/projectDashboard', { project: null, mboms: [], mbomPage: 1, mbomLimit: 10, mbomTotalRows: 0, mbomTotalPages: 1, mbomSort: viewSort, mbomDir: viewDir });
        }

        const jobMasterTable = (dbConfig && dbConfig.JOBMASTER_table) ? dbConfig.JOBMASTER_table : 'jobMaster';
        const customersTable = (dbConfig && dbConfig.CUSTOMERS_table) ? dbConfig.CUSTOMERS_table : 'customers';
        const jmTable = (database) ? `${database}.${jobMasterTable}` : jobMasterTable;
        const cTable = (database) ? `${database}.${customersTable}` : customersTable;

        const sql = `SELECT jm.id, jm.jobNum, jm.jobTitle, COALESCE(c.customerName, jm.custNum) AS custName,
                            jm.projectManager, jm.billCode
                     FROM ${jmTable} jm
                     LEFT JOIN ${cTable} c ON jm.custNum = c.customerID
                     WHERE jm.id = ? LIMIT 1`;
        const rows = await querySql(sql, [id]);
        const project = (Array.isArray(rows) && rows.length) ? rows[0] : null;
        // Prepare MBOM listing (paged) for this project
        const reqPage = parseInt(req.query.page, 10) || 1;
        const reqLimit = parseInt(req.query.limit, 10) || 10;
        // optional sorting for mbom list: sort=mbomID|releaseNum|boardDesignation|numSections|qtyBoard|noSectionMBOM
        const reqSort = (req.query.sort || '').toString();
        const reqDir = (req.query.dir || '').toString().toUpperCase();
        let mbomPage = Math.max(1, reqPage);
        const mbomLimit = Math.max(1, reqLimit);
        let mbomTotalRows = 0;
        let mbomTotalPages = 1;
        let mboms = [];

        if (project) {
            try {
                const mbomTable = (dbConfig && dbConfig.MBOM_summary_table) ? dbConfig.MBOM_summary_table : 'mbomSum';
                const mbTable = (database) ? `${database}.${mbomTable}` : mbomTable;
                // Column name used to store project id on mbom summary (configurable)
                const mbomProjectIdCol = (dbConfig && dbConfig.MBOM_projectId) ? dbConfig.MBOM_projectId : 'projectId';

                // total count - filter by project id column rather than jobNum
                const countSql = `SELECT COUNT(*) AS cnt FROM ${mbTable} WHERE ${mbomProjectIdCol} = ?`;
                const countRows = await querySql(countSql, [project.id]);
                if (Array.isArray(countRows) && countRows.length) mbomTotalRows = Number(countRows[0].cnt) || 0;

                mbomTotalPages = Math.max(1, Math.ceil(mbomTotalRows / mbomLimit));
                if (mbomPage > mbomTotalPages) mbomPage = mbomTotalPages;
                const offset = (mbomPage - 1) * mbomLimit;
                // determine ORDER BY mapping
                // canonical mapping of allowed sort aliases (keys are normalized to lowercase)
                const sortMap = {
                    mbomid: 'mbomID',
                    id: 'mbomID',
                    release: 'releaseNum',
                    releasenum: 'releaseNum',
                    board: 'boardDesignation',
                    boarddesignation: 'boardDesignation',
                    numsections: 'numSections',
                    qty: 'qtyBoard',
                    qtyboard: 'qtyBoard',
                    nosectionmbom: 'noSectionMBOM'
                };
                let orderCol = 'mbomID';
                if (reqSort && sortMap[reqSort.toLowerCase()]) orderCol = sortMap[reqSort.toLowerCase()];
                let orderDir = (reqDir === 'ASC') ? 'ASC' : 'DESC';

                const selSql = `SELECT mbomID, releaseNum, boardDesignation, numSections, qtyBoard, noSectionMBOM FROM ${mbTable} WHERE ${mbomProjectIdCol} = ? ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`;
                const selRows = await querySql(selSql, [project.id, mbomLimit, offset]);
                if (Array.isArray(selRows) && selRows.length) {
                    mboms = selRows.map(r => ({
                        id: r.mbomID,
                        releaseNum: r.releaseNum,
                        boardDesignation: r.boardDesignation,
                        numSections: r.numSections,
                        qtyBoard: r.qtyBoard,
                        noSectionMBOM: r.noSectionMBOM
                    }));
                }
            } catch (e) {
                if (DEBUG_SERVER) console.error('projectDashboard: mbom query failed', e);
                mboms = [];
                mbomTotalRows = 0;
                mbomTotalPages = 1;
            }
        }

        const viewSort = reqSort || 'mbomID';
        const viewDir = (reqDir && String(reqDir).toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
        res.locals.title = project ? ('Project ' + project.jobNum) : 'Project Dashboard';
        return res.render('Projects/projectDashboard', { project: project, mboms: mboms, mbomPage: mbomPage, mbomLimit: mbomLimit, mbomTotalRows: mbomTotalRows, mbomTotalPages: mbomTotalPages, mbomSort: viewSort, mbomDir: viewDir });
    } catch (e) {
        console.error('projectDashboard: error', e && e.stack ? e.stack : e);
        const viewSort = reqSort || 'mbomID';
        const viewDir = (reqDir && String(reqDir).toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
        res.locals.title = 'Project Dashboard';
        return res.render('Projects/projectDashboard', { project: null, mboms: [], mbomPage: 1, mbomLimit: 10, mbomTotalRows: 0, mbomTotalPages: 1, mbomSort: viewSort, mbomDir: viewDir });
    }
};

// Update MBOM fields (release letter, description, qty)
exports.updateMbom = async function(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.redirect('/projects');

        const payload = req.body || {};
        const releaseNum = (payload.releaseNum || '').toString().trim();
        const boardDesignation = (payload.boardDesignation || '').toString().trim();
        const qtyBoardRaw = payload.qtyBoard;
        const projectId = (payload.projectId || '').toString();

        const mbomTable = (dbConfig && dbConfig.MBOM_summary_table) ? dbConfig.MBOM_summary_table : 'mbomSum';
        const mbTable = (database) ? `${database}.${mbomTable}` : mbomTable;

        const updates = [];
        const params = [];
        if (typeof releaseNum !== 'undefined') { updates.push('releaseNum = ?'); params.push(releaseNum); }
        if (typeof boardDesignation !== 'undefined') { updates.push('boardDesignation = ?'); params.push(boardDesignation); }
        if (typeof qtyBoardRaw !== 'undefined' && qtyBoardRaw !== null && qtyBoardRaw !== '') {
            const qtyBoard = Number(qtyBoardRaw);
            if (!Number.isNaN(qtyBoard)) { updates.push('qtyBoard = ?'); params.push(qtyBoard); }
        }

        if (updates.length) {
            params.push(id);
            const updSql = `UPDATE ${mbTable} SET ${updates.join(', ')} WHERE mbomID = ?`;
            await querySql(updSql, params);
        }

        if (projectId) return res.redirect('/projects/' + encodeURIComponent(projectId));
        return res.redirect('/projects');
    } catch (e) {
        console.error('updateMbom: error', e && e.stack ? e.stack : e);
        return res.redirect('/projects');
    }
};

// Delete an MBOM row
exports.deleteMbom = async function(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.redirect('/projects');
        const projectId = (req.body && req.body.projectId) ? (req.body.projectId + '') : '';
        // Build MBOM-related table names (use configured names when present)
        const mbomSummaryTable = (dbConfig && dbConfig.MBOM_summary_table) ? dbConfig.MBOM_summary_table : 'mbomSum';
        const mbomBrkTable = (dbConfig && dbConfig.MBOM_breaker_table) ? dbConfig.MBOM_breaker_table : 'mbomBrkSum';
        const mbomBrkAccTable = (dbConfig && dbConfig.MBOM_brkAcc_table) ? dbConfig.MBOM_brkAcc_table : 'mbomBrkAccSum';
        const mbomItemTable = (dbConfig && dbConfig.MBOM_item_table) ? dbConfig.MBOM_item_table : 'mbomItemSum';
        const mbomUserItemTable = (dbConfig && dbConfig.MBOM_user_items) ? dbConfig.MBOM_user_items : 'mbomUserItem';
        const mbomNewSectionTable = (dbConfig && dbConfig.MBOM_new_section_sum) ? dbConfig.MBOM_new_section_sum : 'mbomNewSectionSum';

        const summaryTbl = (database) ? `${database}.${mbomSummaryTable}` : mbomSummaryTable;
        const brkTbl = (database) ? `${database}.${mbomBrkTable}` : mbomBrkTable;
        const brkAccTbl = (database) ? `${database}.${mbomBrkAccTable}` : mbomBrkAccTable;
        const itemTbl = (database) ? `${database}.${mbomItemTable}` : mbomItemTable;
        const userItemTbl = (database) ? `${database}.${mbomUserItemTable}` : mbomUserItemTable;
        const newSecTbl = (database) ? `${database}.${mbomNewSectionTable}` : mbomNewSectionTable;

        // Use a dedicated connection and transaction so all deletes succeed or none do.
        let conn;
        try {
            conn = await DB.getSqlConnection();
            await conn.beginTransaction();

            // Delete child records first to avoid orphaned data.
            // Order: breaker accessories -> breakers -> item sums -> user items -> sections -> summary
            await conn.query(`DELETE FROM ${brkAccTbl} WHERE mbomID = ?`, [id]);
            await conn.query(`DELETE FROM ${brkTbl} WHERE mbomID = ?`, [id]);
            await conn.query(`DELETE FROM ${itemTbl} WHERE mbomID = ?`, [id]);
            await conn.query(`DELETE FROM ${userItemTbl} WHERE mbomID = ?`, [id]);
            await conn.query(`DELETE FROM ${newSecTbl} WHERE mbomID = ?`, [id]);

            // finally remove the MBOM summary row
            await conn.query(`DELETE FROM ${summaryTbl} WHERE mbomID = ?`, [id]);

            await conn.commit();
        } catch (innerErr) {
            // attempt rollback on error
            try { if (conn) await conn.rollback(); } catch (rbErr) { /* ignore */ }
            console.error('deleteMbom transaction failed', innerErr && innerErr.stack ? innerErr.stack : innerErr);
            return res.redirect('/projects');
        } finally {
            try { if (conn) conn.release(); } catch (relErr) { /* ignore */ }
        }

        if (projectId) return res.redirect('/projects/' + encodeURIComponent(projectId));
        return res.redirect('/projects');
    } catch (e) {
        console.error('deleteMbom: error', e && e.stack ? e.stack : e);
        return res.redirect('/projects');
    }
};

// Batch delete MBOMs by ids (expects `ids` as JSON array string or array in POST body)
exports.batchDeleteMbom = async function(req, res) {
    try {
        let ids = req.body && req.body.ids ? req.body.ids : null;
        if (!ids) return res.redirect('/projects');
        if (typeof ids === 'string') {
            try { ids = JSON.parse(ids); } catch (e) { ids = ids.split(',').map(x=>x.trim()); }
        }
        if (!Array.isArray(ids) || ids.length === 0) return res.redirect('/projects');

        // Build MBOM-related table names
        const mbomSummaryTable = (dbConfig && dbConfig.MBOM_summary_table) ? dbConfig.MBOM_summary_table : 'mbomSum';
        const mbomBrkTable = (dbConfig && dbConfig.MBOM_breaker_table) ? dbConfig.MBOM_breaker_table : 'mbomBrkSum';
        const mbomBrkAccTable = (dbConfig && dbConfig.MBOM_brkAcc_table) ? dbConfig.MBOM_brkAcc_table : 'mbomBrkAccSum';
        const mbomItemTable = (dbConfig && dbConfig.MBOM_item_table) ? dbConfig.MBOM_item_table : 'mbomItemSum';
        const mbomUserItemTable = (dbConfig && dbConfig.MBOM_user_items) ? dbConfig.MBOM_user_items : 'mbomUserItem';
        const mbomNewSectionTable = (dbConfig && dbConfig.MBOM_new_section_sum) ? dbConfig.MBOM_new_section_sum : 'mbomNewSectionSum';

        const summaryTbl = (database) ? `${database}.${mbomSummaryTable}` : mbomSummaryTable;
        const brkTbl = (database) ? `${database}.${mbomBrkTable}` : mbomBrkTable;
        const brkAccTbl = (database) ? `${database}.${mbomBrkAccTable}` : mbomBrkAccTable;
        const itemTbl = (database) ? `${database}.${mbomItemTable}` : mbomItemTable;
        const userItemTbl = (database) ? `${database}.${mbomUserItemTable}` : mbomUserItemTable;
        const newSecTbl = (database) ? `${database}.${mbomNewSectionTable}` : mbomNewSectionTable;

        const projectId = (req.body && req.body.projectId) ? (req.body.projectId + '') : '';

        const conn = await DB.getSqlConnection();
        try {
            await conn.beginTransaction();
            for (let raw of ids) {
                const id = parseInt(raw, 10);
                if (!id) continue;
                await conn.query(`DELETE FROM ${brkAccTbl} WHERE mbomID = ?`, [id]);
                await conn.query(`DELETE FROM ${brkTbl} WHERE mbomID = ?`, [id]);
                await conn.query(`DELETE FROM ${itemTbl} WHERE mbomID = ?`, [id]);
                await conn.query(`DELETE FROM ${userItemTbl} WHERE mbomID = ?`, [id]);
                await conn.query(`DELETE FROM ${newSecTbl} WHERE mbomID = ?`, [id]);
                await conn.query(`DELETE FROM ${summaryTbl} WHERE mbomID = ?`, [id]);
            }
            await conn.commit();
        } catch (e) {
            try { await conn.rollback(); } catch (er) { /* ignore */ }
            try { conn.release(); } catch (er) { /* ignore */ }
            console.error('batchDeleteMbom failed', e && e.stack ? e.stack : e);
            return res.redirect('/projects');
        } finally {
            try { conn.release(); } catch (er) { /* ignore */ }
        }

        if (projectId) return res.redirect('/projects/' + encodeURIComponent(projectId));
        return res.redirect('/projects');
    } catch (e) {
        console.error('batchDeleteMbom: error', e && e.stack ? e.stack : e);
        return res.redirect('/projects');
    }
};