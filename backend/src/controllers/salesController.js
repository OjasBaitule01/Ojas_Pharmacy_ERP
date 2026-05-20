const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');

// Create a new sale transaction
exports.createSale = async (req, res) => {
  const { customerName, customerPhone, items, discount, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in sale transaction.' });
  }

  try {
    const saleItems = [];
    let subtotal = 0;

    // 1. Validate items and adjust stock
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine with ID ${item.medicineId} not found.` });
      }

      if (medicine.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}`
        });
      }

      // Check if expired
      if (new Date(medicine.expiryDate) < new Date()) {
        return res.status(400).json({
          message: `Cannot sell expired medicine: ${medicine.name}`
        });
      }

      const itemTotal = medicine.price * item.quantity;
      subtotal += itemTotal;

      saleItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        quantity: item.quantity,
        price: medicine.price,
        total: itemTotal
      });

      // Deduct stock
      medicine.stock -= item.quantity;
      await medicine.save();
    }

    // 2. Calculate totals (standard 12% GST calculation included for India PRD standard)
    const gstRate = 0.12; 
    const gstAmount = Math.round((subtotal * gstRate) * 100) / 100;
    const finalAmount = Math.round((subtotal + gstAmount - (discount || 0)) * 100) / 100;

    // 3. Generate sequential invoice number (e.g., INV-20260520-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `INV-${dateStr}-`;
    const count = await Sale.countDocuments({ invoiceNumber: new RegExp(`^${prefix}`) });
    const sequence = String(count + 1).padStart(4, '0');
    const invoiceNumber = `${prefix}${sequence}`;

    const sale = new Sale({
      invoiceNumber,
      customerName,
      customerPhone,
      items: saleItems,
      subtotal,
      gstAmount,
      discount: discount || 0,
      totalAmount: finalAmount,
      paymentMethod,
      servedBy: req.user.id
    });

    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Error processing sale transaction', error: err.message });
  }
};

// Retrieve sales transaction history
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('servedBy', 'username role')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving sales list', error: err.message });
  }
};

// Get single invoice details
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('servedBy', 'username role');
    if (!sale) return res.status(404).json({ message: 'Invoice not found.' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving invoice details', error: err.message });
  }
};
