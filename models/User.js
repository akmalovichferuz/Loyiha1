const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  phoneNumber: { type: String, required: true },
  telegramChatId: { type: Number, required: true },
  password: { type: String },
  otpCode: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);