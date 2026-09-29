const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '12h' });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await user.checkPassword(password || ''))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  res.json({ token: sign(user), user: { id: user.id, name: user.name, role: user.role } });
});

router.post('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Email already exists' });
    res.status(400).json({ message: e.message });
  }
});

router.get('/users', auth, requireRole('admin'), async (req, res) => {
  const teachers = await User.find({ role: 'teacher' }).select('name email createdAt').sort({ name: 1 });
  res.json(teachers);
});

module.exports = router;