const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/:id', protect, getSaleById);

module.exports = router;
