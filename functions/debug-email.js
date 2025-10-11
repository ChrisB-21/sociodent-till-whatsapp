// This helper is for local debugging only. It should not run during a functions
// deploy or in production. Load .env only when explicitly run locally.
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line global-require
    require('dotenv').config();
  } catch (err) {
    // ignore
  }
}

console.log('Environment Variables Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***HIDDEN***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Test email configuration
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: typeof process.env.SMTP_SECURE !== 'undefined' ? (process.env.SMTP_SECURE === 'true') : true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  console.log('\nTesting email configuration...');
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
    } else {
      console.log('✅ Email configuration is valid');
    }
    process.exit();
  });
} else {
  console.log('Debug email helper skipped (not running in local development).');
}
