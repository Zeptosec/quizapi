const Task = require("../models/taskModel");
const mongoose = require("mongoose");
const Test = require('../models/testModel');
const { getAnswerPoints } = require('./taskController');

const newTest = async (uid) => {
    console.log("new test")
    let count = await Task.estimatedDocumentCount({});
    if (count == 0) {
        throw Error("There are currently no questions");
    }
    if (count > 10) {
        count = 10;
    }
    const tasks = await Task.aggregate([{ $sample: { size: count } }]);
    if (tasks.length === 0) {
        throw Error("There are no questions at the time");
    }
    const testQuestions = tasks.map(a => {
        return { id: a._id, answered: false, points: 0 };
    });
    let uuid = uid;
    if (!uuid) {
        uuid = new mongoose.Types.ObjectId();
    }
    const test = await Test.create({
        userid: uuid,
        tasks: testQuestions,
        finished: false,
        published: false,
        nickname: "N/A",
        score: 0,
        expiresIn: 600000
    });
    return { uuid, test };
}

const getQuestionFromTestTask = async (task) => {
    const q = await Task.findById(task.id);
    if (!q) {
        throw Error("Test question is missing");
    }
    return {
        qid: q._id,
        question: q.question,
        type: q.type,
        choices: q.choices
    };
}

const getTimeLeft = (test) => {
    if (!test.expiresIn) {
        throw Error("Previous test expired");
    }
    return test.createdAt.getTime() + test.expiresIn - Date.now();
}

const getTestTask = async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ error: "User id is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(uid) && uid !== "null") {
        return res.status(400).json({ error: "Invalid user ID" });
    }
    if (uid === "null") { // if this user does not have an id
        try {
            // create new test for this user and assign a new user id
            const { test, uuid } = await newTest(null);
            const question = await getQuestionFromTestTask(test.tasks[0]);
            const expiresIn = getTimeLeft(test);
            return res.status(200).json({ uid: uuid, task: question, finished: false, tid: test._id, expiresIn });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        }
    } else { // if user exists
        //trying to locate previous test
        let pt = await Test.find({ userid: uid, finished: false, expired: false })
        for (let i = 0; i < pt.length; i++) {
            const prevt = pt[i];
            const expiresIn = getTimeLeft(prevt);
            if (expiresIn < 1) {
                await Test.findByIdAndUpdate(prevt._id, { expired: true });
                pt[i].expired = true;
            }
        }
        let previousTest = pt.find(w => w.expired === false)

        // if there is no such test
        if (!previousTest) {
            // create new test
            try {
                const { test } = await newTest(uid);
                const question = await getQuestionFromTestTask(test.tasks[0]);
                const expiresIn = getTimeLeft(test);
                return res.status(200).json({ task: question, finished: false, tid: test._id, expiresIn });
            } catch (err) {
                console.log(err);
                res.status(400).json({ error: err.message });
            }
        } else { // if there was an unfinished test
            // find first unanswered question
            try {
                let expiresIn = getTimeLeft(previousTest);
                console.log(pt)
                if (expiresIn < 1) {
                    await Test.findByIdAndUpdate(previousTest._id, { expired: true });
                    const { test } = await newTest(uid);
                    previousTest = test;
                    expiresIn = getTimeLeft(test);
                }
                const task = previousTest.tasks.find(w => w.answered === false);
                if (!task) { // if all questions were answered
                    // mark test as finished. Something like this shouldn't happen
                    await Test.findByIdAndUpdate(previousTest._id, { finished: true });
                    return res.status(200).json({ finished: true, tid: previousTest._id });
                } else {
                    // return the first unanswered question on test
                    const question = await getQuestionFromTestTask(task);
                    return res.status(200).json({ task: question, finished: false, tid: previousTest._id, expiresIn });
                }
            } catch (err) {
                console.log(err);
                return res.status(400).json({ error: err.message });
            }
        }
    }
}

const postTestAnswer = async (req, res) => {
    const { answer, qid, tid } = req.body;

    if (!tid) {
        return res.status(400).json({ error: "Test id is required" });
    }
    if (!qid) {
        return res.status(400).json({ error: "Question id is required" });
    }
    if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
    }
    if (answer.length > 69) {
        return res.status(400).json({ error: "Answer is too long" });
    }
    if (!mongoose.Types.ObjectId.isValid(tid)) {
        return res.status(400).json({ error: "Test id is not valid" });
    }
    if (!mongoose.Types.ObjectId.isValid(qid)) {
        return res.status(400).json({ error: "Question id is not valid" });
    }

    try {
        const test = await Test.findById(tid);
        if (!test) {
            throw Error("There are no open tests");
        }
        const expiresIn = getTimeLeft(test);
        if (expiresIn < 1) {
            throw Error("Test expired");
        }
        if (test.finished) {
            throw Error("Test was finished");
        }
        const q = test.tasks.find(w => w.id === qid);
        if (!q) {
            throw Error("No such question on this test");
        }

        const task = await Task.findOne({ _id: q.id });
        if (!task) {
            throw Error("That question no longer exists");
        }

        const points = getAnswerPoints(task, answer);

        const query = { _id: test._id, "tasks._id": q._id }
        const updateDoc = {
            $set: {
                "tasks.$.answer": answer,
                "tasks.$.answered": true,
                "tasks.$.points": points
            }
        }

        const result = await Test.updateOne(query, updateDoc);
        //console.log(result);
        //console.log(`updated test: ${test._id} and task: ${q._id}`)
        const currQIndex = test.tasks.map(w => w.id).indexOf(qid);
        if (currQIndex === test.tasks.length - 1) {
            const testPoints = test.tasks.reduce((acc, obj) => acc + obj.points, 0) + points;
            const finishedAt = Date.now();
            const diff = finishedAt - test.createdAt;
            let score = testPoints / diff * 314159;
            console.log(score, diff, testPoints);
            await Test.findByIdAndUpdate(test._id, { finished: true, finishedAt, points: testPoints, score });
            return res.status(200).json({ finished: true, tid: test._id });
        }

        const question = await getQuestionFromTestTask(test.tasks[currQIndex + 1]);
        if (!question) {
            throw Error("Could not find the question");
        }
        res.status(200).json({ task: question, finished: false, tid: test._id, expiresIn });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

const getTestResults = async (req, res) => {
    const { tid } = req.body;

    if (!tid) {
        return res.status(400).json({ error: "No id was specified" });
    }
    if (!mongoose.Types.ObjectId.isValid(tid)) {
        return res.status(400).json({ error: "Id is not valid" });
    }

    try {
        const test = await Test.findById(tid);
        if (!test.finished) {
            throw Error("Test is unfinished");
        }
        let data = [];
        for (let i = 0; i < test.tasks.length; i++) {
            const task = await Task.findById(test.tasks[i].id);
            if (!task) {
                console.log(test, i);
                throw Error("Question was not found");
            }
            data.push([task.question, test.tasks[i].answer, test.tasks[i].points])
        }
        let results = {
            headers: ["Question", "Your answer", "Points"],
            data,
            score: test.score
        }

        res.status(200).json({ results });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const submitTest = async (req, res) => {
    const { tid, uid, nickname } = req.body;

    if (!uid) {
        return res.status(400).json({ error: "User id must be specified" });
    }
    if (!tid) {
        return res.status(400).json({ error: "Test id must be specified" })
    }
    if (!nickname) {
        return res.status(400).json({ error: "nickname must be specified" })
    }
    if (!mongoose.Types.ObjectId.isValid(tid)) {
        return res.status(400).json({ error: "Test id is invalid" })
    }
    if (!mongoose.Types.ObjectId.isValid(uid)) {
        return res.status(400).json({ error: "User id is invalid" })
    }
    if (nickname.length > 16 || nickname.length < 3 || !/^[a-zA-Z]+$/.test(nickname)) {
        return res.status(400).json({ error: "Nickname is invalid" });
    }

    try {
        const test = await Test.findById(tid);
        if (!test) {
            throw Error("Test was not found");
        }
        if (test.userid !== uid) {
            throw Error("Test is not owned by specified user");
        }
        if (!test.finished) {
            throw Error("Can not publish unfinished test");
        }
        if (test.score <= 0.05) {
            throw Error("You can only publish your test if your score is greater or equal to 0.05");
        }
        const result = await Test.findByIdAndUpdate(tid, {
            nickname,
            published: true,
        });
        res.status(200).json({ message: "Submitted!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }

}

module.exports = {
    getTestTask,
    postTestAnswer,
    getTestResults,
    submitTest
};