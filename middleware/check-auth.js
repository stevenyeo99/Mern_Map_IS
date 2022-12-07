const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const authorization = req.headers.authorization.split(' ')[1];

        if (!authorization) {
            throw new Error('Not Authenticated', 401);
        }

        const decodedToken = jwt.verify(authorization, process.env.JWT_KEY);

        req.userData = { userId: decodedToken.userId };

        next();
    } catch (err) {
        const error = new HttpError('Not Authenticated', 403);
        return next(error);
    }
};