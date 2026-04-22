# 🎬 CineMax — Backend

The Node.js + Express backend for **CineMax**, a full-featured movie ticket booking app. Handles authentication, movie showtimes, theater management, seat locking, and Stripe webhook-based payment confirmation.

> 🔗 Frontend Repository: [movie_ticket_app_node_flutter](https://github.com/priyesh-tiwari/movie_ticket_app_node_flutter)

---

## ✨ Features

- 🔐 JWT-based authentication with OTP signup and forgot password via Nodemailer
- 🎥 Showtime management per theater and screen
- 🏟️ Theater and screen management (admin only)
- 💺 Seat locking system with 10-minute on-demand expiry
- 💳 Stripe webhook-based payment confirmation with MongoDB transactions
- 🎟️ Booking receipt generation and storage
- 👤 Role-based access control (User / Theater Admin)

---

## 🧱 Tech Stack

| Purpose | Technology |
|---|---|
| Runtime | Node.js >= 20.19.0 |
| Framework | Express.js 5 |
| Database | MongoDB + Mongoose 9 |
| Authentication | JWT + Nodemailer OTP |
| Password Hashing | bcrypt + bcryptjs |
| Payments | Stripe Webhooks |
| Deployment | Render |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.19.0
- MongoDB Atlas account (or local MongoDB)
- Stripe account
- Gmail account for Nodemailer (with App Password enabled)
- OMDB API key — [omdbapi.com](https://www.omdbapi.com/)
- TMDB API key — [themoviedb.org](https://www.themoviedb.org/)

### Installation

```bash
git clone https://github.com/priyesh-tiwari/movie_ticket_app_node_backend.git
cd movie_ticket_app_node_backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Nodemailer
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Movie APIs
OMDB_API_KEY=your_omdb_api_key
TMDB_API_KEY=your_tmdb_api_key
```

### Run the Server

```bash
npm start
```

Server runs on `http://localhost:5000` by default.

---



## 💺 Seat Locking System

Seat locking is handled **on-demand** — no background job or cron required.

**When a user reserves seats:**
1. Expired locks (`lockedAt` older than 10 minutes) are removed atomically before checking availability
2. Requested seats are checked against both `selectedSeats` (permanently booked) and `lockedSeats` (temporarily locked)
3. If available, seats are locked with `lockedBy` (userId) and `lockedAt` (timestamp)
4. If any seat is unavailable, the entire request is rejected

**When fetching showtimes:**
- Expired locks are filtered out in the response so clients always see accurate seat availability without needing a cleanup job

**When a user cancels or leaves:**
- Seats can be explicitly released via the release endpoint

This approach avoids race conditions through atomic MongoDB `findOneAndUpdate` operations.

---

## 💳 Stripe Webhook Payment Flow

1. Client requests a **Payment Intent** from the backend
2. Flutter app completes payment using the Stripe SDK
3. Stripe sends a `payment_intent.succeeded` event to `/api/payment/webhook`
4. Backend verifies the event signature:
   ```js
   stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)
   ```
5. A **MongoDB transaction** (session) is used to:
   - Check for duplicate receipts (idempotency guard)
   - Atomically mark seats as booked and remove their locks
   - If seats were already booked by someone else, a **Stripe refund** is initiated automatically
   - Save the booking receipt
6. On `payment_intent.payment_failed`, locked seats are automatically released

> ⚠️ Payment state is always confirmed **server-side via webhook**, never from the client response alone.

---

## 🔐 Auth & Roles

- All protected routes use JWT middleware to verify the token
- Admin routes additionally check for the `theater_admin` role in the JWT payload
- Users are assigned the `user` role by default on signup
- Only the **app creator** can promote a user to `theater_admin`

---

## 🌐 Deployment (Render)

1. Push backend to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `npm start`
5. Add all `.env` variables in Render's **Environment** tab
6. Add the Stripe webhook endpoint in your Stripe dashboard:
   ```
   https://your-render-url.onrender.com/api/payment/webhook
   ```

> ⚠️ **Cold Start:** Free tier Render instances spin down after inactivity. Expect a 30–50 second delay on the first request after idle periods.

---
