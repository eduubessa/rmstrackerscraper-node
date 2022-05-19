const nodemailer = require('nodemailer');
const config = require('./config/mailer.json');
const data = require('./data/mailer.json');

const Mail = {
    CanSentNow: () => {
        let last_mail_sent = new Date(data.last_sent);
        let now = new Date();
        let diff = now.getTime() - last_mail_sent.getTime();

        let seconds = Math.floor(diff / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        return hours >= 6;
    },
    Send: (subject, message) => {
        const transporter = nodemailer.createTransport(config);

        const mailOptions = {
            from: config.auth.user,
            to: data.to,
            subject: subject,
            text: message
        };

        if(Mail.CanSentNow()) {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    }
};

module.exports = {
    Mail
}

Mail.Send('Teste', 'Teste');
