const express = require('express');
const router = express.Router();
const { parseBillText, getSmartSuggestions } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/parse-bill', parseBillText);
router.get('/suggestions', getSmartSuggestions);

module.exports = router;