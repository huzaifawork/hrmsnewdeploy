const express = require('express');
const { addStaff, getAllStaff, updateStaff, deleteStaff } = require('../Controllers/StaffController');
const { ensureAuthenticated, ensureAdmin } = require('../Middlewares/Auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// Admin-only routes for staff management
router.post('/add', ensureAdmin, addStaff);
router.post('/', ensureAdmin, addStaff); // Alternative endpoint for frontend compatibility
router.get('/', getAllStaff); // Allow authenticated users to view staff
router.put('/:id', ensureAdmin, updateStaff);
router.delete('/:id', ensureAdmin, deleteStaff);

module.exports = router;