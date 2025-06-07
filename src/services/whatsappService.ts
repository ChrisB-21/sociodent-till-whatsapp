import { ref, set, get, update } from 'firebase/database';
import { db } from '@/firebase';

interface WhatsAppOTPConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsAppNumber: string;
  targetWhatsAppNumber: string;
}

interface OTPSession {
  id: string;
  phoneNumber: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  attempts: number;
}

export class WhatsAppOTPService {
  private static config: WhatsAppOTPConfig = {
    twilioAccountSid: process.env.VITE_TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.VITE_TWILIO_AUTH_TOKEN || '',
    twilioWhatsAppNumber: process.env.VITE_TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Twilio Sandbox
    targetWhatsAppNumber: 'whatsapp:+919043561043' // Your WhatsApp number
  };

  /**
   * Generate a 6-digit OTP
   */
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP session in Firebase
   */
  private static async storeOTPSession(phoneNumber: string, otp: string): Promise<string> {
    const sessionId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: OTPSession = {
      id: sessionId,
      phoneNumber,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
      verified: false,
      attempts: 0
    };

    const sessionRef = ref(db, `otpSessions/${sessionId}`);
    await set(sessionRef, session);
    return sessionId;
  }

  /**
   * Send WhatsApp message via Twilio
   */
  private static async sendWhatsAppMessage(message: string): Promise<boolean> {
    try {
      const { twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber, targetWhatsAppNumber } = this.config;
      
      if (!twilioAccountSid || !twilioAuthToken) {
        console.error('Twilio credentials not configured');
        return false;
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioWhatsAppNumber,
          To: targetWhatsAppNumber,
          Body: message,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('WhatsApp message sent successfully:', result.sid);
        return true;
      } else {
        const error = await response.text();
        console.error('Failed to send WhatsApp message:', error);
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send OTP via WhatsApp
   */
  public static async sendOTP(phoneNumber: string, userName?: string): Promise<{ success: boolean; sessionId?: string; message: string }> {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      
      // Store session
      const sessionId = await this.storeOTPSession(phoneNumber, otp);
      
      // Format phone number for display
      const formattedPhone = phoneNumber.replace(/^(\+91)?/, '+91 ');
      
      // Create WhatsApp message
      const message = `🦷 *SocioDent Smile Verification*

Hello${userName ? ` ${userName}` : ''}!

Your login verification code is:

*${otp}*

This code will expire in 5 minutes.

Phone: ${formattedPhone}

Please do not share this code with anyone.

Thank you for using SocioDent Smile! 😊`;

      // Send via WhatsApp
      const sent = await this.sendWhatsAppMessage(message);
      
      if (sent) {
        return {
          success: true,
          sessionId,
          message: 'OTP sent successfully to your registered WhatsApp number'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send OTP via WhatsApp. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error in sendOTP:', error);
      return {
        success: false,
        message: 'An error occurred while sending OTP. Please try again.'
      };
    }
  }

  /**
   * Verify OTP
   */
  public static async verifyOTP(sessionId: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const sessionRef = ref(db, `otpSessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        return {
          success: false,
          message: 'Invalid or expired verification session'
        };
      }
      
      const session: OTPSession = snapshot.val();
      
      // Check if already verified
      if (session.verified) {
        return {
          success: false,
          message: 'This verification code has already been used'
        };
      }
      
      // Check expiration
      if (Date.now() > session.expiresAt) {
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.'
        };
      }
      
      // Check attempts
      if (session.attempts >= 3) {
        return {
          success: false,
          message: 'Too many incorrect attempts. Please request a new code.'
        };
      }
      
      // Verify OTP
      if (session.otp === otp) {
        // Mark as verified
        await update(sessionRef, {
          verified: true,
          verifiedAt: Date.now()
        });
        
        return {
          success: true,
          message: 'Phone number verified successfully!'
        };
      } else {
        // Increment attempts
        await update(sessionRef, {
          attempts: session.attempts + 1
        });
        
        return {
          success: false,
          message: `Incorrect verification code. ${2 - session.attempts} attempts remaining.`
        };
      }
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      return {
        success: false,
        message: 'An error occurred while verifying OTP. Please try again.'
      };
    }
  }

  /**
   * Clean up expired OTP sessions
   */
  public static async cleanupExpiredSessions(): Promise<void> {
    try {
      const sessionsRef = ref(db, 'otpSessions');
      const snapshot = await get(sessionsRef);
      
      if (!snapshot.exists()) return;
      
      const sessions = snapshot.val();
      const now = Date.now();
      
      for (const [sessionId, session] of Object.entries(sessions)) {
        const sessionData = session as OTPSession;
        if (now > sessionData.expiresAt) {
          const sessionRef = ref(db, `otpSessions/${sessionId}`);
          await set(sessionRef, null); // Delete expired session
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

export default WhatsAppOTPService;
