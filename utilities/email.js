const nodemailer = require('nodemailer');

const sendEmail = async options => {
    //1.) create a transporter
    const transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "a07e5393a820f7",
            pass: "297c8ec9b05a9c"
        }
    });

    //2.) define the email options
    const mailOptions = {
        from: 'Lone Dev <lonedev.test@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    //3.) send the email with nodemailer
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;