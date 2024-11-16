const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport

async function sendEmail(subscriber_email, msg) {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: `${process.env.GMAIL}`, // your Gmail account
            pass: `${process.env.GMAIL_APP_PASSWORD}`   // your Gmail password or app-specific password
        }
    });


    for (let i = 0; i < subscriber_email.length; i++) {
        // Setup email data
        let mailOptions = {
            from: '"Xentinal Agent" <your-email@gmail.com>', // sender address
            to: `${subscriber_email[i]}`,            // list of receivers
            subject: `Xentinal Agent Triggered an Alert at ${new Date().toLocaleString()}`,
            text: msg,
        };

        // Send mail with defined transport object
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
        });
    }

}

module.exports = { sendEmail };