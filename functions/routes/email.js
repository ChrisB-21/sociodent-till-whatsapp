import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Create reusable transporter object using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('Mail transporter verification failed:', error);
  } else {
    console.log('Mail transporter is ready');
  }
});

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
