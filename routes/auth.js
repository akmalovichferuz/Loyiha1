const express = require('express');
const router = express.Router();

// Barcha funksiyalarni kontrollerdan chaqirib olamiz (YANGILIK: telegramWebAppLogin qo'shildi)
const { 
    registerUser, 
    verifyOTP, 
    setPassword, 
    loginUser, 
    forgotPassword,
    telegramWebAppLogin 
} = require('../controllers/authController');

// Odatiy tizimga kirish va ro'yxatdan o'tish yo'nalishlari
router.post('/register', registerUser);
router.post('/verify', verifyOTP);
router.post('/set-password', setPassword);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// YANGILIK: Telegram Web App orqali avtomatik tizimga kirish yo'nalishi
router.post('/webapp-login', telegramWebAppLogin);

module.exports = router;