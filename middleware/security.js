const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests, please try again later.'
});

module.exports = function(app){

    // ضغط البيانات
    app.use(compression());

    // حماية الهيدر
    app.use(helmet({
        crossOriginResourcePolicy: false
    }));

    // منع السبام
    app.use(limiter);

};