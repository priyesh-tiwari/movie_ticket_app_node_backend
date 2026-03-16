const express = require('express');
const router = express.Router();
const { getUserReceipts } = require('../controllers/receiptController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/my-receipts', protect, getUserReceipts);

module.exports = router;