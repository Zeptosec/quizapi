const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const testSchema = new Schema({
    userid: {
        type: String,
        required: true
    },
    tasks: [{
        id: String,
        answer: Schema.Types.Mixed,
        answered: Boolean,
        points: Number
    }],
    finished: {
        type: Boolean,
        required: true
    },
    finishedAt: {
        type: Date,
    },
    published: {
        type: Boolean,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    expiresIn: {
        type: Number,
        default: 600000
    },
    expired: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);