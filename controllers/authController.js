const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail } = require('../utils/otpHelper');

const generateAccessToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Send OTP — signup ke liye
const sendOTP = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Email already registered?
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // OTP generate karo
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Password hash karo
        const hashedPassword = await bcrypt.hash(password, 10);

        // OTP collection mein save karo
        await OTP.findOneAndUpdate(
            { email },
            { email, name, password: hashedPassword, otp, otpExpiry, type: 'signup' },
            { upsert: true, new: true }
        );

        // Email bhejo
        await sendOTPEmail(email, otp);

        res.status(200).json({ message: 'OTP sent successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Verify OTP — verify karo + user banao
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // OTP collection mein dhundho
        const otpRecord = await OTP.findOne({ email, type: 'signup' });
        if (!otpRecord) {
            return res.status(404).json({ message: 'OTP not found or expired' });
        }

        // OTP expire hua?
        if (otpRecord.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // OTP sahi hai?
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // User banao
        await User.create({
            name: otpRecord.name,
            email: otpRecord.email,
            password: otpRecord.password,
            isVerified: true,
        });

        // OTP record delete karo
        await OTP.deleteOne({ email });

        res.status(201).json({ message: 'Account created successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            accessToken,
            refreshToken,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Refresh Token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = generateAccessToken(user._id);

        res.status(200).json({ accessToken: newAccessToken });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        await User.findOneAndUpdate(
            { refreshToken },
            { refreshToken: null }
        );

        res.status(200).json({ message: 'Logged out successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // OTP collection mein save karo
        await OTP.findOneAndUpdate(
            { email },
            { email, otp, otpExpiry, type: 'forgot-password', name: null, password: null },
            { upsert: true, new: true }
        );

        await sendOTPEmail(email, otp);

        res.status(200).json({ message: 'OTP sent successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const otpRecord = await OTP.findOne({ email, type: 'forgot-password' });
        if (!otpRecord) {
            return res.status(404).json({ message: 'OTP not found or expired' });
        }

        if (otpRecord.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate(
            { email },
            { password: hashedPassword }
        );

        await OTP.deleteOne({ email });

        res.status(200).json({ message: 'Password reset successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Make Admin
const makeAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'admin' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User is now admin',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { sendOTP, verifyOTP, login, refreshToken, logout, forgotPassword, resetPassword, makeAdmin };