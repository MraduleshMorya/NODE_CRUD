var nodemailer = require('nodemailer');

// this is a object configured with smtp configs to send emails 
module.exports.transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.Email,
    pass: process.env.EmailAppPassword
  }
});
