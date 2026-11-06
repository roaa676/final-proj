const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const MenuItem = require('../models/MenuItem');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { search, role, isActive } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user status (admin only)
router.put('/users/:id/status', adminAuth, async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Change user role (admin only)
router.put('/users/:id/role', adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get dashboard statistics (admin only)
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const totalMenuItems = await MenuItem.countDocuments();
        const availableMenuItems = await MenuItem.countDocuments({ isAvailable: true });

        // Get recent bookings
        const recentBookings = await Booking.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get booking statistics by status
        const bookingStats = await Booking.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            stats: {
                totalUsers,
                totalAdmins,
                totalBookings,
                pendingBookings,
                totalMenuItems,
                availableMenuItems
            },
            recentBookings,
            bookingStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get booking statistics (admin only)
router.get('/bookings/stats', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const totalBookings = await Booking.countDocuments(dateFilter);
        const confirmedBookings = await Booking.countDocuments({ ...dateFilter, status: 'confirmed' });
        const rejectedBookings = await Booking.countDocuments({ ...dateFilter, status: 'rejected' });
        const cancelledBookings = await Booking.countDocuments({ ...dateFilter, status: 'cancelled' });

        // Get bookings by date
        const bookingsByDate = await Booking.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalBookings,
            confirmedBookings,
            rejectedBookings,
            cancelledBookings,
            bookingsByDate
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete user (admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has any bookings
        const userBookings = await Booking.countDocuments({ user: req.params.id });
        if (userBookings > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete user with existing bookings. Deactivate instead.' 
            });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 