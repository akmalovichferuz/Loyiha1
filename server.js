require('dotenv').config();
require('./services/cron'); // Taymerni ishga tushirish

const express = require('express');
const noteRoutes = require('./routes/notes');
const mongoose = require('mongoose');
const cors = require('cors');

// Diqqat: Bu yerda '../' emas, './' bo'lishi kerak, chunki server.js bosh papkada turibdi
const {bot} = require('./bot/bot'); 
const authRoutes = require('./routes/auth'); 
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Saytni (Frontend) server orqali ishga tushirish
app.use(express.static('public'));

// API yo'nalishlarini ulash
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/events', eventRoutes);

// MongoDB ulanishi
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ma\'lumotlar bazasiga muvaffaqiyatli ulandi!'))
  .catch((err) => console.error('❌ MongoDB ga ulanishda xatolik:', err));

// Botni ishga tushirish
bot.launch()
  .then(() => console.log('🤖 Telegram Bot kutish rejimida...'))
  .catch((err) => console.error('Bot xatosi:', err));

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));