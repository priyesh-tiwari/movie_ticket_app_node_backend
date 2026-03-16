const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const Showtime = require('../models/showtimeModel');
const Receipt = require('../models/receiptModel');

const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency, userId, movieId, theaterId, screenId, showtimeId, selectedSeats } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency || 'usd',
            metadata: {
                userId,
                movieId,
                theaterId,
                screenId,
                showtimeId,
                selectedSeats: selectedSeats.join(',')
            }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { userId, movieId, theaterId, screenId, showtimeId, selectedSeats } = paymentIntent.metadata;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const seats = selectedSeats.split(',');
            const totalAmount = seats.length * 10;

            // 1. Duplicate receipt check
            const existingReceipt = await Receipt.findOne({
                showtimeId,
                userId,
                selectedSeats: { $all: seats }
            }).session(session);

            if (existingReceipt) {
                await session.abortTransaction();
                return res.status(200).json({ received: true });
            }

            // 2. Atomic check + update
            const showtime = await Showtime.findOneAndUpdate(
                {
                    _id: showtimeId,
                    selectedSeats: { $not: { $elemMatch: { $in: seats } } }
                },
                {
                    $push: { selectedSeats: { $each: seats } },
                    $pull: { lockedSeats: { seat: { $in: seats } } }
                },
                { new: true, session }
            );

            if (!showtime) {
                await stripe.refunds.create({
                    payment_intent: paymentIntent.id
                });
                await session.abortTransaction();
                return res.status(400).json({ message: 'Seats already booked, refund initiated' });
            }

            // 3. Save receipt
            const receipt = new Receipt({
                userId,
                movieId,
                theaterId,
                screenId,
                showtimeId,
                selectedSeats: seats,
                totalAmount,
                paymentStatus: 'Paid'
            });
            await receipt.save({ session });

            // 4. Commit transaction
            await session.commitTransaction();

        } catch (err) {
            await session.abortTransaction();
            return res.status(500).json({ message: err.message });
        } finally {
            session.endSession();
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const { showtimeId, selectedSeats } = paymentIntent.metadata;

        try {
            const seats = selectedSeats.split(',');
            await Showtime.findByIdAndUpdate(
                showtimeId,
                { $pull: { lockedSeats: { seat: { $in: seats } } } }
            );
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    res.status(200).json({ received: true });
};

module.exports = { createPaymentIntent, webhook };