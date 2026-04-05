const express = require('express');
const router = express.Router();
const {
    getBills,
    getBill,
    createBill,
    updateBill,
    processReturn,
    getDashboardStats,
} = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.route('/').get(getBills).post(createBill);
router.route('/:id').get(getBill).put(updateBill);
router.post('/:id/return', processReturn);

module.exports = router;