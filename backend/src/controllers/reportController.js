const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');

// Get high-level dashboard aggregates and chart data
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total revenue today
    const salesToday = await Sale.find({ createdAt: { $gte: today } });
    const revenueToday = salesToday.reduce((sum, s) => sum + s.totalAmount, 0);

    // 2. Total sales count overall
    const totalSalesCount = await Sale.countDocuments();

    // 3. Medicine alerts
    const totalMedicines = await Medicine.countDocuments();
    
    // Low stock count (stock <= lowStockThreshold)
    const lowStockCount = await Medicine.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // Expired medicine count
    const expiredCount = await Medicine.countDocuments({
      expiryDate: { $lt: new Date() }
    });

    // 4. Prescription alerts
    const pendingPrescriptionsCount = await Prescription.countDocuments({ status: 'Pending' });

    // 5. Chart Data: Sales for the last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const daySales = await Sale.find({ createdAt: { $gte: start, $lt: end } });
      const dayTotal = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const dayName = start.toLocaleDateString('en-US', { weekday: 'short' });
      
      chartData.push({
        day: dayName,
        date: start.toISOString().split('T')[0],
        sales: Math.round(dayTotal * 100) / 100
      });
    }

    // 6. Top selling medicines (aggregate query)
    const topMedicines = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicineId',
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      revenueToday,
      totalSalesCount,
      totalMedicines,
      lowStockCount,
      expiredCount,
      pendingPrescriptions: pendingPrescriptionsCount,
      weeklySales: chartData,
      topMedicines
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating dashboard metrics', error: err.message });
  }
};

// Get inventory summary report
exports.getInventoryReport = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ stock: 1 });
    
    // Total value of inventory
    const totalValue = medicines.reduce((sum, m) => sum + (m.stock * m.costPrice), 0);
    const totalRetailValue = medicines.reduce((sum, m) => sum + (m.stock * m.price), 0);

    res.json({
      totalValue,
      totalRetailValue,
      medicines
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating inventory report', error: err.message });
  }
};
