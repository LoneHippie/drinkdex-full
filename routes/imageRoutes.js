const express = require('express');

const authController = require('./../controllers/authController');
const imageController = require('../controllers/imageController');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images/drinks/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //reject file
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const router = express();

router.route('/')
    .post(
        authController.protect,
        multer({
            storage: storage,
            limits: { fileSize: 1024 * 1024 * 5 },
            fileFilter: fileFilter
        }).single('drinkImage'),
        imageController.uploadDrinkImage
    );

router.route('/:id')
        .delete(authController.protect, imageController.deleteDrinkImage);

module.exports = router;