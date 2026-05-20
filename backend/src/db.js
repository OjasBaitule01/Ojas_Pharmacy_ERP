const mongoose = require('mongoose');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const Prescription = require('./models/Prescription');
const Sale = require('./models/Sale');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ojas-pharmacy';
    console.log(`Connecting to MongoDB at: ${connStr}`);
    
    await mongoose.connect(connStr);
    console.log('MongoDB Connected Successfully.');
    
    // Seed initial data if database is empty
    await seedData();
  } catch (err) {
    console.error(`Database Connection Error: ${err.message}`);
    console.log('Ensure MongoDB is running or configure MONGO_URI in .env');
    console.log('Switching to local JSON mock database fallback...');
    global.useMockDb = true;
    try {
      const mockDb = require('./mockDb');
      await mockDb.seedMockData();
    } catch (mockErr) {
      console.error(`Failed to initialize local JSON mock database: ${mockErr.message}`);
    }
  }
};

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Seeding skipped.');
      return;
    }
    
    console.log('Database is empty. Seeding initial data...');
    
    // 1. Seed Users (passwords will be hashed by pre-save hooks)
    const admin = new User({ username: 'admin', email: 'admin@ojas.com', password: 'password123', role: 'Admin' });
    const pharmacist = new User({ username: 'pharmacist', email: 'pharma@ojas.com', password: 'password123', role: 'Pharmacist' });
    const staff = new User({ username: 'staff', email: 'staff@ojas.com', password: 'password123', role: 'Staff' });
    
    await admin.save();
    await pharmacist.save();
    await staff.save();
    
    console.log('Users seeded.');

    // 2. Seed Medicines
    const today = new Date();
    const futureDate = (months) => new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
    const pastDate = (months) => new Date(today.getFullYear(), today.getMonth() - months, today.getDate());

    const medicines = [
      { name: 'Paracetamol 500mg', code: 'MED001', category: 'Analgesics', price: 15.0, costPrice: 8.0, stock: 120, lowStockThreshold: 20, expiryDate: futureDate(12), supplier: 'Apex Pharma' },
      { name: 'Amoxicillin 250mg', code: 'MED002', category: 'Antibiotics', price: 45.0, costPrice: 25.0, stock: 80, lowStockThreshold: 15, expiryDate: futureDate(6), supplier: 'Cipla Lab' },
      { name: 'Ibuprofen 400mg', code: 'MED003', category: 'Analgesics', price: 20.0, costPrice: 12.0, stock: 8, lowStockThreshold: 15, expiryDate: futureDate(9), supplier: 'Apex Pharma' }, // Low stock
      { name: 'Metformin 850mg', code: 'MED004', category: 'Antidiabetics', price: 35.0, costPrice: 18.0, stock: 250, lowStockThreshold: 30, expiryDate: futureDate(18), supplier: 'Sun Health' },
      { name: 'Atorvastatin 10mg', code: 'MED005', category: 'Cardiovascular', price: 60.0, costPrice: 35.0, stock: 45, lowStockThreshold: 10, expiryDate: pastDate(1), supplier: 'Sun Health' }, // Expired
      { name: 'Cetirizine 10mg', code: 'MED006', category: 'Antihistamines', price: 12.0, costPrice: 6.0, stock: 150, lowStockThreshold: 20, expiryDate: futureDate(10), supplier: 'Cipla Lab' },
      { name: 'Amlodipine 5mg', code: 'MED007', category: 'Cardiovascular', price: 18.0, costPrice: 10.0, stock: 3, lowStockThreshold: 10, expiryDate: futureDate(2), supplier: 'Astra Biotech' } // Near expiry & low stock
    ];

    const seededMeds = await Medicine.insertMany(medicines);
    console.log('Medicines seeded.');

    // 3. Seed Prescriptions
    const prescriptions = [
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
    ];

    await Prescription.insertMany(prescriptions);
    console.log('Prescriptions seeded.');

    // 4. Seed Sales (simulated for the last 5 days to populate charts)
    const sales = [];
    const getPastDate = (daysAgo) => new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Day 4 ago
    sales.push({
      invoiceNumber: 'INV-2026-001',
      customerName: 'Anil Gupta',
      customerPhone: '9876012345',
      items: [
        { medicineId: seededMeds[0]._id, name: seededMeds[0].name, quantity: 2, price: 15.0, total: 30.0 },
        { medicineId: seededMeds[1]._id, name: seededMeds[1].name, quantity: 1, price: 45.0, total: 45.0 }
      ],
      subtotal: 75.0,
      gstAmount: 9.0, // 12% mock GST
      discount: 5.0,
      totalAmount: 79.0,
      paymentMethod: 'UPI',
      servedBy: staff._id,
      createdAt: getPastDate(4)
    });

    // Day 3 ago
    sales.push({
      invoiceNumber: 'INV-2026-002',
      customerName: 'Pooja Roy',
      customerPhone: '9898989898',
      items: [
        { medicineId: seededMeds[3]._id, name: seededMeds[3].name, quantity: 3, price: 35.0, total: 105.0 }
      ],
      subtotal: 105.0,
      gstAmount: 12.6,
      discount: 0.0,
      totalAmount: 117.6,
      paymentMethod: 'Cash',
      servedBy: pharmacist._id,
      createdAt: getPastDate(3)
    });

    // Day 2 ago
    sales.push({
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
    });

    // Day 1 ago
    sales.push({
      invoiceNumber: 'INV-2026-004',
      customerName: 'Karan Johar',
      customerPhone: '9111111111',
      items: [
        { medicineId: seededMeds[3]._id, name: seededMeds[3].name, quantity: 1, price: 35.0, total: 35.0 }
      ],
      subtotal: 35.0,
      gstAmount: 4.2,
      discount: 0.0,
      totalAmount: 39.2,
      paymentMethod: 'UPI',
      servedBy: staff._id,
      createdAt: getPastDate(1)
    });

    // Today
    sales.push({
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
    });

    await Sale.insertMany(sales);
    console.log('Sales seeded successfully.');
    console.log('Database Seeding Complete.');
  } catch (err) {
    console.error(`Database seeding failed: ${err.message}`);
  }
};

module.exports = connectDB;
