const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, 'mock_data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR);
}

// Simple Helper to Read JSON file
const readJson = (filename) => {
  const filePath = path.join(DB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
};

// Simple Helper to Write JSON file
const writeJson = (filename, data) => {
  fs.writeFileSync(path.join(DB_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
};

// Generates MongoDB-like ObjectId strings
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Chainable array wrapper to mock Mongoose query methods
function makeChainable(arr) {
  const result = [...arr];
  
  result.sort = function(sortObj) {
    const key = Object.keys(sortObj)[0];
    const order = sortObj[key];
    const sorted = [...this].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      // Handle Date sorting
      if (valA instanceof Date || (typeof valA === 'string' && Date.parse(valA))) {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return order === -1 ? 1 : -1;
      if (valA > valB) return order === -1 ? -1 : 1;
      return 0;
    });
    return makeChainable(sorted);
  };

  result.populate = function(field) {
    const populated = this.map(item => {
      const copy = { ...item };
      if (field === 'servedBy' && copy.servedBy) {
        const users = readJson('users.json');
        const user = users.find(u => u._id === copy.servedBy.toString() || u._id === copy.servedBy);
        if (user) {
          copy.servedBy = { _id: user._id, username: user.username, role: user.role };
        }
      }
      return copy;
    });
    return makeChainable(populated);
  };

  result.select = function() {
    return this;
  };

  result.then = function(onResolve) {
    return Promise.resolve(this).then(onResolve);
  };

  return result;
}

// Chainable single-object wrapper
function makeChainableObj(obj) {
  if (!obj) return null;
  const copy = { ...obj };

  copy.select = function() {
    return this;
  };

  copy.populate = function(field) {
    if (field === 'servedBy' && copy.servedBy) {
      const users = readJson('users.json');
      const user = users.find(u => u._id === copy.servedBy.toString() || u._id === copy.servedBy);
      if (user) {
        copy.servedBy = { _id: user._id, username: user.username, role: user.role };
      }
    }
    return this;
  };

  copy.then = function(onResolve) {
    return Promise.resolve(this).then(onResolve);
  };

  return copy;
}

// Mock User Model Implementation
class User {
  constructor(data) {
    this._id = generateId();
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Note: controller hashes this before save
    this.role = data.role || 'Staff';
    this.createdAt = new Date();
  }

  async save() {
    const users = readJson('users.json');
    // Simple mock pre-save bcrypt hash
    if (this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    users.push(this);
    writeJson('users.json', users);
    return this;
  }

  static findOne(query) {
    const users = readJson('users.json');
    const user = users.find(u => {
      if (query.$or) {
        return query.$or.some(q => {
          if (q.email) return u.email.toLowerCase() === q.email.toLowerCase();
          if (q.username) return u.username === q.username;
          return false;
        });
      }
      if (query.email) return u.email.toLowerCase() === query.email.toLowerCase();
      if (query.username) return u.username === query.username;
      return false;
    });
    return makeChainableObj(user);
  }

  static findById(id) {
    const users = readJson('users.json');
    const user = users.find(u => u._id === id);
    return makeChainableObj(user);
  }

  static countDocuments() {
    const users = readJson('users.json');
    return Promise.resolve(users.length);
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

// Mock Medicine Model Implementation
class Medicine {
  constructor(data) {
    this._id = generateId();
    this.name = data.name;
    this.code = data.code;
    this.category = data.category;
    this.price = Number(data.price);
    this.costPrice = Number(data.costPrice);
    this.stock = Number(data.stock) || 0;
    this.lowStockThreshold = Number(data.lowStockThreshold) || 10;
    this.expiryDate = new Date(data.expiryDate);
    this.supplier = data.supplier;
    this.description = data.description;
    this.createdAt = new Date();
  }

  async save() {
    const medicines = readJson('medicines.json');
    const idx = medicines.findIndex(m => m._id === this._id || m.code === this.code);
    if (idx !== -1) {
      medicines[idx] = { ...medicines[idx], ...this };
    } else {
      medicines.push(this);
    }
    writeJson('medicines.json', medicines);
    return this;
  }

  async deleteOne() {
    let medicines = readJson('medicines.json');
    medicines = medicines.filter(m => m._id !== this._id);
    writeJson('medicines.json', medicines);
    return { deletedCount: 1 };
  }

  static find(query = {}) {
    let medicines = readJson('medicines.json');
    
    // Apply filters
    if (query.$or) {
      medicines = medicines.filter(m => {
        return query.$or.some(q => {
          if (q.name && q.name.$regex) {
            return new RegExp(q.name.$regex, 'i').test(m.name);
          }
          if (q.code && q.code.$regex) {
            return new RegExp(q.code.$regex, 'i').test(m.code);
          }
          return false;
        });
      });
    }

    if (query.category) {
      medicines = medicines.filter(m => m.category === query.category);
    }

    if (query.$expr && query.$expr.$lte) {
      // lowStock filter
      medicines = medicines.filter(m => m.stock <= m.lowStockThreshold);
    }

    if (query.expiryDate) {
      const today = new Date();
      if (query.expiryDate.$lt) {
        medicines = medicines.filter(m => new Date(m.expiryDate) < today);
      } else if (query.expiryDate.$gte && query.expiryDate.$lte) {
        const nearLimit = new Date(query.expiryDate.$lte);
        medicines = medicines.filter(m => {
          const exp = new Date(m.expiryDate);
          return exp >= today && exp <= nearLimit;
        });
      }
    }

    return makeChainable(medicines);
  }

  static findById(id) {
    const medicines = readJson('medicines.json');
    const med = medicines.find(m => m._id === id);
    if (!med) return makeChainableObj(null);
    
    // Bind save and deleteOne instance methods
    const instance = new Medicine(med);
    instance._id = med._id;
    return makeChainableObj(instance);
  }

  static findOne(query) {
    const medicines = readJson('medicines.json');
    const med = medicines.find(m => m.code === query.code);
    if (!med) return makeChainableObj(null);
    return makeChainableObj(med);
  }

  static countDocuments(query = {}) {
    let list = readJson('medicines.json');
    if (query.$expr && query.$expr.$lte) {
      list = list.filter(m => m.stock <= m.lowStockThreshold);
    } else if (query.expiryDate && query.expiryDate.$lt) {
      list = list.filter(m => new Date(m.expiryDate) < new Date());
    }
    return Promise.resolve(list.length);
  }

  static insertMany(arr) {
    const medicines = readJson('medicines.json');
    const created = arr.map(item => {
      const m = new Medicine(item);
      medicines.push(m);
      return m;
    });
    writeJson('medicines.json', medicines);
    return Promise.resolve(created);
  }
}

// Mock Prescription Model Implementation
class Prescription {
  constructor(data) {
    this._id = generateId();
    this.patientName = data.patientName;
    this.patientEmail = data.patientEmail;
    this.patientPhone = data.patientPhone;
    this.doctorName = data.doctorName;
    this.medicines = data.medicines || [];
    this.imageUrl = data.imageUrl || '';
    this.status = data.status || 'Pending';
    this.notes = data.notes;
    this.uploadedBy = data.uploadedBy;
    this.createdAt = new Date();
  }

  async save() {
    const prescriptions = readJson('prescriptions.json');
    const idx = prescriptions.findIndex(p => p._id === this._id);
    if (idx !== -1) {
      prescriptions[idx] = { ...prescriptions[idx], ...this };
    } else {
      prescriptions.push(this);
    }
    writeJson('prescriptions.json', prescriptions);
    return this;
  }

  static find() {
    const prescriptions = readJson('prescriptions.json');
    return makeChainable(prescriptions);
  }

  static findById(id) {
    const prescriptions = readJson('prescriptions.json');
    const p = prescriptions.find(item => item._id === id);
    if (!p) return makeChainableObj(null);
    
    const instance = new Prescription(p);
    instance._id = p._id;
    return makeChainableObj(instance);
  }

  static countDocuments(query = {}) {
    let list = readJson('prescriptions.json');
    if (query.status) {
      list = list.filter(p => p.status === query.status);
    }
    return Promise.resolve(list.length);
  }

  static insertMany(arr) {
    const prescriptions = readJson('prescriptions.json');
    const created = arr.map(item => {
      const p = new Prescription(item);
      prescriptions.push(p);
      return p;
    });
    writeJson('prescriptions.json', prescriptions);
    return Promise.resolve(created);
  }
}

// Mock Sale Model Implementation
class Sale {
  constructor(data) {
    this._id = generateId();
    this.invoiceNumber = data.invoiceNumber;
    this.customerName = data.customerName;
    this.customerPhone = data.customerPhone;
    this.items = data.items || [];
    this.subtotal = Number(data.subtotal);
    this.gstAmount = Number(data.gstAmount);
    this.discount = Number(data.discount) || 0;
    this.totalAmount = Number(data.totalAmount);
    this.paymentMethod = data.paymentMethod || 'Cash';
    this.servedBy = data.servedBy;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save() {
    const sales = readJson('sales.json');
    sales.push(this);
    writeJson('sales.json', sales);
    return this;
  }

  static find(query = {}) {
    let sales = readJson('sales.json');
    if (query.createdAt) {
      if (query.createdAt.$gte && query.createdAt.$lt) {
        const start = new Date(query.createdAt.$gte);
        const end = new Date(query.createdAt.$lt);
        sales = sales.filter(s => {
          const d = new Date(s.createdAt);
          return d >= start && d < end;
        });
      } else if (query.createdAt.$gte) {
        const limit = new Date(query.createdAt.$gte);
        sales = sales.filter(s => new Date(s.createdAt) >= limit);
      }
    }
    return makeChainable(sales);
  }

  static findById(id) {
    const sales = readJson('sales.json');
    const sale = sales.find(s => s._id === id);
    return makeChainableObj(sale);
  }

  static countDocuments(query = {}) {
    let list = readJson('sales.json');
    if (query.invoiceNumber && query.invoiceNumber.source) {
      const pattern = new RegExp(query.invoiceNumber.source);
      list = list.filter(s => pattern.test(s.invoiceNumber));
    } else if (query.createdAt && query.createdAt.$gte) {
      const limit = new Date(query.createdAt.$gte);
      list = list.filter(s => new Date(s.createdAt) >= limit);
    }
    return Promise.resolve(list.length);
  }

  static insertMany(arr) {
    const sales = readJson('sales.json');
    const created = arr.map(item => {
      const s = new Sale(item);
      sales.push(s);
      return s;
    });
    writeJson('sales.json', sales);
    return Promise.resolve(created);
  }

  // Dashboard top-selling medicines aggregator
  static aggregate() {
    const sales = readJson('sales.json');
    const map = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!map[item.medicineId]) {
          map[item.medicineId] = {
            _id: item.medicineId,
            name: item.name,
            totalQty: 0,
            revenue: 0
          };
        }
        map[item.medicineId].totalQty += item.quantity;
        map[item.medicineId].revenue += item.total;
      }
    }
    const result = Object.values(map)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
    return Promise.resolve(result);
  }
}

// Database Seeder for Mock JSON data
const seedMockData = async () => {
  const userCount = readJson('users.json').length;
  if (userCount > 0) return;

  console.log('Seeding initial records to local JSON database mock...');

  // 1. Seed users
  const admin = new User({ username: 'admin', email: 'admin@ojas.com', password: 'password123', role: 'Admin' });
  const pharmacist = new User({ username: 'pharmacist', email: 'pharma@ojas.com', password: 'password123', role: 'Pharmacist' });
  const staff = new User({ username: 'staff', email: 'staff@ojas.com', password: 'password123', role: 'Staff' });
  await admin.save();
  await pharmacist.save();
  await staff.save();

  // 2. Seed medicines
  const today = new Date();
  const futureDate = (m) => new Date(today.getFullYear(), today.getMonth() + m, today.getDate());
  const pastDate = (m) => new Date(today.getFullYear(), today.getMonth() - m, today.getDate());

  const seededMeds = await Medicine.insertMany([
    { name: 'Paracetamol 500mg', code: 'MED001', category: 'Analgesics', price: 15.0, costPrice: 8.0, stock: 120, lowStockThreshold: 20, expiryDate: futureDate(12), supplier: 'Apex Pharma' },
    { name: 'Amoxicillin 250mg', code: 'MED002', category: 'Antibiotics', price: 45.0, costPrice: 25.0, stock: 80, lowStockThreshold: 15, expiryDate: futureDate(6), supplier: 'Cipla Lab' },
    { name: 'Ibuprofen 400mg', code: 'MED003', category: 'Analgesics', price: 20.0, costPrice: 12.0, stock: 8, lowStockThreshold: 15, expiryDate: futureDate(9), supplier: 'Apex Pharma' },
    { name: 'Metformin 850mg', code: 'MED004', category: 'Antidiabetics', price: 35.0, costPrice: 18.0, stock: 250, lowStockThreshold: 30, expiryDate: futureDate(18), supplier: 'Sun Health' },
    { name: 'Atorvastatin 10mg', code: 'MED005', category: 'Cardiovascular', price: 60.0, costPrice: 35.0, stock: 45, lowStockThreshold: 10, expiryDate: pastDate(1), supplier: 'Sun Health' },
    { name: 'Cetirizine 10mg', code: 'MED006', category: 'Antihistamines', price: 12.0, costPrice: 6.0, stock: 150, lowStockThreshold: 20, expiryDate: futureDate(10), supplier: 'Cipla Lab' },
    { name: 'Amlodipine 5mg', code: 'MED007', category: 'Cardiovascular', price: 18.0, costPrice: 10.0, stock: 3, lowStockThreshold: 10, expiryDate: futureDate(2), supplier: 'Astra Biotech' }
  ]);

  // 3. Seed prescriptions
  await Prescription.insertMany([
    {
      patientName: 'Ramesh Kumar',
      patientEmail: 'ramesh@gmail.com',
      patientPhone: '9876543210',
      doctorName: 'Dr. A. K. Sharma',
      medicines: [
        { name: 'Amoxicillin 250mg', dosage: '250mg', frequency: 'Thrice a day', duration: '5 Days' },
        { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'As needed', duration: '3 Days' }
      ],
      status: 'Pending',
      notes: 'Patient reported mild fever and throat infection.',
      uploadedBy: pharmacist._id
    },
    {
      patientName: 'Sunita Devi',
      patientEmail: 'sunita@gmail.com',
      patientPhone: '9812345678',
      doctorName: 'Dr. Preeti Gupta',
      medicines: [
        { name: 'Metformin 850mg', dosage: '850mg', frequency: 'Twice a day', duration: '30 Days' }
      ],
      status: 'Dispensed',
      notes: 'Regular check-up. Diabetic history.',
      uploadedBy: pharmacist._id
    },
    {
      patientName: 'Nisha Patel',
      patientEmail: 'nisha@gmail.com',
      patientPhone: '9123456780',
      doctorName: 'Dr. Ravi Menon',
      medicines: [
        { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Twice a day', duration: '7 Days' }
      ],
      status: 'Pending',
      notes: 'New patient with mild joint pain.',
      uploadedBy: admin._id
    },
    {
      patientName: 'Amit Sharma',
      patientEmail: 'amit.sharma@gmail.com',
      patientPhone: '9811223344',
      doctorName: 'Dr. Priya Roy',
      medicines: [
        { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'Once a day', duration: '10 Days' }
      ],
      status: 'Dispensed',
      notes: 'Seasonal allergy treatment.',
      uploadedBy: staff._id
    }
  ]);

  // 4. Seed sales for the last 5 days
  const getPastDate = (daysAgo) => new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  await Sale.insertMany([
    {
      invoiceNumber: 'INV-2026-001',
      customerName: 'Anil Gupta',
      customerPhone: '9876012345',
      items: [{ medicineId: seededMeds[0]._id, name: seededMeds[0].name, quantity: 2, price: 15.0, total: 30.0 }],
      subtotal: 75.0,
      gstAmount: 9.0,
      discount: 5.0,
      totalAmount: 79.0,
      paymentMethod: 'UPI',
      servedBy: staff._id,
      createdAt: getPastDate(4)
    },
    {
      invoiceNumber: 'INV-2026-002',
      customerName: 'Pooja Roy',
      customerPhone: '9898989898',
      items: [{ medicineId: seededMeds[3]._id, name: seededMeds[3].name, quantity: 3, price: 35.0, total: 105.0 }],
      subtotal: 105.0,
      gstAmount: 12.6,
      discount: 0.0,
      totalAmount: 117.6,
      paymentMethod: 'Cash',
      servedBy: pharmacist._id,
      createdAt: getPastDate(3)
    },
    {
      invoiceNumber: 'INV-2026-003',
      customerName: 'Vikram Singh',
      customerPhone: '9000000001',
      items: [
        { medicineId: seededMeds[0]._id, name: seededMeds[0].name, quantity: 5, price: 15.0, total: 75.0 },
        { medicineId: seededMeds[5]._id, name: seededMeds[5].name, quantity: 2, price: 12.0, total: 24.0 }
      ],
      subtotal: 99.0,
      gstAmount: 11.88,
      discount: 10.0,
      totalAmount: 100.88,
      paymentMethod: 'Card',
      servedBy: admin._id,
      createdAt: getPastDate(2)
    },
    {
      invoiceNumber: 'INV-2026-004',
      customerName: 'Karan Johar',
      customerPhone: '9111111111',
      items: [{ medicineId: seededMeds[3]._id, name: seededMeds[3].name, quantity: 1, price: 35.0, total: 35.0 }],
      subtotal: 35.0,
      gstAmount: 4.2,
      discount: 0.0,
      totalAmount: 39.2,
      paymentMethod: 'UPI',
      servedBy: staff._id,
      createdAt: getPastDate(1)
    },
    {
      invoiceNumber: 'INV-2026-005',
      customerName: 'Deepika P',
      customerPhone: '9222222222',
      items: [
        { medicineId: seededMeds[0]._id, name: seededMeds[0].name, quantity: 10, price: 15.0, total: 150.0 },
        { medicineId: seededMeds[1]._id, name: seededMeds[1].name, quantity: 2, price: 45.0, total: 90.0 }
      ],
      subtotal: 240.0,
      gstAmount: 28.8,
      discount: 15.0,
      totalAmount: 253.8,
      paymentMethod: 'Card',
      servedBy: pharmacist._id,
      createdAt: today
    }
  ]);
  console.log('Seeded local mock database database successfully.');
};

module.exports = {
  User,
  Medicine,
  Prescription,
  Sale,
  seedMockData
};
