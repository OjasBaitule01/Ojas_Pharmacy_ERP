const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptions, updatePrescriptionStatus } = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('Admin', 'Pharmacist', 'Staff'), createPrescription);
router.get('/', protect, getPrescriptions);
router.put('/:id/status', protect, authorize('Admin', 'Pharmacist'), updatePrescriptionStatus);

module.exports = router;
