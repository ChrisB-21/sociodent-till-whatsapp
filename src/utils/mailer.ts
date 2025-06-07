import { EmailTemplates } from './emailTemplates';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email with the given options
 */
export const sendEmail = async (options: MailOptions): Promise<void> => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send email');
    }
    
    const result = await response.json();
    console.log('Email sent:', result.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export { EmailTemplates };