const express=require('express');
const connectDB=require('./config/mongodb.js');

const app=express();

connectDB();

app.use('/api/payment/webhook' , express.raw({type: 'application/json'}));
app.use(express.json());


app.use('/api/auth' , require('./routes/authRoutes.js'));
app.use('/api/theater' , require('./routes/theaterRoutes'));
app.use('/api/showtime', require('./routes/showtimeRoutes'));
app.use('/api/payment' , require('./routes/paymentRoutes'));
app.use('/api/receipt', require('./routes/receiptRoutes'));

const port=3000;
app.listen(port , ()=> console.log('Server running on port 3000'));

