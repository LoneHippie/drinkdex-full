const mongoose = require('mongoose');

const drinkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A drink must have a name'],
        unique: true,
        trim: true,
        maxLength: [40, 'A drink must have a max of 40 characters'],
        minLength: [2, 'A drink name must be at least 2 characters long']
    },
    ingredients: {
        type: [String],
        required: [true, 'A drink must have ingredients']
    },
    instructions: {
        type: [String],
        required: [true, 'A drink must have a list of instructions']
    },
    categories: {
        type: [String],
        required: [true, 'A drink must be tagged with at least one category'],
        enum: {
            values: ['citrus', 'sweet', 'bitter', 'thick', 'strong', 'light', 'sour', 'fruity'],
            message: 'Available catagories: citrus, sweet, bitter, or thick'
        }
    },
    spirits: {
        type: [String],
        enum: {
            values: ['vodka', 'gin', 'tequila', 'whiskey', 'scotch', 'bourbon', 'arak', 'rum', 'cream liquor', 'brandy']
        }
    },
    description: {
        type: String,
        trim: true,
        maxLength: 800,
        minLength: 2
    },
    coverImage: {
        type: String,
        required: false
    },
    imageId: {
        type: String,
        required: false
    },
    createdBy: {
       type: [String]
    }
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

drinkSchema.pre('save', function(next) {
    this.ingredients.forEach(el => {
        if (el === 'vodka' || el === 'gin' || el === 'tequila' || el === 'whiskey' || el === 'scotch' || el === 'arak' || el === 'rum' || el === 'cream liquor' || el === 'brandy') {
            this.spirits.push(el);
        }
    })
    next();
});

const Drink = mongoose.model('Drink', drinkSchema);

module.exports = Drink;