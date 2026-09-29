const User = require('../models/User');
const auditLog = require('../middleware/auditLog');

exports.getUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, password required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const user = await User.create({ name, email, password, role, department });
    await auditLog(req.user._id, 'USER_CREATED', 'User', user._id, { email, role }, req);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, department, status, currentPassword, newPassword } = req.body;
    let { role } = req.body;

    // Prevent self-role escalation
    if (req.params.id === req.user._id.toString() && role && role !== req.user.role) {
      return res.status(403).json({ success: false, message: 'Cannot change your own role.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    // Handle password change with verification
    if (newPassword) {
      const bcrypt = require('bcryptjs');
      if (currentPassword) {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    } else if (req.body.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(req.body.password, 12);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const action = role ? 'ROLE_CHANGED' : 'USER_UPDATED';
    await auditLog(req.user._id, action, 'User', user._id, { name, department, role }, req);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await auditLog(req.user._id, 'USER_DEACTIVATED', 'User', user._id, { status }, req);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};
