const express = require('express');
const router = express.Router();

const { 
    createEvent, 
    getEvents, 
    bookEvent, 
    cancelBooking, 
    updateBooking, 
    getAttendees, 
    removeAttendee,
    deleteEvent
} = require('../controllers/eventController');

router.post('/', createEvent);
router.get('/', getEvents);
router.post('/:id/book', bookEvent);
router.post('/:id/cancel', cancelBooking);
router.patch('/:id/booking', updateBooking);
router.get('/:id/attendees', getAttendees);
router.delete('/booking/:bookingId', removeAttendee); 
router.delete('/:id', deleteEvent);                   

module.exports = router;