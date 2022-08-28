require('dotenv').config();

// ///test imports !DELETE!
// const Test = require('./models/testModel');
// ///

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const testRoutes = require('./routes/tests');
const leaderRoutes = require('./routes/leaderboard');

const app = express();

app.use(cors({
    origin: "*"
}));
app.use(express.json()); // for parsing json
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/test', testRoutes);
app.use('/api/leaderboard', leaderRoutes);
// app.get('/', async (req, res) => {
//     const test = await Test.findById('630542a4c6fad29c9124f57e');
//     const testPoints = test.tasks.reduce((acc, obj) => acc + obj.points, 0);

//     res.json({ testPoints })
// });

mongoose.connect(process.env.MONG_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'quiz',
}).then(() => {
    app.listen(process.env.PORT || 4000, () => {
        console.log(`running on port ${process.env.PORT || 4000}!`);
    });
}).catch(err => {
    console.log(err);
});