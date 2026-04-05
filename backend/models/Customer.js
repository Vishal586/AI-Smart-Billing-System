const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        address: {
            type: String,
            trim: true,
        },
        totalPurchases: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        lastVisit: {
            type: Date,
        },
        notes: {
            type: String,
        },
    },
    { timestamps: true }
);

// Index for fast search
customerSchema.index({ shopkeeper: 1, name: 'text', phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);