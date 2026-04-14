const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },        
  description: { type: String },                  
  imageUrl: { type: String },                     
  

  startTime: { type: Date, required: true },      
  endTime: { type: Date, required: true },        
  
  
  capacity: { type: Number, required: true },     
  bookedCount: { type: Number, default: 0 },      
  

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }      
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);