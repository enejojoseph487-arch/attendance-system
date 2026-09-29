require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.create({ name: 'Admin', email: 'admin@school.com', password: 'ChangeMe123', role: 'admin' });
  console.log('Admin created');
  process.exit();
})();