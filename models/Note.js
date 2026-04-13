const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  title: { type: String, required: true },
  content: { type: String },
  tags: [{ type: String }], 
  category: { type: String, default: 'Umumiy' }, 
  
  isPinned: { type: Boolean, default: false }, 
  isArchived: { type: Boolean, default: false }, 
  isTrashed: { type: Boolean, default: false }, 
  isCompleted: { type: Boolean, default: false }, 
  
  remindAt: { type: Date }, 
  isReminded: { type: Boolean, default: false } 
}, { timestamps: true }); 

module.exports = mongoose.model('Note', noteSchema);