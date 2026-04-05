const Bill = require('../models/Bill');
const Customer = require('../models/Customer');

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate, customerId } = req.query;

        let query = { shopkeeper: req.user.id };

        if (status) query.status = status;
        if (customerId) query.customer = customerId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const total = await Bill.countDocuments(query);
        const bills = await Bill.find(query)
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            bills,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
const getBill = async (req, res, next) => {
    try {
        const bill = await Bill.findOne({
            _id: req.params.id,
            shopkeeper: req.user.id,
        }).populate('customer');

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        res.json({ success: true, bill });
    } catch (error) {
        next(error);
    }
};

// @desc    Create bill
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res, next) => {
    try {
        const {
            customerId,
            customerName,
            customerPhone,
            customerAddress,
            items,
            discountType,
            discountValue,
            gstEnabled,
            gstRate,
            paymentMethod,
            paymentStatus,
            paidAmount,
            notes,
            status,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        // Calculate totals
        const processedItems = items.map((item) => ({
            ...item,
            subtotal: item.price * item.quantity,
        }));

        const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Discount calculation
        let discountAmount = 0;
        if (discountType === 'percentage' && discountValue > 0) {
            discountAmount = (subtotal * discountValue) / 100;
        } else if (discountType === 'fixed' && discountValue > 0) {
            discountAmount = Math.min(discountValue, subtotal);
        }

        // GST calculation
        const taxableAmount = subtotal - discountAmount;
        const gstAmount = gstEnabled ? (taxableAmount * (gstRate || 18)) / 100 : 0;
        const totalAmount = taxableAmount + gstAmount;

        // Customer snapshot
        let customer = null;
        if (customerId) {
            customer = await Customer.findById(customerId);
        }

        const customerSnapshot = {
            name: customerName || customer?.name || 'Walk-in Customer',
            phone: customerPhone || customer?.phone || '',
            address: customerAddress || customer?.address || '',
        };

        const bill = await Bill.create({
            shopkeeper: req.user.id,
            customer: customerId || null,
            customerSnapshot,
            items: processedItems,
            subtotal,
            discountType: discountType || 'none',
            discountValue: discountValue || 0,
            discountAmount,
            gstEnabled: gstEnabled || false,
            gstRate: gstRate || 0,
            gstAmount,
            totalAmount,
            paymentMethod: paymentMethod || 'cash',
            paymentStatus: paymentStatus || 'paid',
            paidAmount: paidAmount || totalAmount,
            notes,
            status: status || 'final',
        });

        // Update customer stats if linked
        if (customerId && status !== 'draft') {
            await Customer.findByIdAndUpdate(customerId, {
                $inc: { totalPurchases: 1, totalSpent: totalAmount },
                lastVisit: new Date(),
            });
        }

        res.status(201).json({ success: true, bill });
    } catch (error) {
        next(error);
    }
};

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private
const updateBill = async (req, res, next) => {
    try {
        const bill = await Bill.findOneAndUpdate(
            { _id: req.params.id, shopkeeper: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        res.json({ success: true, bill });
    } catch (error) {
        next(error);
    }
};

// @desc    Process return/refund
// @route   POST /api/bills/:id/return
// @access  Private
const processReturn = async (req, res, next) => {
    try {
        const { returnItems, reason } = req.body;

        const bill = await Bill.findOne({
            _id: req.params.id,
            shopkeeper: req.user.id,
        });

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        let totalRefund = 0;
        const processedReturnItems = [];

        for (const returnItem of returnItems) {
            const billItem = bill.items.find(
                (item) => item._id.toString() === returnItem.itemId
            );

            if (!billItem) {
                return res.status(400).json({ success: false, message: `Item not found in bill` });
            }

            const availableQty = billItem.quantity - (billItem.returnedQuantity || 0);
            if (returnItem.quantity > availableQty) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot return more than ${availableQty} units of ${billItem.itemName}`,
                });
            }

            const refundAmount = billItem.price * returnItem.quantity;
            totalRefund += refundAmount;

            // Update returned quantity
            billItem.returnedQuantity = (billItem.returnedQuantity || 0) + returnItem.quantity;

            processedReturnItems.push({
                itemName: billItem.itemName,
                quantity: returnItem.quantity,
                refundAmount,
            });
        }

        // Add return to history
        bill.returnHistory.push({
            items: processedReturnItems,
            totalRefund,
            reason,
        });

        // Check if fully refunded
        const totalReturnedValue = bill.returnHistory.reduce((sum, r) => sum + r.totalRefund, 0);
        if (totalReturnedValue >= bill.totalAmount) {
            bill.paymentStatus = 'refunded';
        }

        await bill.save();

        // Update customer stats
        if (bill.customer) {
            await Customer.findByIdAndUpdate(bill.customer, {
                $inc: { totalSpent: -totalRefund },
            });
        }

        res.json({ success: true, bill, totalRefund });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dashboard stats
// @route   GET /api/bills/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
    try {
        const shopkeeperId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Today's stats
        const todayBills = await Bill.find({
            shopkeeper: shopkeeperId,
            status: 'final',
            createdAt: { $gte: today, $lte: todayEnd },
        });

        const dailySales = todayBills.reduce((sum, b) => sum + b.totalAmount, 0);
        const dailyOrders = todayBills.length;

        // Total stats
        const allBills = await Bill.find({ shopkeeper: shopkeeperId, status: 'final' });
        const totalRevenue = allBills.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalOrders = allBills.length;

        // Total customers
        const totalCustomers = await Customer.countDocuments({ shopkeeper: shopkeeperId });

        // Last 7 days revenue
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateEnd = new Date(date);
            dateEnd.setHours(23, 59, 59, 999);

            const dayBills = await Bill.find({
                shopkeeper: shopkeeperId,
                status: 'final',
                createdAt: { $gte: date, $lte: dateEnd },
            });

            last7Days.push({
                date: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
                revenue: dayBills.reduce((sum, b) => sum + b.totalAmount, 0),
                orders: dayBills.length,
            });
        }

        // Top selling items
        const itemStats = {};
        allBills.forEach((bill) => {
            bill.items.forEach((item) => {
                if (!itemStats[item.itemName]) {
                    itemStats[item.itemName] = { quantity: 0, revenue: 0 };
                }
                itemStats[item.itemName].quantity += item.quantity;
                itemStats[item.itemName].revenue += item.subtotal;
            });
        });

        const topItems = Object.entries(itemStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Recent bills
        const recentBills = await Bill.find({ shopkeeper: shopkeeperId, status: 'final' })
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                dailySales,
                dailyOrders,
                totalRevenue,
                totalOrders,
                totalCustomers,
            },
            last7Days,
            topItems,
            recentBills,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getBills, getBill, createBill, updateBill, processReturn, getDashboardStats };