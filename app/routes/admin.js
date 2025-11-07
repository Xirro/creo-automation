const adminController = require('../controllers/adminController');
const ensureRole = require('../middleware/ensureRole');

module.exports = function(app) {
    const router = require('express').Router();

    // Protect /admin with ensureRole('admin')
    router.use(ensureRole('admin'));

    // List pending requests
    router.get('/requests', adminController.listPending);

    // Approve/deny actions
    router.post('/requests/:id/approve', adminController.approveRequest);
    router.post('/requests/:id/deny', adminController.denyRequest);

    // Reset password for a user (admin)
    router.post('/users/:id/reset-password', adminController.resetPassword);

    app.use('/admin', router);
};
