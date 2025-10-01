const debugController = require('../controllers/mbomController.js');
const url = require('url');

module.exports = function(app) {
    // temporary diagnostic endpoint to dump MBOM arrays for a given mbomID
    app.get('/debug/mbom/:mbomID/dump', async function(req, res) {
        // only allow in non-production or when secret provided
        const secret = req.query.secret || process.env.MBOM_DEBUG_SECRET;
        if (process.env.NODE_ENV === 'production' && !secret) {
            return res.status(403).send('Forbidden');
        }
        try {
            // The controller does not expose a direct function to return arrays, so
            // we will call the same queries the controller uses here to collect the data.
            const DB = require('../config/db.js');
            const querySql = DB.querySql;
            const dbConfig = require('../config/database.js');
            const database = dbConfig.database;
            const mbomID = req.params.mbomID;

            const mbomSum = await querySql("SELECT * FROM " + database + " . " + dbConfig.MBOM_summary_table + " WHERE mbomID = ?", [mbomID]);
            const secSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_new_section_sum + " WHERE mbomID = ?", [mbomID]);
            const itemSum = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_item_table + " WHERE mbomID = ?", [mbomID]);
            const userItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_user_items + " WHERE mbomID = ?", [mbomID]);
            const comItems = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_common_items, []);
            const brks = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_breaker_table + " WHERE mbomID = ?", [mbomID]);
            const brkAcc = await querySql("SELECT * FROM " + database + "." + dbConfig.MBOM_brkAcc_table + " WHERE mbomID = ?", [mbomID]);

            return res.json({
                mbomSum, secSum, itemSum, userItems, comItems, brks, brkAcc
            });
        } catch (err) {
            console.error('debug dump error', err && err.stack ? err.stack : err);
            return res.status(500).send('Error collecting MBOM debug data');
        }
    });
};
