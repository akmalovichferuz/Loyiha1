const User = require('../models/User');
const { bot, tempUsers } = require('../bot/bot');
const bcrypt = require('bcryptjs'); // Parolni shifrlash uchun

// Yordamchi funksiya: 5 xonali kod yaratish
const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

// 1. RO'YXATDAN O'TISH (KOD YUBORISH)
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const cleanPhone = '+' + phoneNumber.replace(/[^0-9]/g, '');

    const chatId = tempUsers[cleanPhone];
    let user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user && !chatId) {
      return res.status(400).json({ message: "Siz hali bot orqali ro'yxatdan o'tmagansiz!" });
    }

    if (user && user.password) {
      return res.status(400).json({ message: "Siz avval ro'yxatdan o'tgansiz. Iltimos, Tizimga kiring (Login)!" });
    }

    if (!user) {
      user = new User({
        phoneNumber: cleanPhone,
        telegramChatId: chatId
      });
    }

    const otp = generateOTP(); 

    user.firstName = firstName;
    user.lastName = lastName;
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.isVerified = false; // Yangi ro'yxatdan o'tayotganda hali tasdiqlanmagan
    await user.save();

    await bot.telegram.sendMessage(
      user.telegramChatId, 
      `🔐 *Tasdiqlash kodi:*\n\nSizning ro'yxatdan o'tish kodingiz: *${otp}*\n\n_Iltimos, kodni hech kimga bermang!_`, 
      { parse_mode: 'Markdown' }
    );

    res.status(200).json({ message: "Kod yuborildi!" });
  } catch (error) {
    console.error("Ro'yxatdan o'tishda xatolik:", error);
    res.status(500).json({ message: "Server xatosi." });
  }
};

// 2. KODNI TASDIQLASH (Ham Ro'yxatdan o'tish, ham Parol tiklash uchun)
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otpCode } = req.body;
    const cleanPhone = '+' + phoneNumber.replace(/[^0-9]/g, '');
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) return res.status(400).json({ message: "Foydalanuvchi topilmadi." });
    if (user.otpCode !== otpCode) return res.status(400).json({ message: "❌ Kod noto'g'ri yoki eskirgan!" });
    if (user.otpExpires && new Date() > user.otpExpires) return res.status(400).json({ message: "⏳ Kodning muddati tugagan!" });

    user.isVerified = true;
    user.otpCode = null; 
    await user.save();

    res.status(200).json({ success: true, message: "Muofaqiyatli Tasdiqlandi!" });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi." });
  }
};

// 3. PAROL O'RNATISH (Yangi foydalanuvchi yoki tiklash)
const setPassword = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const cleanPhone = '+' + phoneNumber.replace(/[^0-9]/g, '');
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
    if (!user.isVerified) return res.status(400).json({ message: "Avval kodni tasdiqlang!" });

    // Parolni shifrlash
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    await bot.telegram.sendMessage(
      user.telegramChatId,
      `🚀 *Xush kelibsiz!* 🎉\n\nSizning hisobingiz muvaffaqiyatli faollashtirildi. Endi siz nafaqat zametkalarni boshqarishingiz, balki eng zo'r tadbirlarga birinchilardan bo'lib chipta olishingiz mumkin!\n\n🤖 _Men sizning shaxsiy yordamchingizman. Muhim eslatmalar va chiptalarni shu yerda kutib oling._`,
      { parse_mode: 'Markdown' }
    );

    res.status(200).json({ success: true, message: "Parol muvaffaqiyatli saqlandi!" });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi." });
  }
};

// 4. LOGIN (Tizimga kirish)
const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const cleanPhone = '+' + phoneNumber.replace(/[^0-9]/g, '');
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !user.password) return res.status(400).json({ message: "Raqam yoki parol noto'g'ri!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Raqam yoki parol noto'g'ri!" });

    res.status(200).json({ success: true, message: "Tizimga kirdingiz!" });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi." });
  }
};

// 5. PAROLNI UNUTDIM (Faqat kod yuboradi)
const forgotPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const cleanPhone = '+' + phoneNumber.replace(/[^0-9]/g, '');
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !user.password) return res.status(400).json({ message: "Bu raqam ro'yxatdan o'tmagan!" });

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    user.isVerified = false; // MUHIM: Parolni tiklayotganda tasdiqni qayta so'rash uchun
    await user.save();

    await bot.telegram.sendMessage(user.telegramChatId, `🔄 Parolni tiklash kodingiz: *${otp}*`, { parse_mode: 'Markdown' });
    res.status(200).json({ success: true, message: "Tiklash kodi yuborildi!" });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi." });
  }
};

// 6. TELEGRAM WEB APP ORQALI AVTOMAT KIRISH
const telegramWebAppLogin = async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ message: "Telegram ID yo'q." });

    const user = await User.findOne({ telegramChatId: telegramId });
    if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi." });

    user.isVerified = true; 
    user.otpCode = null; 
    await user.save();

    if (!user.password) {
      return res.status(200).json({ status: 'needs_password', phoneNumber: user.phoneNumber });
    }

    return res.status(200).json({ status: 'success', phoneNumber: user.phoneNumber });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
};

// Barcha funksiyalarni eksport qilish
module.exports = { 
  registerUser, 
  verifyOTP, 
  setPassword, 
  loginUser, 
  forgotPassword, 
  telegramWebAppLogin 
};