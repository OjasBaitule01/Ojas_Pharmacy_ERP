const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Pharmacist', 'Staff', 'Supplier', 'Customer'],
    default: 'Staff'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const MongooseUser = mongoose.model('User', UserSchema);

const UserProxy = new Proxy(MongooseUser, {
  get(target, prop) {
    if (global.useMockDb) {
      const mockClass = require('../mockDb').User;
      const val = mockClass[prop];
      return typeof val === 'function' ? val.bind(mockClass) : val;
    }
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
  construct(target, args) {
    if (global.useMockDb) {
      const MockUser = require('../mockDb').User;
      return new MockUser(...args);
    }
    return new MongooseUser(...args);
  }
});

module.exports = UserProxy;

