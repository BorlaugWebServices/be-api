import {Request, Response, Router} from "express";
import nodemailer from 'nodemailer';
import format from "string-template";
import Debug from "debug";
import path from "path";

const filename = path.basename(__filename, '.ts');
const debug = Debug(`be-api:${filename}`);
const router: Router = Router();

// Interface for the incoming request body
interface ChainAlertRequest {
  counter?: number | string;
}

router.route('/chainalert')
  .post(async (req: Request<{}, {}, ChainAlertRequest>, res: Response) => {
    debug(`POST - /email/chainalert`, req.body.counter);

    // Define the transporter with explicit auth types
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587, // Port as a number
      secure: false,
      auth: {
        user: process.env.SMTP_AUTH_USER,
        pass: process.env.SMTP_AUTH_PASSWORD,
      }
    });

    try {
      const info = await transporter.sendMail({
        from: 'noreply@borlaug.network',
        to: `${process.env.TO_EMAIL}, ${process.env.CC_EMAIL}`,
        subject: 'Status Check Alarm: "Aztec-Public-Node-Failed" in Asia Pacific (Mumbai)',
        html: format(`Hello, <br/><br/>
                        Aztec-Public-Node has failed today. Its not producing any block. You can check by clicking below link <br/>
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
          url: 'https://www.aztec.explorer.borlaug.network/'
        })
      });

      debug("mailInfo", info);
      return res.status(200).send("Alert Sent").end();
    } catch (error: any) {
      debug("Mail Error:", error);
      return res.status(500).send({
        msg: "Failed to send email alert",
        err: error.message
      }).end();
    }
  });

export default router;