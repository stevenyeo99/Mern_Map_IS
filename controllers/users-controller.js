const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create user, please try again.');
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        image: req.file.path,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Failed to save data to mongodb.', 500);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({
            userId: createdUser.id,
            email: createdUser.email
        }, process.env.JWT_KEY, { expiresIn: '1h' });
    } catch (err) {
        const error = new HttpError('Failed to generate token.', 403);
        return next(error);
    }

    res.status(201).json({ 
        userId: createdUser.id,
        email: createdUser.email,
        token: token
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
        loginUser = await User.findOne({ email });
    } catch (err) {
        const error = new HttpError('Retrieve user info failed on mongodb.', 500);
        return next(error);
    }

    if (!loginUser) {
        const error = new HttpError('Invalid credential that used to login.', 403);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, loginUser.password);
    } catch (err) {
        const error = new HttpError('Something went wrong!', 500);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid credential that used to login.', 403);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({
            userId: loginUser.id,
            email: loginUser.email
        }, process.env.JWT_KEY, { expiresIn: '1h' });
    } catch (err) {
        const error = new HttpError('Failed to generate token.', 403);
        return next(error);
    }

    res.json({ userId: loginUser.id, email: loginUser.email, token: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;