const express = require('express');
const router = express.Router();
const { addShowtime, editShowtime, deleteShowtime, getShowtimesForMovie, reserveSeats, releaseSeats, getShowtimesByTheater, getShowtimeById } = require('../controllers/showtimeController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.post('/add', protect, isAdmin, addShowtime);
router.put('/edit/:showtimeId', protect, isAdmin, editShowtime);
router.delete('/delete/:showtimeId', protect, isAdmin, deleteShowtime);
router.get('/movie/:movieId', protect, getShowtimesForMovie);
router.post('/reserve-seats', protect, reserveSeats);
router.post('/release-seats', protect, releaseSeats);
router.get('/theater/:theaterId', protect, isAdmin, getShowtimesByTheater);
router.get('/:showtimeId', getShowtimeById);

module.exports = router;