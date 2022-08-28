const Test = require('../models/testModel');
var moment = require('moment');

const getDurationString = (m) => {
    let str = ``;
    let data = m._data;
    if (data.years > 0) {
        str += `${data.years}Y `;
    }
    if (data.months > 0) {
        str += `${data.months}M `;
    }
    if (data.days > 0) {
        str += `${data.days}D `;
    }
    if (data.hours > 0) {
        str += `${data.hours}h `;
    }
    if (data.minutes > 0) {
        str += `${data.minutes}min `;
    }
    if (data.seconds > 0) {
        str += `${data.seconds}.${Math.round(data.milliseconds / 100)}s`;
    }
    // if (data.milliseconds > 0) {
    //     str += `${data.milliseconds}ms`
    // }
    return str;
}

const getLeaders = async (req, res) => {
    const tests = await Test
        .find({ published: true })
        .sort({ score: -1 })
        .limit(10);

    if (tests.length === 0) {
        return res.status(400).json({ error: "Leaderboard is empty" });
    }
    let data = [];
    const headers = ['Nickname', 'Time spent', 'Points', 'Score'];
    for (let i = 0; i < tests.length; i++) {
        const dur = moment.duration(tests[i].finishedAt - tests[i].createdAt);
        data.push([tests[i].nickname, getDurationString(dur), tests[i].points, Math.round(tests[i].score * 100) / 100]);
    }

    res.status(200).json({
        headers,
        data
    })
}

module.exports = {
    getLeaders
}