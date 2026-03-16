const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        default: null,
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpiry: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        enum: ['signup', 'forgot-password'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    },
});

module.exports = mongoose.model('OTP', otpSchema);