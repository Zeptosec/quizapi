const Task = require("../models/taskModel");
const mongoose = require("mongoose");

// Create new tasks in database
const createTask = async (req, res) => {
    const { question, answers, points, difficulty, type, choices } = req.body;
    try {
        if (!answers || answers.length == 0) {
            throw Error("Add an answer");
        }
        let task;
        switch (type) {
            case "free":
                task = await Task.create({ question, answers, points, difficulty, type });
                break;
            case "choice":
                task = await Task.create({ question, answers, points, difficulty, type, choices });
                break;
            default:
                throw Error("Incorrect question type");
        }
        res.status(200).json({ task });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteTask = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Error("Wrong ID");
        }
        const task = await Task.findOneAndDelete({ _id: id });
        if (!task) {
            res.status(404).json({ error: "Task not found" });
        }
        res.status(200).json(task);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Get all tasks from database
const getTasks = async (req, res) => {
    const tasks = await Task.find({}).sort({ createdAt: -1 });

    res.status(200).json({ tasks });
};

// Get a single task from database
const getTask = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Id was invalid" });
    }

    const task = await Task.findById(id);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ task });
};

module.exports = { createTask, deleteTask, getTask, getTasks };