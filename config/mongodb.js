const mongoose = require('mongoose');
require('dotenv').config();

const connectDB =async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDb connected successfully');
    }
    catch(err){
        console.log('MongoDb connection failed: ' , err);
    }
}

module.exports= connectDB;