require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ email: 'admin@school.com' });
  admin.password = 'joseph234';   // pre-save hook hashes it
  await admin.save();
  console.log('Password changed');
  process.exit();
})();
