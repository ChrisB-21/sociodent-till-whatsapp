// OTP Service for email verification - JavaScript version
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create reusable transporter object using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

// OTP expires in 10 minutes
const OTP_EXPIRY_TIME = 10 * 60 * 1000;

export class OTPService {
  /**
   * Generate a 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to email
   */
  static async sendOTP(email) {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      
      // Store OTP with timestamp
      otpStorage.set(email, {
        otp,
        email,
        timestamp: Date.now(),
        verified: false
      });      // Create email template - matching the exact format from the screenshot
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1976d2; font-size: 28px; font-weight: bold; margin: 0;">SocioDent</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Redefining Oral Care for All</p>
            </div>
            
            <!-- Title -->
            <h2 style="color: #333; text-align: center; margin: 0 0 30px 0; font-size: 24px; font-weight: 600;">Email Verification Code</h2>
            
            <!-- Content -->
            <p style="color: #333; margin: 0 0 20px 0; font-size: 16px;">Hello,</p>
            
            <p style="color: #333; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
              Thank you for registering with SocioDent. To complete your email verification, please use the following verification code:
            </p>
            
            <!-- OTP Box -->
            <div style="text-align: center; margin: 30px 0;">
              <div style="border: 2px solid #1976d2; border-radius: 8px; padding: 20px; display: inline-block; background-color: #f8f9ff;">
                <div style="color: #1976d2; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
              </div>
            </div>
            
            <!-- Important Section -->
            <div style="margin: 30px 0;">
              <p style="color: #333; font-weight: bold; margin: 0 0 15px 0; font-size: 16px;">Important:</p>
              <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>This verification code will expire in <strong>5 minutes</strong></li>
                <li>Please do not share this code with anyone</li>
                <li>If you did not request this verification, please ignore this email</li>
              </ul>
            </div>
            
            <p style="color: #333; margin: 20px 0; font-size: 16px; line-height: 1.5;">
              If you have any questions or need assistance, please contact our support team.
            </p>
            
            <!-- Footer -->
            <div style="margin-top: 40px; text-align: left;">
              <p style="color: #333; margin: 0; font-size: 16px;">Best regards,</p>
              <p style="color: #333; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">The SocioDent Team</p>
            </div>
            
          </div>
        </div>
      `;      const emailText = `
SocioDent
Redefining Oral Care for All

Email Verification Code

Hello,

Thank you for registering with SocioDent. To complete your email verification, please use the following verification code:

${otp}

Important:
- This verification code will expire in 5 minutes
- Please do not share this code with anyone
- If you did not request this verification, please ignore this email

If you have any questions or need assistance, please contact our support team.

Best regards,
The SocioDent Team
      `;// Send email using nodemailer transporter
      const mailOptions = {
  from: '"SocioDent" <saitamars1554@gmail.com>',
        replyTo: process.env.SMTP_USER || 'saitamars1554@gmail.com',
        to: email,
        subject: 'Email Verification Code',
        html: emailHtml,
        text: emailText
      };

      await transporter.sendMail(mailOptions);

      return {
        success: true,
        message: 'OTP sent successfully to your email'
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }
  /**
   * Verify OTP
   */
  static verifyOTP(email, enteredOTP) {
    console.log('🔍 OTPService.verifyOTP called:');
    console.log('Email:', email);
    console.log('Entered OTP:', enteredOTP);
    
    const otpData = otpStorage.get(email);
    console.log('📊 Stored OTP Data:', otpData);

    if (!otpData) {
      console.log('❌ No OTP found for email');
      return {
        success: false,
        message: 'No OTP found for this email. Please request a new OTP.'
      };
    }

    // Check if OTP is expired
    const currentTime = Date.now();
    const timeDiff = currentTime - otpData.timestamp;
    console.log('⏰ Time difference:', timeDiff, 'ms (expiry:', OTP_EXPIRY_TIME, 'ms)');
    
    if (timeDiff > OTP_EXPIRY_TIME) {
      console.log('❌ OTP expired');
      otpStorage.delete(email);
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check if OTP matches
    console.log('🔢 Comparing OTPs - Stored:', otpData.otp, 'Entered:', enteredOTP);
    if (otpData.otp !== enteredOTP) {
      console.log('❌ OTP mismatch');
      return {
        success: false,
        message: 'Invalid OTP. Please try again.'
      };
    }

    // Mark as verified
    console.log('✅ OTP verified successfully');
    otpData.verified = true;
    otpStorage.set(email, otpData);

    return {
      success: true,
      message: 'Email verified successfully!'
    };
  }

  /**
   * Check if email is verified
   */
  static isEmailVerified(email) {
    const otpData = otpStorage.get(email);
    return otpData ? otpData.verified : false;
  }

  /**
   * Clean expired OTPs (call periodically)
   */
  static cleanExpiredOTPs() {
    const currentTime = Date.now();
    for (const [email, otpData] of otpStorage.entries()) {
      if (currentTime - otpData.timestamp > OTP_EXPIRY_TIME) {
        otpStorage.delete(email);
      }
    }
  }
}

// Clean expired OTPs every 5 minutes
setInterval(() => {
  OTPService.cleanExpiredOTPs();
}, 5 * 60 * 1000);
