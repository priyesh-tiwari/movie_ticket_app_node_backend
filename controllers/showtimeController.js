const Showtime = require('../models/showtimeModel');
const Theater = require('../models/theaterModel');

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const addShowtime = async (req, res) => {
    try {
        const { movieId, movieTitle, moviePoster, theaterId, screenId, time, startTime } = req.body;

        const showtime = new Showtime({
            movieId,
            movieTitle,
            moviePoster,
            theaterId,
            screenId,
            time,
            startTime
        });

        await showtime.save();

        res.status(201).json({
            message: 'Showtime added successfully',
            showtime
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const editShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const { time } = req.body;

        const showtime = await Showtime.findByIdAndUpdate(
            showtimeId,
            { time },
            { new: true }
        );

        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        res.status(200).json({
            message: 'Showtime updated successfully',
            showtime
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        const showtime = await Showtime.findByIdAndDelete(showtimeId);

        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        res.status(200).json({ message: 'Showtime deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShowtimesForMovie = async (req, res) => {
    try {
        const { movieId } = req.params;

        // us movie ki saari showtimes fetch karo
        const showtimes = await Showtime.find({ movieId });

        if (!showtimes.length) {
            return res.status(200).json({ theaters: [] });
        }

        // theater ke hisaab se group karo
        const theaterMap = {};

        for (const showtime of showtimes) {
            const theaterId = showtime.theaterId.toString();

            if (!theaterMap[theaterId]) {
                // theater details fetch karo
                const theater = await Theater.findById(theaterId);
                if (!theater) continue;

                theaterMap[theaterId] = {
                    _id: theater._id,
                    name: theater.name,
                    location: theater.location,
                    showtimes: [],
                };
            }

            theaterMap[theaterId].showtimes.push({
                _id: showtime._id,
                screenId: showtime.screenId,
                time: showtime.time,
                date: showtime.date,
                selectedSeats: showtime.selectedSeats,
                lockedSeats: showtime.lockedSeats
                    .filter(l => new Date() - new Date(l.lockedAt) < 10 * 60 * 1000)
                    .map(l => l.seat),
            });
        }

        const theaters = Object.values(theaterMap);

        res.status(200).json({ theaters });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const reserveSeats = async (req, res) => {
    try {
        const { showtimeId, seats } = req.body;
        const userId = req.user.userId;
        const tenMinutesAgo = new Date(Date.now() - LOCK_DURATION_MS);

        // Step 1 — Expired locks remove karo
        await Showtime.findByIdAndUpdate(
            showtimeId,
            { $pull: { lockedSeats: { lockedAt: { $lte: tenMinutesAgo } } } }
        );

        // Step 2 — Check + lock karo atomically
        const showtime = await Showtime.findOneAndUpdate(
            {
                _id: showtimeId,
                selectedSeats: { $not: { $elemMatch: { $in: seats } } },
                'lockedSeats.seat': { $not: { $in: seats } }
            },
            {
                $push: {
                    lockedSeats: {
                        $each: seats.map(seat => ({
                            seat,
                            lockedBy: userId,
                            lockedAt: new Date()
                        }))
                    }
                }
            },
            { new: true }
        );

        if (!showtime) {
            return res.status(400).json({ message: 'Seats not available' });
        }

        res.status(200).json({ message: 'Seats reserved successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const releaseSeats = async (req, res) => {
    try {
        const { showtimeId, seats } = req.body;
        const userId = req.user.userId;

        await Showtime.findByIdAndUpdate(
            showtimeId,
            {
                $pull: {
                    lockedSeats: {
                        seat: { $in: seats },
                        lockedBy: userId
                    }
                }
            }
        );

        res.status(200).json({ message: 'Seats released successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShowtimesByTheater = async (req, res) => {
    try {
        const { theaterId } = req.params;
        const showtimes = await Showtime.find({ theaterId });
        res.status(200).json({ showtimes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShowtimeById = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        const lockedSeats = showtime.lockedSeats
            .filter(l => new Date() - new Date(l.lockedAt) < 10 * 60 * 1000)
            .map(l => l.seat);

        res.status(200).json({
            showtime: {
                ...showtime._doc,
                lockedSeats,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



module.exports = { addShowtime, editShowtime, deleteShowtime, getShowtimesForMovie, reserveSeats, releaseSeats, getShowtimesByTheater, getShowtimeById };