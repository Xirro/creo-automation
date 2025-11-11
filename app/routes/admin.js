const adminController = require('../controllers/adminController');
const ensureRole = require('../middleware/ensureRole');

module.exports = function(app) {
    const router = require('express').Router();

    // Protect /admin with ensureRole('admin')
    router.use(ensureRole('admin'));

    // List pending requests
    router.get('/requests', adminController.listPending);
    // List users (manage accounts)
    router.get('/users', adminController.listUsers);
    // Root redirect to requests
    router.get('/', function(req, res) { return res.redirect('/admin/requests'); });
    // Audit log viewer
    router.get('/audit', adminController.listAudit);

    // Approve/deny actions
    router.post('/requests/:id/approve', adminController.approveRequest);
    router.post('/requests/:id/deny', adminController.denyRequest);

    // Reset password for a user (admin)
    router.post('/users/:id/reset-password', adminController.resetPassword);
    // Update user details
    router.post('/users/:id/update', adminController.updateUser);
    // Delete user
    router.post('/users/:id/delete', adminController.deleteUser);

    app.use('/admin', router);
};
