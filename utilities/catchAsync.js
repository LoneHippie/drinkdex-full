//this function can be used to wrap any async function to catch errors. Any caught errors will be sent to global error handler through Express pipeline
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};