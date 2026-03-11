const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');

router.get('/profile', membershipController.getProfile);
router.post('/subscribe', membershipController.subscribe);
router.get('/status', membershipController.getStatus);

module.exports = router;