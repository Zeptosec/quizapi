const express = require('express');
const router = express.Router();
const { 
    getNextTask,
    answerChecker
} = require('../controllers/taskController');

//get next task
router.get('/next', getNextTask);

//check answer
router.post('/check', answerChecker);

module.exports = router;