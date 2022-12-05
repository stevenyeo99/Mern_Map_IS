const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const usersRouter = require('./routes/users-route');
const placesRouter = require('./routes/places-route');
const HttpError = require('./models/http-error');

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/users', usersRouter);
app.use('/api/places', placesRouter);

app.use((req, res, next) => {
    const error = new HttpError('Could not find current endpoint route.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (res.headerSent) {
        console.log('Header Sended for error case.');
        next(error);
    }
    
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occured.' });
});

mongoose
    .connect('mongodb+srv://root:FBHDtYkPZBFqoPUc@masternodejs.v5ntz.mongodb.net/places?retryWrites=true&w=majority')
    .then(() => {
        app.listen(5000);
    })
    .catch(err => {
        console.log('Fail to connect mongodb.');
    });