const mongoose = require('mongoose');

const lockedSeatSchema = new mongoose.Schema({
    seat: {
        type: String,
        required: true
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lockedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const showtimeSchema = new mongoose.Schema({
    movieId: {
        type: String,
        required: true
    },
    movieTitle: {
        type: String,
        required: true
    },
    moviePoster: {
        type: String,
        required: true
    },
    theaterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater',
        required: true
    },
    screenId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    selectedSeats: {
        type: [String],
        default: []
    },
    lockedSeats: {
        type: [lockedSeatSchema],
        default: []
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Showtime', showtimeSchema);