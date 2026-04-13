const Note = require('../models/Note');
const User = require('../models/User');

// Yordamchi: So'rov yuborayotgan odamni telefon raqamidan tanib olish
const getUserByPhone = async (req) => {
  const phone = req.headers['user-phone'];
  if (!phone) throw new Error("Foydalanuvchi tasdiqlanmadi!");
  return await User.findOne({ phoneNumber: phone });
};

// 1. YANGI ZAMETKA YARATISH
const createNote = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    const newNote = new Note({ ...req.body, userId: user._id });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

// 2. ZAMETKALARNI OLISH (Search, Filter, Category, Sort)
const getNotes = async (req, res) => {
    try {
      const user = await getUserByPhone(req);
      const { search, category, tag, state, sortBy } = req.query;
  
      let query = { userId: user._id };
  
      // Holatni ajratish
      if (state === 'trash') query.isTrashed = true;
      else if (state === 'archive') { query.isArchived = true; query.isTrashed = false; }
      else { query.isArchived = false; query.isTrashed = false; } 
  
      // Keyword qidiruv
      if (search) query.title = { $regex: search, $options: 'i' };
  
      // Kategoriyalar va Teglar (Filter by Tags)
      if (category) query.category = category;
      if (tag) query.tags = tag;
  
      // 🌟 YANGILIK: Mukammal saralash (Sorting & Recently Edited)
      let sortOptions = { isPinned: -1, updatedAt: -1 }; // Default: Qadalganlar va Eng yangi tahrirlanganlar
      
      if (sortBy === 'oldest') sortOptions = { isPinned: -1, createdAt: 1 };
      else if (sortBy === 'a-z') sortOptions = { isPinned: -1, title: 1 };
      else if (sortBy === 'z-a') sortOptions = { isPinned: -1, title: -1 };
  
      const notes = await Note.find(query).sort(sortOptions);
      res.json(notes);
    } catch (error) { res.status(400).json({ error: error.message }); }
  };

// 3. ZAMETKANI YANGILASH (Partial Update - PATCH)
// Bu yagona funksiya Pin, Archive, Trash, Complete va Matn o'zgartirishni bajara oladi
const updateNote = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      { $set: req.body }, // Faqat yuborilgan o'zgarishlarni qabul qiladi
      { new: true }
    );
    res.json(updatedNote);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

// 4. DUBLIKAT QILISH (Duplicate Note)
const duplicateNote = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    const original = await Note.findOne({ _id: req.params.id, userId: user._id });
    
    if (!original) return res.status(404).json({ message: "Topilmadi" });

    const copy = new Note({
      userId: user._id,
      title: original.title + " (Nusxa)",
      content: original.content,
      tags: original.tags,
      category: original.category
    });
    
    await copy.save();
    res.status(201).json(copy);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

// 5. BUTUNLAY O'CHIRISH (Faqat savatchadagilar uchun)
const deleteNote = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    await Note.findOneAndDelete({ _id: req.params.id, userId: user._id });
    res.json({ message: "Butunlay o'chirildi" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

module.exports = { createNote, getNotes, updateNote, duplicateNote, deleteNote };