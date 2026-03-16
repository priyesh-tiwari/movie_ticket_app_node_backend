const mongoose = require('mongoose');
const { ref } = require('process');
const { createDeflate } = require('zlib');

const screenSchema = new mongoose.Schema({
    screenNumber: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        default: 100
    }
});

const theaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    screens: [screenSchema],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports=mongoose.model('Theater' , theaterSchema);