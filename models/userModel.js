const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

userSchema.statics.login = async function (email, password) {
    if (!email || !password) {
        throw Error("Fill all fields first!");
    }

    const user = await this.findOne({ email });

    if (!user) {
        throw Error("Wrong credentials");
    }

    const match = await bcrypt.compare(password, user.password);

    if(!match) {
        throw Error("Wrong credentials");
    }
    return user;
}

userSchema.statics.signup = async function (email, password) {

    if (!email || !password) {
        throw Error("Fill all fields first!");
    }

    if (!validator.isEmail(email)) {
        throw Error("Not a valid email!");
    }

    if (!validator.isStrongPassword(password)) {
        throw Error("Password is too weak");
    }

    const exists = await this.findOne({ email });

    if (exists) {
        throw Error("User already exists");
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    const user = await this.create({ email, password: hash });
    return user;
}

module.exports = mongoose.model('User', userSchema);