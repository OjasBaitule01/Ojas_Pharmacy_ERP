const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  patientPhone: {
    type: String,
    required: true,
    trim: true
  },
  doctorName: {
    type: String,
    required: true,
    trim: true
  },
  medicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    duration: String
  }],
  imageUrl: {
    type: String, // Path or Base64 data of prescription image
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Dispensed', 'Cancelled'],
    default: 'Pending'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongoosePrescription = mongoose.model('Prescription', PrescriptionSchema);

const PrescriptionProxy = new Proxy(MongoosePrescription, {
  get(target, prop) {
    if (global.useMockDb) {
      const mockClass = require('../mockDb').Prescription;
      const val = mockClass[prop];
      return typeof val === 'function' ? val.bind(mockClass) : val;
    }
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
  construct(target, args) {
    if (global.useMockDb) {
      const MockPrescription = require('../mockDb').Prescription;
      return new MockPrescription(...args);
    }
    return new MongoosePrescription(...args);
  }
});

module.exports = PrescriptionProxy;

