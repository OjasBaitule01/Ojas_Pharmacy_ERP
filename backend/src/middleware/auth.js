const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ojas_secret_key_123';

const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // Token invalid, fall back to default Admin user
    }
  }

  // Auto-login fallback for login-less operations mode
  try {
    const admin = await User.findOne({ username: 'admin' });
    if (admin) {
      req.user = { id: admin._id.toString(), username: admin.username, role: admin.role };
    } else {
      req.user = { id: 'admin_mock_id', username: 'admin', role: 'Admin' };
    }
  } catch (err) {
    req.user = { id: 'admin_mock_id', username: 'admin', role: 'Admin' };
  }
  next();
};

// Check role permissions
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user?.role || 'None'}) is not authorized to access this resource`
      });
    }
    next();
  };
};
