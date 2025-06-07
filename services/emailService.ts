import { sendEmail, EmailTemplates } from '@/utils/mailer';

export class EmailService {
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const template = EmailTemplates.welcome(name);
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error(`Failed to send welcome email to ${email}`, error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<void> {
    try {
      const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      const template = EmailTemplates.passwordReset(name, resetLink);
      
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }

  static async sendOtpEmail(
    email: string,
    name: string,
    otpCode: string
  ): Promise<void> {
    try {
      const template = EmailTemplates.otp(name, otpCode);
      
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }
}