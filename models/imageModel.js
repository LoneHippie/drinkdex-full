const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    name: {
        type: String
    },
    imagePath: {
        type: String
    }
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;