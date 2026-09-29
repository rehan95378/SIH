const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auditLog = require('../middleware/auditLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Only admins can create admin/manager roles via registration
    const allowedRole = ['ENGINEER', 'MANAGER', 'ADMIN'].includes(role) ? role : 'ENGINEER';
    const newUser = await User.create({ name, email, password, role: allowedRole, department });

    await auditLog(newUser._id, 'REGISTER', 'User', newUser._id, { email, role: allowedRole }, req);

    const token = generateToken(newUser._id);
    res.status(201).json({ success: true, message: 'User registered successfully.', token, user: newUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    try { await user.save(); } catch (saveErr) {}

    await auditLog(user._id, 'LOGIN', 'User', user._id, { email }, req);

    const token = generateToken(user._id);
    const userObj = user.toJSON();
    res.json({ success: true, message: 'Login successful.', token, user: userObj });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user info.' });
  }
};
