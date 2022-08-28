const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
    // verify authentication
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authorization.split(' ')[1];

    try {
        const { _id } = jwt.verify(token, process.env.SECRET);
        if(_id !== '6300e82eb51819aa9f1ba8c3'){
            return res.status(401).json({error: "Unauthorized"});
        }
        req.user = await User.findOne({ _id }).select('_id');
        next();
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: "Unauthorized request" });
    }
}

module.exports = requireAuth;