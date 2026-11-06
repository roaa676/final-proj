const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    tableNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        default: ''
    },
    contactPhone: {
        type: String,
        required: true
    },
    contactName: {
        type: String,
        required: true
    },
    adminNotes: {
        type: String,
        default: ''
    },
    notificationSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
bookingSchema.index({ date: 1, time: 1, tableNumber: 1 });
bookingSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Booking', bookingSchema); 