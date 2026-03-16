const Receipt = require('../models/receiptModel');

const getUserReceipts = async (req, res) => {
    try {
        const userId = req.user.userId;

        const receipts = await Receipt.find({ userId })
            .populate('theaterId', 'name location')
            .populate('showtimeId', 'time startTime')
            .sort({ createdAt: -1 });

        res.status(200).json({ receipts });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getUserReceipts };