const express = require('express');
const router = express.Router();

const { 
    getTestResults,
    postTestAnswer,
    getTestTask,
    submitTest
} = require('../controllers/testController');

router.post('/', getTestTask);

router.post('/answer', postTestAnswer);

router.post('/results', getTestResults);

router.post('/submit', submitTest)

module.exports = router;