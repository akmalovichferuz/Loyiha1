const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    verifyOTP, 
    setPassword, 
    loginUser, 
    forgotPassword,
    telegramWebAppLogin 
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify', verifyOTP);
router.post('/set-password', setPassword);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/webapp-login', telegramWebAppLogin);

module.exports = router;