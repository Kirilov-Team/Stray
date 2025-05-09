const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.user,
        pass: process.env.pass
    }
});

function sendVerificationEmail(email, token) {
    const mailConfigurations = {
        from: process.env.user,
        to: email,
        subject: 'Stray - Email Verification',
        text: `Follow link : http://localhost/verify/${token} Thank you!`
    };

    transporter.sendMail(mailConfigurations, function (error, info) {
        if (error) throw Error(error);
        console.log('Email Sent Successfully');
        console.log(info);
    });
}

module.exports = { sendVerificationEmail };