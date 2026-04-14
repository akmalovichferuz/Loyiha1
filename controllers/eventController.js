const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { bot } = require('../bot/bot');
const getUserByPhone = async (req) => {
  const phone = req.headers['user-phone'];
  if (!phone) throw new Error("Foydalanuvchi tasdiqlanmadi!");
  return await User.findOne({ phoneNumber: phone });
};

const createEvent = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    if (!user.isAdmin) return res.status(403).json({ message: "Sizda Admin huquqi yo'q!" });

    const event = new Event({ ...req.body, createdBy: user._id });
    await event.save();
    res.status(201).json({ message: "Tadbir yaratildi!", event });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

const getEvents = async (req, res) => {
  try {
    const { search, date } = req.query;
    let query = { isActive: true };

    if (search) query.title = { $regex: search, $options: 'i' };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const events = await Event.find(query).sort({ startTime: 1 });
    res.json(events);
  } catch (error) { res.status(400).json({ error: error.message }); }
};


const bookEvent = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    const eventId = req.params.id;
    const targetEvent = await Event.findById(eventId);

    if (!targetEvent) return res.status(404).json({ message: "Tadbir topilmadi!" });

    const existingBooking = await Booking.findOne({ userId: user._id, eventId: eventId, status: { $ne: 'cancelled' } });
    if (existingBooking) return res.status(400).json({ message: "Siz allaqachon bu tadbirga yozilgansiz!" });

    const userBookings = await Booking.find({ userId: user._id, status: 'active' }).populate('eventId');
    for (let booking of userBookings) {
      const bookedEvent = booking.eventId;
      if (targetEvent.startTime < bookedEvent.endTime && targetEvent.endTime > bookedEvent.startTime) {
        return res.status(400).json({ message: `Vaqt to'qnashuvi! Siz bu vaqtda "${bookedEvent.title}" tadbirida bo'lasiz.` });
      }
    }

    let bookingStatus = 'active';
    let responseMessage = "Joy muvaffaqiyatli band qilindi!\nBot orqali chiptangiz yuborildi!";

    if (targetEvent.bookedCount >= targetEvent.capacity) {
      bookingStatus = 'waitlist';
      responseMessage = "Joylar to'lgan!\nSiz Kutish ro'yxatiga (Waitlist) tushdingiz.\nJoy ochilsa xabar beramiz.";
    } else {
      targetEvent.bookedCount += 1;
      await targetEvent.save();
    }

    const newBooking = new Booking({ userId: user._id, eventId: targetEvent._id, status: bookingStatus });
    await newBooking.save();

    if (bookingStatus === 'active') {
        await bot.telegram.sendMessage(user.telegramChatId, `🎫 *VIP Chiptangiz tayyor!* 🌟\n\n*${targetEvent.title}* tadbirida o'z o'rningizni band qildingiz!\n📅 *Sana:* ${new Date(targetEvent.startTime).toLocaleString()}`, { parse_mode: 'Markdown' });
    }

    res.status(200).json({ message: responseMessage, status: bookingStatus });
  } catch (error) { res.status(400).json({ error: error.message }); }
};


const cancelBooking = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    const booking = await Booking.findOne({ userId: user._id, eventId: req.params.id, status: { $ne: 'cancelled' } });

    if (!booking) return res.status(400).json({ message: "Sizda bu tadbir uchun faol chipta yo'q." });
    const event = await Event.findById(booking.eventId);

    if (booking.status === 'active') {
      event.bookedCount -= 1;
      const nextInLine = await Booking.findOne({ eventId: event._id, status: 'waitlist' }).sort({ createdAt: 1 }).populate('userId');
      if (nextInLine) {
        nextInLine.status = 'active';
        await nextInLine.save();
        event.bookedCount += 1;
        await bot.telegram.sendMessage(nextInLine.userId.telegramChatId, `🎉 *Omad siz tomonda ekan!* \n\n*${event.title}* tadbiridan joy bo'shadi va u SIZGA taqdim etildi!\n📅 Vaqti: ${new Date(event.startTime).toLocaleString()}`, { parse_mode: 'Markdown' });
      }
      await event.save();
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: "Band qilish bekor qilindi." });
  } catch (error) { res.status(400).json({ error: error.message }); }
};


const updateBooking = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    const booking = await Booking.findOne({ userId: user._id, eventId: req.params.id, status: 'active' });
    if (!booking) return res.status(404).json({ message: "Faol chipta yo'q!" });
    booking.guestName = req.body.guestName;
    booking.guestEmail = req.body.guestEmail;
    await booking.save();
    res.json({ message: "Chipta ma'lumotlari muvaffaqiyatli yangilandi!" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};


const getAttendees = async (req, res) => {
  try {
    const user = await getUserByPhone(req);
    if (!user.isAdmin) return res.status(403).json({ message: "Ruxsat yo'q!" });
    const attendees = await Booking.find({ eventId: req.params.id, status: 'active' }).populate('userId');
    res.json(attendees);
  } catch (error) { res.status(400).json({ error: error.message }); }
};


const removeAttendee = async (req, res) => {
    try {
      const adminUser = await getUserByPhone(req);
      if (!adminUser.isAdmin) return res.status(403).json({ message: "Ruxsat yo'q!" });
  
      const bookingId = req.params.bookingId;
      const booking = await Booking.findById(bookingId).populate('userId');
      if (!booking || booking.status !== 'active') return res.status(400).json({ message: "Faol chipta topilmadi." });
  
      const event = await Event.findById(booking.eventId);
      event.bookedCount -= 1;
      
      const nextInLine = await Booking.findOne({ eventId: event._id, status: 'waitlist' }).sort({ createdAt: 1 }).populate('userId');
      if (nextInLine) {
        nextInLine.status = 'active';
        await nextInLine.save();
        event.bookedCount += 1;
        await bot.telegram.sendMessage(nextInLine.userId.telegramChatId, `🎉 *Omad siz tomonda!* \n\n*${event.title}* tadbiridan joy bo'shadi!\n📅 Vaqti: ${new Date(event.startTime).toLocaleString()}`, { parse_mode: 'Markdown' });
      }
      await event.save();
      booking.status = 'cancelled';
      await booking.save();
  
      await bot.telegram.sendMessage(booking.userId.telegramChatId, `ℹ️ *Ma'lumot*\n\nSizning *${event.title}* tadbiridagi chiptangiz administrator tomonidan bekor qilindi.`, { parse_mode: 'Markdown' });
      res.json({ message: "Qatnashchi ro'yxatdan muvaffaqiyatli o'chirildi!" });
    } catch (error) { res.status(400).json({ error: error.message }); }
};


const deleteEvent = async (req, res) => {
  try {
    const adminUser = await getUserByPhone(req);
    if (!adminUser.isAdmin) return res.status(403).json({ message: "Sizda ruxsat yo'q!" });

    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Tadbir topilmadi." });

    await Event.findByIdAndDelete(eventId);
    await Booking.deleteMany({ eventId: eventId });

    res.json({ message: "Tadbir va chiptalar butunlay o'chirildi!" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};
  

module.exports = { createEvent, getEvents, bookEvent, cancelBooking, updateBooking, getAttendees, removeAttendee, deleteEvent };