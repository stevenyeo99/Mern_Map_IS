const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const usersRouter = require('./routes/users-route');
const placesRouter = require('./routes/places-route');
const HttpError = require('./models/http-error');

const app = express();
app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));
app.use(express.static(path.join('public')));

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
//     next();
// });

app.use('/api/users', usersRouter);
app.use('/api/places', placesRouter);

app.use((req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
    const error = new HttpError('Could not find current endpoint route.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err => {
            console.log(err);
        });
    }

    if (res.headerSent) {
        console.log('Header Sended for error case.');
        next(error);
    }
    
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occured.' });
});

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@masternodejs.v5ntz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(5000);
    })
    .catch(err => {
        console.log('Fail to connect mongodb.');
    });