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
      });

      // Create email template
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">Email Verification</h1>
          <p>Hello,</p>
          <p>Your OTP for email verification is:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block;">
              <h2 style="color: #2563eb; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</h2>
            </div>
          </div>
          
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p style="margin: 0;">Best regards,<br/>
            <strong style="color: #2563eb;">The SocioDent Smile Team</strong></p>
          </div>
        </div>
      `;

      const emailText = `
        Email Verification
        
        Hello,
        
        Your OTP for email verification is: ${otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request this verification, please ignore this email.
        
        Best regards,
        The SocioDent Smile Team
      `;      // Send email using nodemailer transporter
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"SocioDent Smile" <saitamars1554@gmail.com>',
        replyTo: process.env.SMTP_USER || 'saitamars1554@gmail.com',
        to: email,
        subject: 'Email Verification - SocioDent Smile',
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
    const otpData = otpStorage.get(email);

    if (!otpData) {
      return {
        success: false,
        message: 'No OTP found for this email. Please request a new OTP.'
      };
    }

    // Check if OTP is expired
    const currentTime = Date.now();
    if (currentTime - otpData.timestamp > OTP_EXPIRY_TIME) {
      otpStorage.delete(email);
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check if OTP matches
    if (otpData.otp !== enteredOTP) {
      return {
        success: false,
        message: 'Invalid OTP. Please try again.'
      };
    }

    // Mark as verified
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
