const fs = require('fs');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Fail during retrieve record from mongodb', 500);
        return next(err);
    }
    
    if (!place) {
        const error = new HttpError('Could not find a place for provided place id.', 404);
        return next(error);
    }

    res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let userPlaces;

    try {
        userPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        const error = new HttpError('Faild during retrieve record from mongodb', 500);
        return next(error);
    }

    if (!userPlaces) {
        const error = new HttpError('Could not find a place for provided user id.', 404);
        return next(error);
    }

    res.json({places: userPlaces.places.map(place => place.toObject({getters: true}))});
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Errors: ' + errors);
        return next(new HttpError('Invali Input on Creating New Place Form.', 422));
    }

    const { title, description, address, creator } = req.body;

    let loggedUser;

    try {
        loggedUser = await User.findById(creator);
    } catch (err) {
        const error = new HttpError('Something went wrong during fetch data mongodb.', 500);
        return next(error);
    }

    if (!loggedUser) {
        const error = new HttpError('User not authenticated.', 401);
        return next(error);
    }

    let coordinates;

    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    console.log(coordinates);

    const createdPlace = new Place({
        title,
        description,
        location: coordinates,
        address,
        creator,
        image: req.file.path
    });

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await createdPlace.save({ session: session });
        loggedUser.places.push(createdPlace);
        await loggedUser.save({ session: session });

        await session.commitTransaction();
    } catch (err) {
        console.log(err.message);
        const error = new HttpError('Failed to insert new place', 500);
        return next(error);
    }

    res.status(201).json({place: createdPlace});
};

const updatePlaceById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid Input during Updating Selected Place.', 422);
    }

    const placeId = req.params.pid;

    let updatingPlace;

    try {
        updatingPlace = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Could not find data on mongodb', 500);
        return next(error);
    }

    if (!updatingPlace) {
        throw new HttpError('Could not update due to place not found on records.', 404);
    }

    const { title, description, address } = req.body;
    updatingPlace.title = title || updatingPlace.title;
    updatingPlace.description = description || updatingPlace.description;
    updatingPlace.address = address || updatingPlace.address;

    try {
        await updatingPlace.save();
    } catch (err) {
        const error = new HttpError('Could not update data on mongodb', 500);
        return next(error);
    }

    res.status(200).json({place: updatingPlace.toObject({getters: true})});
};

const deletePlaceById = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;

    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError('Could not retrieve data from mongodb', 500);
        return next(error);
    }

    if (!place) {
        throw new HttpError('Could not delete due to place not found on records.', 404);
    }

    const image = place.image;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        await place.remove({ session: session });
        
        const user = place.creator;

        user.places.pull(place);

        await user.save({ session: session });

        session.commitTransaction();
    } catch (err) {
        const error = new HttpError('Could not delete place due to error mongodb', 500);
        return next(error);
    }

    fs.unlink(image, err => {
        console.log(err);
    });

    res.status(200).json({message: 'Delete Place.'});
};

module.exports = {
    getPlaceById,
    getPlacesByUserId,
    createPlace,
    updatePlaceById,
    deletePlaceById
};