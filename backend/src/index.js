require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse application/json
app.use(express.json({ limit: '10mb' }));

// Connect to Database
connectDB();

// Test health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ojas Pharmacy ERP API is running smoothly' });
});

// Map routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
