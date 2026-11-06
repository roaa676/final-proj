const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Create new booking (authenticated users only)
router.post('/', auth, async (req, res) => {
    try {
        const { date, time, numberOfGuests, tableNumber, specialRequests, contactPhone, contactName } = req.body;

        // Check if table is available for the requested time
        const existingBooking = await Booking.findOne({
            date: new Date(date),
            time,
            tableNumber,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Table is not available for this time' });
        }

        const booking = new Booking({
            user: req.user._id,
            date: new Date(date),
            time,
            numberOfGuests,
            tableNumber,
            specialRequests,
            contactPhone,
            contactName
        });

        await booking.save();

        res.status(201).json({
            message: 'Booking created successfully',
            booking
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort({ date: -1, createdAt: -1 });
        
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if user owns the booking or is admin
        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Cancel booking (user can only cancel their own bookings)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin: Get all bookings
router.get('/admin/all', adminAuth, async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (date) {
            query.date = {
                $gte: new Date(date),
                $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            };
        }

        const bookings = await Booking.find(query)
            .populate('user', 'name email phone')
            .sort({ date: -1, createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin: Update booking status
router.put('/admin/:id/status', adminAuth, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        const booking = await Booking.findById(req.params.id).populate('user', 'name email');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        if (adminNotes) {
            booking.adminNotes = adminNotes;
        }

        await booking.save();

        // Send email notification to user
        if (booking.user.email && !booking.notificationSent) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: booking.user.email,
                subject: `Booking ${status} - Restaurant`,
                html: `
                    <h2>Booking Update</h2>
                    <p>Dear ${booking.user.name},</p>
                    <p>Your booking for ${booking.date.toLocaleDateString()} at ${booking.time} has been <strong>${status}</strong>.</p>
                    <p>Table: ${booking.tableNumber}</p>
                    <p>Number of guests: ${booking.numberOfGuests}</p>
                    ${adminNotes ? `<p>Admin notes: ${adminNotes}</p>` : ''}
                    <p>Thank you for choosing our restaurant!</p>
                `
            };

            try {
                await transporter.sendMail(mailOptions);
                booking.notificationSent = true;
                await booking.save();
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        res.json({
            message: `Booking ${status} successfully`,
            booking
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get available tables for a specific date and time
router.get('/available-tables', async (req, res) => {
    try {
        const { date, time } = req.query;
        
        if (!date || !time) {
            return res.status(400).json({ message: 'Date and time are required' });
        }

        const bookedTables = await Booking.find({
            date: new Date(date),
            time,
            status: { $in: ['pending', 'confirmed'] }
        }).select('tableNumber');

        const bookedTableNumbers = bookedTables.map(booking => booking.tableNumber);
        
        // Assuming we have tables 1-20
        const allTables = Array.from({ length: 20 }, (_, i) => i + 1);
        const availableTables = allTables.filter(table => !bookedTableNumbers.includes(table));

        res.json({ availableTables });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 