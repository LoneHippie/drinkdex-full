const mongoose = require('mongoose');
const dotenv = require('dotenv');

//catches uncaught exceptions in code. In production, node should RESTART after shutdown
//must be top level code to catch anything that comes after it
process.on('uncaughtException', err => {
    console.log(err);
    console.log(`Uncaught exception: Shutting down ... `);
    process.exit(1);
});

dotenv.config({path: './config.env'});
const app = require('./app');

const DB = process.env.DATABASE; //contains connection string

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true, //avoids depreciation issues
        useCreateIndex: true,
        useFindAndModify: false
    }).then(() => {
        console.log('DB connection successful');
    });

/////////START SERVER

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

//catches all unhandled promise rejections
//////////:::::::::: NOTE: When making a production build DO NOT just have the program terminate, look into how to make Node automatically restart instead ::::::::://////////
process.on('unhandledRejection', err => {
    console.log(err);
    console.log(`Unhandled rejection: Shutting down ... `);
    server.close(() => { //this line gives server time to finish any currently pending req/promises before closing
        process.exit(1); //1 = unhandled exception
    }); 
});