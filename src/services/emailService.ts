// emailService.ts
// This file is now a frontend utility to call the backend email API.
// Do NOT use nodemailer or any Node.js modules here.

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  consultationType: string;
  doctorName?: string;
  doctorSpecialization?: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentId?: string;
  appointmentId: string;
}

/**
 * Send appointment confirmation email to patient via backend API
 */
export const sendAppointmentConfirmationEmail = async (data: AppointmentEmailData): Promise<boolean> => {
  try {
    const subject = 'Your Dental Appointment Confirmation';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #4a90e2; text-align: center;">Appointment Confirmed</h1>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your dental appointment has been successfully scheduled!</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Appointment Details</h3>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Consultation Type:</strong> ${data.consultationType}</p>
          ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}${data.doctorSpecialization ? ` (${data.doctorSpecialization})` : ''}</p>` : ''}
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Amount Paid:</strong> ₹${data.paymentAmount}</p>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
        </div>
        
        <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
        <p>Thank you for choosing SocioDent for your dental care!</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    const res = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.patientEmail,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    return false;
  }
};

/**
 * Send doctor assignment notification to patient via backend API
 */
export const sendDoctorAssignmentEmail = async (data: AppointmentEmailData): Promise<boolean> => {
  try {
    if (!data.doctorName) {
      console.error('Cannot send doctor assignment email: No doctor name provided');
      return false;
    }

    const subject = 'Doctor Assigned to Your Dental Appointment';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #4a90e2; text-align: center;">Doctor Assigned</h1>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>We're pleased to inform you that a doctor has been assigned to your upcoming dental appointment.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Doctor Details</h3>
          <p><strong>Doctor:</strong> ${data.doctorName}${data.doctorSpecialization ? ` (${data.doctorSpecialization})` : ''}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
        </div>
        
        <p>If you have any questions or need to update your appointment, please contact our support team.</p>
        <p>We look forward to providing you with excellent dental care!</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    const res = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.patientEmail,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending doctor assignment email:', error);
    return false;
  }
};

/**
 * Send payment receipt email to patient via backend API
 */
export const sendPaymentReceiptEmail = async (data: AppointmentEmailData): Promise<boolean> => {
  try {
    if (!data.paymentId) {
      console.error('Cannot send payment receipt email: No payment ID provided');
      return false;
    }

    const subject = 'SocioDent Payment Receipt';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #4a90e2; text-align: center;">Payment Receipt</h1>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Thank you for your payment. Your transaction has been completed successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Payment Details</h3>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Amount Paid:</strong> ₹${data.paymentAmount}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Date of Payment:</strong> ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
        </div>
        
        <p>This receipt serves as proof of payment for your dental appointment. Please keep it for your records.</p>
        <p>If you have any questions regarding your payment, please contact our billing department.</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    const res = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.patientEmail,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    return false;
  }
};

// Export the email service
export const emailService = {
  sendAppointmentConfirmationEmail,
  sendDoctorAssignmentEmail,
  sendPaymentReceiptEmail
};

export default emailService;
