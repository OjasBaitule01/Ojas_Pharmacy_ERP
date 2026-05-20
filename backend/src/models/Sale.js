const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const SaleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  items: [SaleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  gstAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI'],
    default: 'Cash'
  },
  servedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseSale = mongoose.model('Sale', SaleSchema);

const SaleProxy = new Proxy(MongooseSale, {
  get(target, prop) {
    if (global.useMockDb) {
      return require('../mockDb').Sale[prop];
    }
    return MongooseSale[prop];
  },
  construct(target, args) {
    if (global.useMockDb) {
      const MockSale = require('../mockDb').Sale;
      return new MockSale(...args);
    }
    return new MongooseSale(...args);
  }
});

module.exports = SaleProxy;

