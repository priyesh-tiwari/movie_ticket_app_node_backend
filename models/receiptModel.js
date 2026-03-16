const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movieId: {
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
    showtimeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true
    },
    selectedSeats: {
        type: [String],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'Paid'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Receipt', receiptSchema);