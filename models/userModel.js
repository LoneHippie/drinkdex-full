const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Drink = require('./drinkModel');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address'],
        unique: true,
        sparse: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email address']
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Please enter a valid role [ user ] or [ admin ]'
        },
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Must enter a password of at least 8 characters'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(val) {
                return val === this.password;
            },
            message: 'Password and password confirmation must match'
        }
    },
    savedDrinks: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Drink',
            unique: true
        }
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { return next(); }

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) { return next(); }

    this.passwordChangedAt = Date.now() - 1000;

    next();
});

//see if this works
userSchema.pre('save', async function(next) {
    const drinksPromises = this.savedDrinks.map(async id => await Drink.findById(id));
    this.savedDrinks = await Promise.all(drinksPromises);
    next();
});

userSchema.methods.correctPassword = async function(candidatePw, userPw) {
    return await bcrypt.compare(candidatePw, userPw);
};

userSchema.methods.changedPasswordAfter = async function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimeStamp;
    };

    //false = pw unchanged
    return false;
};

userSchema.methods.createPasswordResetToken = async function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;