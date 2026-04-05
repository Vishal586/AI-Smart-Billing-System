const mongoose = require('mongoose');

// Sub-schema for bill items
const billItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    // For return tracking
    returnedQuantity: {
        type: Number,
        default: 0,
    },
});

const billSchema = new mongoose.Schema(
    {
        billNumber: {
            type: String,
            unique: true,
        },
        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
        },
        // Store customer info directly in case customer is deleted
        customerSnapshot: {
            name: String,
            phone: String,
            address: String,
        },
        items: [billItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed', 'none'],
            default: 'none',
        },
        discountValue: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        gstEnabled: {
            type: Boolean,
            default: false,
        },
        gstRate: {
            type: Number,
            default: 0,
        },
        gstAmount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'pending', 'partial', 'refunded'],
            default: 'paid',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'upi', 'other'],
            default: 'cash',
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['draft', 'final', 'cancelled'],
            default: 'draft',
        },
        notes: String,
        returnHistory: [
            {
                date: { type: Date, default: Date.now },
                items: [
                    {
                        itemName: String,
                        quantity: Number,
                        refundAmount: Number,
                    },
                ],
                totalRefund: Number,
                reason: String,
            },
        ],
    },
    { timestamps: true }
);

// Auto-generate bill number before saving
billSchema.pre('save', async function (next) {
    if (!this.billNumber) {
        const count = await this.constructor.countDocuments({
            shopkeeper: this.shopkeeper,
        });
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        this.billNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Index for fast queries
billSchema.index({ shopkeeper: 1, createdAt: -1 });
billSchema.index({ customer: 1, createdAt: -1 });
billSchema.index({ billNumber: 1 });

module.exports = mongoose.model('Bill', billSchema);