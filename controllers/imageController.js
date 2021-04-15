const Image = require('../models/imageModel');

const catchAsync = require('../utilities/catchAsync');

exports.uploadDrinkImage = catchAsync (async (req, res, next) => {
    console.log('FILE');
    console.log(req.file);

    const doc = await Image.create({
        image: req.file,
        name: req.file.filename,
        imagePath: req.file.path
    });

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.deleteDrinkImage = catchAsync (async (req, res, next) => {
    const doc = await Image.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError('No document found with this ID', 404));
    };

    res.status(204).json({
        status: 'success',
        message: `Deleted doc: ${doc.name}`
    });
});