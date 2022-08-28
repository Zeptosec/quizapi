const express = require('express');
const router = express.Router();

const {
    createTask,
    getTask,
    getTasks,
    deleteTask
} = require('../controllers/adminController');
const requireAuth = require('../middleware/requireAuth');

//authentication is required
router.use(requireAuth);

//get all tasks
router.get('/', getTasks);

//get single task
router.get('/:id', getTask);

//delete single task
router.delete('/:id', deleteTask);

//create new task
router.post('/', createTask);

module.exports = router;