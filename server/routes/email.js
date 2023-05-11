const debug = require("debug")("be-api:transactions"),
    _ = require("lodash"),
    express = require("express"),
    nodemailer = require('nodemailer'),
    format = require("string-template");

const router = express.Router();

router.route('/chainalert')
    .post(async (req, res) => {
        debug(`POST - /email/chainalert`, req.body.counter);

        const transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: '587',
            secure: false,
            auth: {
                user: process.env.SMTP_AUTH_USER,
                pass: process.env.SMTP_AUTH_PASSWORD,
            }
        });

        const info = await transporter.sendMail({
            from: 'noreply@borlaug.network',                                                                                        // sender address
            to: `${process.env.TO_EMAIL}, ${process.env.CC_EMAIL}`,                                                                                      // list of receivers
            subject: 'Status Check Alarm: "Maya-Public-Node-Failed" in Asia Pacific (Mumbai)',
            html: format(`Hello, <br/><br/>
                    Maya-Public-Node has failed today. Its not producing any block. You can check by clicking below link <br/>
                    <a style="display: block;
                       width: 115px;
                       height: 25px;
                       background: #4E9CAF;
                       padding: 10px;
                       text-align: center;
                       border-radius: 5px;
                       color: white;
                       font-weight: bold;" href="{url}" target="_blank" >click here</a>
                    <br/><br/><br/>`, {
                url: 'https://www.maya.explorer.borlaug.network/'
            })
        });
        debug("mailInfo", info);

        res.status(200).send("Alert Sent").end();

    });

module.exports = router;
