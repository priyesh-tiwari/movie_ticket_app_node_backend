const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token, access denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();

    } catch (err) {
        res.status(401).json({ message: 'Token expired or invalid' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { protect, isAdmin };