const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  expiryDate: {
    type: Date,
    required: true
  },
  supplier: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseMedicine = mongoose.model('Medicine', MedicineSchema);

const MedicineProxy = new Proxy(MongooseMedicine, {
  get(target, prop) {
    if (global.useMockDb) {
      const mockClass = require('../mockDb').Medicine;
      const val = mockClass[prop];
      return typeof val === 'function' ? val.bind(mockClass) : val;
    }
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
  construct(target, args) {
    if (global.useMockDb) {
      const MockMedicine = require('../mockDb').Medicine;
      return new MockMedicine(...args);
    }
    return new MongooseMedicine(...args);
  }
});

module.exports = MedicineProxy;

