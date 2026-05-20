const Prescription = require('../models/Prescription');

// Upload a new prescription
exports.createPrescription = async (req, res) => {
  const { patientName, patientEmail, patientPhone, doctorName, medicines, imageUrl, notes } = req.body;
  try {
    const prescription = new Prescription({
      patientName,
      patientEmail,
      patientPhone,
      doctorName,
      medicines: typeof medicines === 'string' ? JSON.parse(medicines) : medicines,
      imageUrl: imageUrl || '', // Can receive base64 or file path
      notes,
      uploadedBy: req.user.id
    });

    await prescription.save();
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Error uploading prescription', error: err.message });
  }
};

// Retrieve prescriptions list
exports.getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('uploadedBy', 'username role')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving prescriptions list', error: err.message });
  }
};

// Update status of prescription (e.g. Dispensed, Cancelled)
exports.updatePrescriptionStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Dispensed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found.' });

    prescription.status = status;
    await prescription.save();
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Error updating prescription status', error: err.message });
  }
};
