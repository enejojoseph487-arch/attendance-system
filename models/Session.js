const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  signIn:  { type: Date, required: true, default: Date.now },
  signOut: Date,
  open:    { type: Boolean, default: true },
  note:    String,
}, { timestamps: true });

// One open session per teacher
sessionSchema.index({ teacher: 1 }, { unique: true, partialFilterExpression: { open: true } });

module.exports = mongoose.model('Session', sessionSchema);