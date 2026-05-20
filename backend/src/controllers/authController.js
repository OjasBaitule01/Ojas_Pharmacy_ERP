const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ojas_secret_key_123';

// Register User
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    user = new User({ username, email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
};

// Login User
exports.login = async (req, res) => {
  const { emailOrUsername, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile', error: err.message });
  }
};
