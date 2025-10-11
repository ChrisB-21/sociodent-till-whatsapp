import express from 'express';
import nodemailer from 'nodemailer';
// Only load dotenv during local development/emulator runs. In Cloud Functions
// the environment variables come from runtime config and should not be loaded
// from a .env file.
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line global-require
    require('dotenv').config();
  } catch (err) {
    // ignore
  }
}

const router = express.Router();

// Create reusable transporter object using environment variables
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpSecure = (() => {
  if (typeof process.env.SMTP_SECURE !== 'undefined') {
    return process.env.SMTP_SECURE === 'true';
  }
  return smtpPort === 465;
})();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Only verify the transporter when running locally to avoid outbound network
// calls during the functions packaging/validation step on deploy which can
// cause SSL/version errors in CI environments.
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  transporter.verify((error) => {
    if (error) {
      console.error('Mail transporter verification failed:', error);
    } else {
      console.log('Mail transporter is ready');
    }
  });
}

// Send email endpoint
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SocioDent Smile" <saitamars1554@gmail.com>',
      replyTo: process.env.SMTP_USER || 'saitamars1554@gmail.com',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    });
  }
});

export default router;
