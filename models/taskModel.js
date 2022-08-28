const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const taskSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    choices: [{
        type: String
    }],
    answers: [{
        type: String,
        required: true
    }],
    points: {
        type: Number,
        required: true
    },
    difficulty: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('task', taskSchema);