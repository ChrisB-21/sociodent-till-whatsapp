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
    const html = `<h1>Appointment Confirmed</h1>
      <p>Dear ${data.patientName}, your appointment is confirmed for ${data.date} at ${data.time}.</p>
      ${data.doctorName ? `<p>Your doctor: <b>${data.doctorName}</b></p>` : ''}`;
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
    const html = `<h1>Doctor Assigned</h1>
      <p>Dear ${data.patientName}, a doctor has been assigned to your appointment.</p>
      <p>Doctor: <b>${data.doctorName} ${data.doctorSpecialization ? `(${data.doctorSpecialization})` : ''}</b></p>
      <p>Appointment ID: ${data.appointmentId}</p>`;
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
    const html = `<h1>Payment Receipt</h1>
      <p>Dear ${data.patientName}, thank you for your payment. Here are the receipt details:</p>
      <p>Payment ID: ${data.paymentId}</p>
      <p>Amount Paid: ₹${data.paymentAmount}</p>
      <p>Payment Method: ${data.paymentMethod}</p>
      <p>Date of Payment: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
      <p>Appointment ID: ${data.appointmentId}</p>`;
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
