const express = require('express');
const { addStaff, getAllStaff, updateStaff, deleteStaff } = require('../Controllers/StaffController');
const { ensureAuthenticated, ensureAdmin } = require('../Middlewares/Auth');

const router = express.Router();

// Debug endpoint to test basic functionality
router.get('/debug', (req, res) => {
  res.json({
    message: 'Staff routes are working',
    timestamp: new Date().toISOString(),
    headers: req.headers.authorization ? 'Token present' : 'No token'
  });
});

// Apply authentication middleware to all routes except debug
router.use(ensureAuthenticated);

// Debug endpoint to test authentication
router.get('/debug-auth', (req, res) => {
  res.json({
    message: 'Authentication working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Admin-only routes for staff management
router.post('/add', ensureAdmin, addStaff);
router.post('/', ensureAdmin, addStaff); // Alternative endpoint for frontend compatibility
router.get('/', getAllStaff); // Allow authenticated users to view staff
router.put('/:id', ensureAdmin, updateStaff);
router.delete('/:id', ensureAdmin, deleteStaff);

module.exports = router;