const express = require('express');
const router = express.Router();
const {
    sendOTP,
    verifyOTP,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    makeAdmin,
    getProfile,
} = require('../controllers/authController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/make-admin', protect, isAdmin, makeAdmin);
router.post('/profile' , protect , getProfile);

module.exports = router;