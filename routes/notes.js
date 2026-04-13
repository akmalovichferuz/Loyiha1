const express = require('express');
const router = express.Router();
const { createNote, getNotes, updateNote, duplicateNote, deleteNote } = require('../controllers/noteController');

router.post('/', createNote);             // Yaratish
router.get('/', getNotes);                // O'qish (filtrlari bilan)
router.patch('/:id', updateNote);         // Qisman yangilash (Pin, Archive, Trash)
router.post('/:id/duplicate', duplicateNote); // Dublikat
router.delete('/:id', deleteNote);        // Butunlay o'chirish

module.exports = router;