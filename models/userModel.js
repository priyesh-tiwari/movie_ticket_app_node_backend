const mongoose = require('mongoose');
const { truncate } = require('node:fs');
const { type } = require('node:os');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    refreshToken: {
        type: String,
        default: null
    },

    role: {
        type: String,
        enum: ['user' , 'admin'],
        default: 'user'
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    

    createdAt: {
        type: Date,
        default: Date.now

    }
});

module.exports = mongoose.model('User' , userSchema);