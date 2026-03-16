const Theater = require('../models/theaterModel');

const createTheater = async (req, res) => {
    try {
        const { name, location } = req.body;
        const adminId = req.user.userId;

        const theater = new Theater({
            name,
            location,
            adminId,
            screens: [
                { screenNumber: 1, capacity: 100 },
                { screenNumber: 2, capacity: 100 },
                { screenNumber: 3, capacity: 100 }
            ]
        });

        await theater.save();

        res.status(201).json({
            message: 'Theater created successfully',
            theater
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyTheaters = async (req, res) => {
    try{
        const adminId=req.user.userId;
        const theaters=await Theater.find({adminId});
        res.status(200).json({theaters});
    } catch(err){
        res.status(500).json({message: err.message});
    }
};

const getTheaters = async (req , res) => {
    try{
        const theaters = await Theater.find();
        res.status(200).json({theaters});
    }catch(err){
        res.status(500).json({message:err.message});
    }
};

module.exports = { createTheater, getTheaters };