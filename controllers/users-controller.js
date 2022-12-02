const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
    let users;

    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError('Failed to fecth users from mongodb.', 500);
        return next(error);
    }

    res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new HttpError('Invalid input on signup form.', 422);
        return next(error);
    }

    const { name, email, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.find({ email });
    } catch (err) {
        const error = new HttpError('Failed to fetch data from mongodb.', 500);
        return next(error);
    }

    if (existingUser.length > 0) {
        const error = new HttpError('Email already exist please login instead of signup.', 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        password,
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRX0Mk5UdJcgDnAnsDA4uBpLOILcVm-fNCrWA&usqp=CAU',
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Failed to save data to mongodb.', 500);
        return next(error);
    }

    res.status(201).json({ 
        user: createdUser.toObject({ getters: true })
    });
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new HttpError('Invalid input on login form.', 422);
        return next(error);
    }

    const { email, password } = req.body;

    let loginUser;

    try {
        loginUser = await User.find({ email });
    } catch (err) {
        const error = new HttpError('Retrieve user info failed on mongodb.', 500);
        return next(error);
    }

    if (!loginUser && loginUser.password !== password) {
        const error = new HttpError('Invalid credential that used to login.', 401);
        return next(error);
    }

    res.json({ message: 'Logged In!' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;