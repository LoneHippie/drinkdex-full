const Drink = require('./../models/drinkModel');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const factory = require('./handlerFactory');
const { Mongoose } = require('mongoose');

/////Drink controllers

exports.getAllDrinks = factory.getAll(Drink);
exports.getDrink = factory.getOne(Drink);
// exports.createDrink = factory.createOne(Drink);

exports.createDrink = factory.createOne(Drink);

exports.updateDrink = factory.updateOne(Drink);
exports.deleteDrink = factory.deleteOne(Drink);

exports.getRandom = catchAsync (async (req, res, next) => {
    const random = await Drink.aggregate([
        {
            $match: { _id: { $exists: true } }
        },
        {
            $sample: { size: 1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: random
        }
    })
})