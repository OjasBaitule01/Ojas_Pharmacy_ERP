const Medicine = require('../models/Medicine');

// Get all medicines (supports search, category filter, low stock, and expired filters)
exports.getMedicines = async (req, res) => {
  const { search, category, filter } = req.query;
  try {
    let query = {};

    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Status filter (lowStock, expired, etc.)
    if (filter === 'lowStock') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    } else if (filter === 'expired') {
      query.expiryDate = { $lt: new Date() };
    } else if (filter === 'nearExpiry') {
      const nearFuture = new Date();
      nearFuture.setMonth(nearFuture.getMonth() + 3); // 3 months warning
      query.expiryDate = { $gte: new Date(), $lte: nearFuture };
    }

    const medicines = await Medicine.find(query).sort({ name: 1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving inventory list', error: err.message });
  }
};

// Get single medicine details
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving medicine', error: err.message });
  }
};

// Create a new medicine
exports.createMedicine = async (req, res) => {
  try {
    const { name, code, category, price, costPrice, stock, lowStockThreshold, expiryDate, supplier, description } = req.body;
    
    // Check if code is unique
    const existing = await Medicine.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: `Medicine code ${code} is already in use.` });
    }

    const medicine = new Medicine({
      name,
      code,
      category,
      price,
      costPrice,
      stock,
      lowStockThreshold,
      expiryDate,
      supplier,
      description
    });

    await medicine.save();
    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ message: 'Error adding medicine to inventory', error: err.message });
  }
};

// Update medicine details
exports.updateMedicine = async (req, res) => {
  try {
    const { name, code, category, price, costPrice, stock, lowStockThreshold, expiryDate, supplier, description } = req.body;
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    // Verify code uniqueness if code is changed
    if (code && code !== medicine.code) {
      const existing = await Medicine.findOne({ code });
      if (existing) {
        return res.status(400).json({ message: `Medicine code ${code} is already in use.` });
      }
    }

    medicine.name = name ?? medicine.name;
    medicine.code = code ?? medicine.code;
    medicine.category = category ?? medicine.category;
    medicine.price = price ?? medicine.price;
    medicine.costPrice = costPrice ?? medicine.costPrice;
    medicine.stock = stock ?? medicine.stock;
    medicine.lowStockThreshold = lowStockThreshold ?? medicine.lowStockThreshold;
    medicine.expiryDate = expiryDate ?? medicine.expiryDate;
    medicine.supplier = supplier ?? medicine.supplier;
    medicine.description = description ?? medicine.description;

    await medicine.save();
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: 'Error updating medicine', error: err.message });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    await medicine.deleteOne();
    res.json({ message: 'Medicine removed from inventory successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting medicine', error: err.message });
  }
};
