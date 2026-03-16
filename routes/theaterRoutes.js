const express = require('express');
const router = express.Router();
const { createTheater, getTheaters, getMyTheaters } = require('../controllers/theaterController');

const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.post('/create', protect, isAdmin, createTheater);
router.get('/list', protect, getTheaters);
router.get('/my-theaters' , protect , isAdmin , getMyTheaters);

module.exports = router;