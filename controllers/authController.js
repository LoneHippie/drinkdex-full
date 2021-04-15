const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('./../utilities/email');
const { promisify } = require('util');
const AppError = require('./../utilities/appError');
const catchAsync = require('../utilities/catchAsync');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

//creates new JWT and sends appropriate response
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    };

    //define cookie
    res.cookie('jwt', token, cookieOptions);

    //remove pw from output response
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signUp = catchAsync (async (req, res, next) => {
    const newUser = await User.create({ //limiting the fields that can be entered for security
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync (async (req, res, next) => {
    const { email, password } = req.body;

    //1.) Check if email && password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    };
    //2.) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    };

    //3.) If everything is okay, send token to client
    createSendToken(user, 200, res);
});

exports.logout = catchAsync (async (req, res, next) => {

    res.clearCookie("jwt");

    res.status(205).json({
        status: 'success',
        message: 'logged out'
    });
});

exports.protect = catchAsync (async (req, res, next) => {
    //1.) Getting the token & check if exists
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    };

    if (!token) {
        return next(new AppError('You are not logged in, please log in to get access', 401));
    };
    //2.) Valid token check/verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //should return obj with user id, created date and expire date

    //3.) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('User belonging to this token no longer exists', 401));
    };

    //4.) Check if user changed pw after token was issued
    if (freshUser.changedPasswordAfter(decoded.iat) === true) { //true if password was changed after token signed
        return next(new AppError('User recently changed password, please log in again', 401));
    };

    //grant access to protected route, next leads to next middleware (route handler)
    req.user = freshUser; //fresh user can be passed onto next middleware (restrictTo)
    next();
});

exports.isLoggedIn = catchAsync (async (req, res, next) => {

    if (req.cookies.jwt) {
        //1.) Verify token
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET); //should return obj with user id, created date and expire date

        //2.) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next();
        };

        //3.) Check if user changed pw after token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) { //true if password was changed after token signed
            return next();
        };

        //There is a logged in user:
        res.locals.user = currentUser;
        next();
    };
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        };

        next();
    };
};

exports.forgotPassword = catchAsync (async (req, res, next) => {
    //get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('There is no user with this email address', 404));
    };

    //generate random token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.log(`This is the reset token: ${resetToken}`);

    //send token back as email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and password confirmation to: ${resetURL} \nIf you didn't forget your password, please ignore this message.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token',
            message: message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
     
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Error sending email, please try again later', 500));
    };
});

exports.resetPassword = catchAsync (async (req, res, next) => {
    //1.) get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()} });

    //2.) if token is valid is still valid && user, reset password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    };

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    //3.) update changedPasswordAt prop for user
    //done in userModel save middleware

    //4.) log in user, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1.) get user from collection
    const user = await User.findById(req.user.id).select('+password');

    //2.) check if posted pw is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Password is incorrect, please enter your password', 400));
    };

    //3.) if password is correct, update pw
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save(); //reminder: everytime user.save is run, all the save hook middlewares are run

    //4.) log user in w new pw, send new JWT
    createSendToken(user, 200, res);
});