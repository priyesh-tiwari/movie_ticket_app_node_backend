const express = require('express');
const router = express.Router();
const { createPaymentIntent, webhook } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/webhook', webhook);

module.exports = router;