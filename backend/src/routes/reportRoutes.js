const express = require('express');
const router = express.Router();
const { getDashboardStats, getInventoryReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/inventory-value', protect, authorize('Admin', 'Pharmacist'), getInventoryReport);

module.exports = router;
