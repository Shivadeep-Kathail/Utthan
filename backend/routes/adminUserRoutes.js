const express = require('express');
const adminUserController = require('../controllers/adminUserController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.protect, auth.requireRole('admin'));

// User Listing
router.get('/', adminUserController.getAllUsers);
router.get('/deleted', adminUserController.getDeletedUsers);
router.get('/:id', adminUserController.getUser);

// User Management
router.patch('/:id/role', adminUserController.changeUserRole);
router.patch('/:id/recover', adminUserController.recoverUser);
router.delete('/:id', adminUserController.permanentlyDeleteUser);

module.exports = router;
