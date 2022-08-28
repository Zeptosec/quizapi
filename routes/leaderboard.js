const express = require('express');
const router = express.Router();

const {
    getLeaders
} = require('../controllers/leaderboardController');

router.get('/', getLeaders);

module.exports = router;