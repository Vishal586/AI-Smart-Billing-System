const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

// @desc    Get all customers for shopkeeper
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;

        let query = { shopkeeper: req.user.id };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Customer.countDocuments(query);
        const customers = await Customer.find(query)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            customers,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer with bill history
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            shopkeeper: req.user.id,
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Get customer's bills
        const bills = await Bill.find({
            customer: customer._id,
            shopkeeper: req.user.id,
        }).sort({ createdAt: -1 }).limit(50);

        res.json({ success: true, customer, bills });
    } catch (error) {
        next(error);
    }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address, notes } = req.body;

        // Check for duplicate phone under same shopkeeper
        if (phone) {
            const existing = await Customer.findOne({ shopkeeper: req.user.id, phone });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Customer with this phone already exists' });
            }
        }

        const customer = await Customer.create({
            shopkeeper: req.user.id,
            name,
            phone,
            email,
            address,
            notes,
        });

        res.status(201).json({ success: true, customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, shopkeeper: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOneAndDelete({
            _id: req.params.id,
            shopkeeper: req.user.id,
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };