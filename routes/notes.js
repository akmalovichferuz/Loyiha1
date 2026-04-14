const express = require('express');
const router = express.Router();
const { createNote, getNotes, updateNote, duplicateNote, deleteNote } = require('../controllers/noteController');

router.post('/', createNote);             
router.get('/', getNotes);                
router.patch('/:id', updateNote);         
router.post('/:id/duplicate', duplicateNote); 
router.delete('/:id', deleteNote);       
module.exports = router;