const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },        // Tadbir nomi
  description: { type: String },                  // Batafsil ma'lumot
  imageUrl: { type: String },                     // Rasm (ixtiyoriy)
  
  // Vaqtlar (Eng muhim qism - To'qnashuvlarni shu orqali tekshiramiz)
  startTime: { type: Date, required: true },      // Qachon boshlanadi?
  endTime: { type: Date, required: true },        // Qachon tugaydi?
  
  // Joylar va Sig'im
  capacity: { type: Number, required: true },     // Zal jami nechta odam sig'diradi?
  bookedCount: { type: Number, default: 0 },      // Hozirda nechta joy band qilingan?
  
  // Kim yaratdi? (Faqat adminlar)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }      // Tadbir ochiqmi yoki yopilganmi?
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);