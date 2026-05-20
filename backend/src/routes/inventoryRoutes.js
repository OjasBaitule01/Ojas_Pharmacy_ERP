const express = require('express');
const router = express.Router();
const { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getMedicines);
router.get('/:id', protect, getMedicineById);

// Pharmacist or Admin can add or edit medicines
router.post('/', protect, authorize('Admin', 'Pharmacist'), createMedicine);
router.put('/:id', protect, authorize('Admin', 'Pharmacist'), updateMedicine);

// Only Admin can delete medicines
router.delete('/:id', protect, authorize('Admin'), deleteMedicine);

module.exports = router;
