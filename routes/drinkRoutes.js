const express = require('express');

const authController = require('./../controllers/authController');
const drinkController = require('./../controllers/drinkController');

const router = express.Router();

router.route('/random-drink')
    .get(drinkController.getRandom);

router.route('/')
    .get(drinkController.getAllDrinks)
    .post(authController.protect, drinkController.createDrink);

router.route('/:id')
    .get(drinkController.getDrink)
    .patch(authController.protect, drinkController.updateDrink)
    .delete(authController.protect, drinkController.deleteDrink);

module.exports = router;