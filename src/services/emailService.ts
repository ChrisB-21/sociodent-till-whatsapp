// emailService.ts
// This file is now a frontend utility to call the backend email API.
// Do NOT use nodemailer or any Node.js modules here.

import { API_ENDPOINTS } from '../config/api';


// Enhanced text-based logo with better styling for maximum email compatibility
const SOCIODENT_TEXT_LOGO = `
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="display: inline-block;">
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 0.5px;">
        <span style="color: #FF4A4A;">Socio</span><span style="color: #1D4C7C;">Dent</span>
      </div>
      <div style="color: #9E9E9E; font-size: 14px; margin-top: 2px;">
        redefining oral care
      </div>
    </div>
  </div>
`;

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  consultationType: string;
  doctorName?: string;
  doctorSpecialization?: string;
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
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #4a90e2; text-align: center;">Appointment Confirmed</h1>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your dental appointment has been successfully scheduled!</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Appointment Details</h3>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>Consultation Type:</strong> ${data.consultationType}</p>
          ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}${data.doctorSpecialization ? ` (${data.doctorSpecialization})` : ''}</p>` : ''}
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
        </div>
        
        <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
        <p>Thank you for choosing SocioDent for your dental care!</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
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
        ${SOCIODENT_TEXT_LOGO}
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
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
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
 * Send new doctor registration notification email to admin via backend API
 */
export const sendNewDoctorRegistrationNotification = async (
  doctorName: string,
  doctorEmail: string,
  specialization: string,
  registrationNumber: string
): Promise<boolean> => {
  try {
    const adminEmail = 'saiaravindanstudiesonly@gmail.com';
    const subject = `New Doctor Registration - ${doctorName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #4a90e2; text-align: center;">New Doctor Registration</h1>
        <p>Hello Admin,</p>
  <p>A new doctor has registered on SocioDent and is awaiting approval.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Doctor Details</h3>
          <p><strong>Name:</strong> ${doctorName}</p>
          <p><strong>Email:</strong> ${doctorEmail}</p>
          <p><strong>Specialization:</strong> ${specialization}</p>
          <p><strong>Registration/License Number:</strong> ${registrationNumber}</p>
          <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Please review the doctor's credentials and approve or reject their application through the admin portal.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sociodent-smile-database.web.app/admin" 
             style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Application
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: adminEmail,
        subject,
        html
      })
    });
    
    if (res.ok) {
      console.log(`Admin notification sent for new doctor registration: ${doctorName}`);
      return true;
    } else {
      console.error('Failed to send admin notification email');
      return false;
    }
  } catch (error) {
    console.error(`Failed to send admin notification for doctor: ${doctorName}`, error);
    return false;
  }
};

/**
 * Enhanced admin notification for new appointments
 */
export const sendEnhancedNewAppointmentNotificationToAdmin = async (appointmentData: {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  consultationType: string;
  symptoms?: string;
  paymentAmount?: number;
  paymentMethod?: string;
}): Promise<boolean> => {
  try {
    const subject = 'New Appointment Booking - Action Required';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        
        <div style="background-color: #ffc107; color: #000; padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin: 0;">🔔 New Appointment Alert</h2>
        </div>
        
        <p>Dear Admin,</p>
        <p>A new appointment has been booked on the SocioDent platform and requires your attention for doctor assignment.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin-top: 0; color: #007bff;">Appointment Details</h3>
          <p><strong>Appointment ID:</strong> ${appointmentData.appointmentId}</p>
          <p><strong>Patient Name:</strong> ${appointmentData.patientName}</p>
          <p><strong>Patient Email:</strong> ${appointmentData.patientEmail}</p>
          <p><strong>Date:</strong> ${appointmentData.date}</p>
          <p><strong>Time:</strong> ${appointmentData.time}</p>
          <p><strong>Consultation Type:</strong> ${appointmentData.consultationType}</p>
          ${appointmentData.symptoms ? `<p><strong>Symptoms/Issue:</strong> ${appointmentData.symptoms}</p>` : ''}
          ${appointmentData.paymentAmount ? `<p><strong>Payment:</strong> ₹${appointmentData.paymentAmount} via ${appointmentData.paymentMethod || 'N/A'}</p>` : ''}
        </div>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0c5460;">Action Required:</h4>
          <ul style="margin-bottom: 0;">
            <li>Review the appointment details</li>
            <li>Assign an appropriate doctor based on symptoms and consultation type</li>
            <li>Confirm the appointment in the admin portal</li>
            <li>Ensure proper notification is sent to both doctor and patient</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sociodent-smile-database.web.app/admin" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Admin Portal</a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
          <strong>Quick Stats:</strong> This appointment is currently pending doctor assignment. 
          Please process it within 24 hours to maintain service quality.
        </p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent Admin System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    // Send to admin email (configured for SocioDent)
    const ADMIN_EMAIL = 'saiaravindanstudiesonly@gmail.com'; // Admin email address
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
};

/**
 * Send doctor assignment notification to doctor via backend API
 */
export const sendDoctorAssignmentNotificationToDoctor = async (
  doctorName: string,
  doctorEmail: string,
  patientName: string,
  patientEmail: string,
  appointmentDate: string,
  appointmentTime: string,
  consultationType: string,
  appointmentId: string
): Promise<boolean> => {
  try {
    const subject = 'You Have Been Assigned a New Patient';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #4a90e2; text-align: center;">New Patient Assigned</h1>
        <p>Dear Dr. <strong>${doctorName}</strong>,</p>
        <p>You have been assigned a new patient for consultation.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Patient Details</h3>
          <p><strong>Name:</strong> ${patientName}</p>
          <p><strong>Email:</strong> ${patientEmail}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Consultation Type:</strong> ${consultationType}</p>
          <p><strong>Appointment ID:</strong> ${appointmentId}</p>
        </div>
        
        <p>Please log in to your doctor portal to view the patient's medical history and prepare for the consultation.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sociodent-smile-database.web.app/doctor" 
             style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Patient Details
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: doctorEmail,
        subject,
        html
      })
    });
    
    if (res.ok) {
      console.log(`Doctor assignment notification sent to ${doctorEmail} successfully`);
      return true;
    } else {
      console.error(`Failed to send doctor assignment notification to ${doctorEmail}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending doctor assignment notification to doctor:', error);
    return false;
  }
};

/**
 * Send successful registration email to user
 */
export const sendUserRegistrationSuccessEmail = async (userData: {
  email: string;
  name: string;
  username: string;
}): Promise<boolean> => {
  try {
    const subject = 'Welcome to SocioDent - Registration Successful';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #4a90e2; text-align: center;">Welcome to SocioDent!</h1>
        <p>Dear <strong>${userData.name}</strong>,</p>
        <p>Congratulations! You have successfully registered with SocioDent.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Account Details</h3>
          <p><strong>Name:</strong> ${userData.name}</p>
          <p><strong>Username:</strong> ${userData.username}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>Book dental appointments with our qualified doctors</li>
          <li>Access your appointment history</li>
          <li>Receive updates about your dental care</li>
          <li>Connect with our support team</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sociodent-smile-database.web.app" style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Your Account</a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Thank you for choosing SocioDent for your dental care needs!</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userData.email,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending user registration success email:', error);
    return false;
  }
};

/**
 * Send doctor approval/rejection notification email
 */
export const sendDoctorApprovalStatusEmail = async (doctorData: {
  email: string;
  name: string;
  approved: boolean;
  rejectionReason?: string;
}): Promise<boolean> => {
  try {
    const subject = doctorData.approved ? 
      'SocioDent Doctor Registration - Approved!' : 
      'SocioDent Doctor Registration - Status Update';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: ${doctorData.approved ? '#28a745' : '#dc3545'}; text-align: center;">
          Registration ${doctorData.approved ? 'Approved' : 'Status Update'}
        </h1>
        <p>Dear Dr. <strong>${doctorData.name}</strong>,</p>
        
        ${doctorData.approved ? `
          <p>Congratulations! Your doctor registration with SocioDent has been <strong style="color: #28a745;">approved</strong>.</p>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">Welcome to SocioDent Medical Team</h3>
            <p style="margin-bottom: 0;">You can now start accepting patient appointments and providing dental care through our platform.</p>
          </div>
          
          <p>Next steps:</p>
          <ul>
            <li>Complete your profile setup</li>
            <li>Set your availability schedule</li>
            <li>Review patient appointment requests</li>
            <li>Access our doctor portal for case management</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sociodent-smile-database.web.app" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Doctor Portal</a>
          </div>
        ` : `
          <p>Thank you for your interest in joining SocioDent as a healthcare provider.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">Registration Status</h3>
            <p style="margin-bottom: 0;">Unfortunately, we are unable to approve your registration at this time.</p>
            ${doctorData.rejectionReason ? `<p><strong>Reason:</strong> ${doctorData.rejectionReason}</p>` : ''}
          </div>
          
          <p>You may reapply after addressing the concerns mentioned above. If you have any questions, please contact our support team.</p>
        `}
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>SocioDent Team</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: doctorData.email,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending doctor approval status email:', error);
    return false;
  }
};

/**
 * Send enhanced doctor assignment notification to patient via backend API
 */
export const sendDoctorAssignmentEmailToPatient = async (appointmentData: {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialization?: string;
  date: string;
  time: string;
  consultationType: string;
  appointmentId: string;
  doctorExperience?: string;
  clinicAddress?: string;
}): Promise<boolean> => {
  try {
    const subject = 'Doctor Assigned - Your SocioDent Appointment Confirmed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        
        <div style="background-color: #d4edda; color: #155724; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin: 0;">✅ Doctor Assigned Successfully!</h2>
        </div>
        
        <p>Dear <strong>${appointmentData.patientName}</strong>,</p>
        <p>Great news! A qualified doctor has been assigned to your dental appointment. Your consultation is now confirmed.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #28a745;">👨‍⚕️ Your Doctor Details</h3>
          <p><strong>Doctor:</strong> ${appointmentData.doctorName}</p>
          ${appointmentData.doctorSpecialization ? `<p><strong>Specialization:</strong> ${appointmentData.doctorSpecialization}</p>` : ''}
          ${appointmentData.doctorExperience ? `<p><strong>Experience:</strong> ${appointmentData.doctorExperience}</p>` : ''}
        </div>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0c5460;">📅 Appointment Information</h3>
          <p><strong>Date:</strong> ${appointmentData.date}</p>
          <p><strong>Time:</strong> ${appointmentData.time}</p>
          <p><strong>Type:</strong> ${appointmentData.consultationType}</p>
          <p><strong>Appointment ID:</strong> ${appointmentData.appointmentId}</p>
          ${appointmentData.clinicAddress ? `<p><strong>Location:</strong> ${appointmentData.clinicAddress}</p>` : ''}
        </div>
        
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">📋 Before Your Appointment:</h4>
          <ul style="margin-bottom: 0;">
            <li>Arrive 15 minutes early for registration</li>
            <li>Bring a valid ID and any relevant medical records</li>
            <li>If this is a virtual consultation, ensure you have a stable internet connection</li>
            <li>Prepare a list of your current medications and allergies</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sociodent-smile-database.web.app/my-appointments" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">View My Appointments</a>
          <a href="https://sociodent-smile-database.web.app/contact" style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Support</a>
        </div>
        
        <p>If you need to reschedule or have any questions, please contact our support team at least 24 hours before your appointment.</p>
        <p>We look forward to providing you with excellent dental care!</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: appointmentData.patientEmail,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending doctor assignment email to patient:', error);
    return false;
  }
};

/**
 * Send admin notification for new user registration (all users, not just doctors)
 */
export const sendNewUserRegistrationNotificationToAdmin = async (userData: {
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
  registrationDate: string;
}): Promise<boolean> => {
  try {
    const subject = `New ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} Registration - ${userData.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #007bff; text-align: center;">🎉 New ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} Registration</h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">User Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Name:</td>
              <td style="padding: 8px 0; color: #6c757d;">${userData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Email:</td>
              <td style="padding: 8px 0; color: #6c757d;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Role:</td>
              <td style="padding: 8px 0; color: #6c757d;">${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</td>
            </tr>
            ${userData.phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Phone:</td>
              <td style="padding: 8px 0; color: #6c757d;">${userData.phone}</td>
            </tr>
            ` : ''}
            ${userData.location ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Location:</td>
              <td style="padding: 8px 0; color: #6c757d;">${userData.location}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Registration Date:</td>
              <td style="padding: 8px 0; color: #6c757d;">${new Date(userData.registrationDate).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        ${userData.role === 'doctor' ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">⚠️ Action Required</h4>
          <p style="margin-bottom: 0; color: #856404;">This doctor registration requires approval. Please review their credentials and approve or reject their application.</p>
        </div>
        ` : `
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h4 style="margin-top: 0; color: #155724;">✅ Registration Complete</h4>
          <p style="margin-bottom: 0; color: #155724;">This user has been automatically activated and can access the platform.</p>
        </div>
        `}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sociodent-smile-database.web.app/admin" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">View Admin Portal</a>
          <a href="https://sociodent-smile-database.web.app/admin/users" style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Users</a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">This is an automated notification. Please do not reply to this email.</p>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SocioDent Admin System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const ADMIN_EMAIL = 'saiaravindanstudiesonly@gmail.com'; // Admin email address
    
    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject,
        html
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending admin notification for new user registration:', error);
    return false;
  }
};

/**
 * Send organization booking notification to admin
 */
export const sendOrganizationBookingNotification = async (organizationData: any): Promise<boolean> => {
  try {
    const subject = '🏢 NEW ORGANIZATION BOOKING REQUEST - SocioDent';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        ${SOCIODENT_TEXT_LOGO}
        
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h1 style="color: #1e40af; text-align: center; margin-bottom: 30px; font-size: 28px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px;">
            🏢 New Organization Booking Request
          </h1>
          
          <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-left: 5px solid #3b82f6; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; margin-top: 0; font-size: 18px;">📋 Request Overview</h2>
            <p style="margin: 5px 0; font-size: 16px; color: #374151;">
              A new organization has submitted a group dental appointment booking request for elderly or persons with disabilities.
            </p>
            <p style="margin: 5px 0; font-weight: bold; color: #dc2626;">
              ⏰ Action Required: Please contact within 24-48 hours
            </p>
          </div>
        </div>

        <!-- Contact Person Details -->
        <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); margin-bottom: 20px;">
          <h3 style="color: #059669; margin-top: 0; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            👤 Contact Person Information
          </h3>
          <div style="display: grid; gap: 12px; margin-top: 15px;">
            <div style="display: flex; align-items: center; padding: 10px; background: #f0fdf4; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 120px;">Full Name:</span>
              <span style="color: #059669; font-size: 16px;">${organizationData.contactPersonName}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #f0fdf4; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 120px;">Designation:</span>
              <span style="color: #059669; font-size: 16px;">${organizationData.designation}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #f0fdf4; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 120px;">Email:</span>
              <span style="color: #3b82f6; font-size: 16px;">
                <a href="mailto:${organizationData.contactEmail}" style="color: #3b82f6; text-decoration: none;">
                  ${organizationData.contactEmail}
                </a>
              </span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #f0fdf4; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 120px;">Phone:</span>
              <span style="color: #059669; font-size: 16px;">
                <a href="tel:${organizationData.contactPhone}" style="color: #059669; text-decoration: none;">
                  ${organizationData.contactPhone}
                </a>
              </span>
            </div>
          </div>
        </div>

        <!-- Organization Details -->
        <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); margin-bottom: 20px;">
          <h3 style="color: #7c3aed; margin-top: 0; font-size: 20px; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px;">
            🏢 Organization Details
          </h3>
          <div style="display: grid; gap: 12px; margin-top: 15px;">
            <div style="display: flex; align-items: center; padding: 10px; background: #faf5ff; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 150px;">Organization Name:</span>
              <span style="color: #7c3aed; font-size: 16px; font-weight: 600;">${organizationData.organizationName}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #faf5ff; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 150px;">Organization Type:</span>
              <span style="color: #7c3aed; font-size: 16px;">${organizationData.organizationType}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #faf5ff; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 150px;">Location:</span>
              <span style="color: #7c3aed; font-size: 16px;">${organizationData.city}, ${organizationData.state}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #faf5ff; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 150px;">Beneficiaries:</span>
              <span style="color: #7c3aed; font-size: 16px; font-weight: 600;">${organizationData.numberOfBeneficiaries} people</span>
            </div>
          </div>
        </div>

        <!-- Appointment Preferences -->
        <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); margin-bottom: 20px;">
          <h3 style="color: #dc2626; margin-top: 0; font-size: 20px; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">
            📅 Appointment Preferences
          </h3>
          <div style="display: grid; gap: 12px; margin-top: 15px;">
            <div style="display: flex; align-items: center; padding: 10px; background: #fef2f2; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 130px;">Preferred Date:</span>
              <span style="color: #dc2626; font-size: 16px;">${organizationData.preferredDate || 'Flexible / To be discussed'}</span>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; background: #fef2f2; border-radius: 8px;">
              <span style="font-weight: bold; color: #374151; min-width: 130px;">Preferred Time:</span>
              <span style="color: #dc2626; font-size: 16px;">${organizationData.preferredTime || 'Flexible / To be discussed'}</span>
            </div>
          </div>
        </div>

        <!-- Requirements -->
        <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); margin-bottom: 20px;">
          <h3 style="color: #ea580c; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            📝 Detailed Requirements
          </h3>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 20px; margin-top: 15px;">
            <div style="color: #9a3412; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${organizationData.requirement}</div>
          </div>
          ${organizationData.additionalNotes ? `
            <h4 style="color: #ea580c; margin: 20px 0 10px 0;">Additional Notes:</h4>
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 20px;">
              <div style="color: #9a3412; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${organizationData.additionalNotes}</div>
            </div>
          ` : ''}
        </div>

        <!-- Action Required -->
        <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 15px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="color: #92400e; margin-top: 0; font-size: 22px;">
            ⚡ IMMEDIATE ACTION REQUIRED
          </h3>
          <p style="margin-bottom: 25px; color: #451a03; font-size: 16px; font-weight: 500;">
            Please contact this organization within 24-48 hours to discuss requirements and schedule the group appointment.
          </p>
          <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 20px 0;">
            <a href="mailto:${organizationData.contactEmail}" 
               style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; transition: all 0.3s;">
              📧 Send Email
            </a>
            <a href="tel:${organizationData.contactPhone}" 
               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px; transition: all 0.3s;">
              📞 Call Now
            </a>
          </div>
          <p style="margin: 20px 0 5px 0; color: #78350f; font-size: 14px;">
            <strong>Submitted:</strong> ${new Date(organizationData.submittedAt).toLocaleString()}
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 25px; background: #f1f5f9; border-radius: 15px; border-top: 3px solid #3b82f6;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            This is an automated notification from SocioDent Admin Panel.<br>
            For support, contact: admin@sociodent.com | +91-XXXX-XXXX
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
            © 2025 SocioDent - Redefining Oral Care for All
          </p>
        </div>
      </div>
    `;

    const ADMIN_EMAIL = 'saiaravindanstudiesonly@gmail.com'; // Admin email address
    
    const response = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Organization booking notification sent successfully to admin');
    return true;
  } catch (error) {
    console.error('Error sending organization booking notification:', error);
    return false;
  }
};

/**
 * Send confirmation email to organization after booking submission
 */
export const sendOrganizationBookingConfirmation = async (organizationData: any): Promise<boolean> => {
  try {
    const subject = '✅ Booking Request Received - SocioDent';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        ${SOCIODENT_TEXT_LOGO}
        
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h1 style="color: #10b981; text-align: center; margin-bottom: 25px; font-size: 26px;">
            ✅ Your Booking Request Has Been Received!
          </h1>
          
          <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-left: 5px solid #10b981; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 16px; color: #047857;">
              Dear <strong>${organizationData.contactPersonName}</strong>,
            </p>
            <p style="margin: 15px 0 5px 0; font-size: 16px; color: #047857;">
              Thank you for submitting a group dental appointment request for <strong>${organizationData.organizationName}</strong>. 
              We have successfully received your booking request and our team will review it shortly.
            </p>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">📋 Your Request Summary</h3>
            <ul style="color: #374151; line-height: 1.8;">
              <li><strong>Organization:</strong> ${organizationData.organizationName}</li>
              <li><strong>Type:</strong> ${organizationData.organizationType}</li>
              <li><strong>Number of Beneficiaries:</strong> ${organizationData.numberOfBeneficiaries}</li>
              <li><strong>Preferred Date:</strong> ${organizationData.preferredDate || 'To be discussed'}</li>
              <li><strong>Preferred Time:</strong> ${organizationData.preferredTime || 'To be discussed'}</li>
              <li><strong>Location:</strong> ${organizationData.city}, ${organizationData.state}</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 22px;">
              ⏰ What Happens Next?
            </h3>
            <p style="color: #78350f; margin: 10px 0;">
              Our team will contact you within <strong>24-48 hours</strong> to discuss your requirements and schedule the group dental appointment.
            </p>
            <p style="color: #78350f; margin: 10px 0;">
              We will coordinate with you to find the best time that works for your organization and our dental team.
            </p>
          </div>

          <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">📞 Contact Information</h3>
            <p style="color: #64748b; margin: 5px 0;">If you have any questions or need to make changes to your request, please contact us:</p>
            <p style="color: #374151; margin: 10px 0;">
              <strong>Email:</strong> admin@sociodent.com<br>
              <strong>Phone:</strong> +91-XXXX-XXXX<br>
              <strong>Reference ID:</strong> ORG-${Date.now()}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <p style="color: #10b981; font-size: 18px; font-weight: bold; margin: 10px 0;">
              Thank you for choosing SocioDent!
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
              We look forward to serving your organization and providing quality dental care.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 15px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated confirmation from SocioDent.<br>
            © 2025 SocioDent - Redefining Oral Care for All
          </p>
        </div>
      </div>
    `;

    const response = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: organizationData.contactEmail,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Organization booking confirmation sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending organization booking confirmation:', error);
    return false;
  }
};

/**
 * Send appointment cancellation notification emails to patient, doctor, and admin
 */
export const sendAppointmentCancellationEmails = async (data: {
  patientName: string;
  patientEmail: string;
  doctorEmail?: string;
  adminEmail?: string;
  date: string;
  time: string;
  appointmentId: string;
  doctorName?: string;
  consultationType?: string;
  cancellationReason?: string;
}): Promise<boolean> => {
  try {
    let emailsSent = 0;
    const emailPromises = [];

    // Email to patient
    const patientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #dc3545; text-align: center;">Appointment Cancelled</h1>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your dental appointment has been successfully cancelled.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Cancelled Appointment Details</h3>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}</p>` : ''}
          ${data.consultationType ? `<p><strong>Type:</strong> ${data.consultationType}</p>` : ''}
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
        </div>

        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0c5460;">
          <h4 style="margin-top: 0; color: #0c5460;">What's Next?</h4>
          <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
            <li>If you paid for this appointment, our team will process the refund within 3-5 business days</li>
            <li>You can book a new appointment anytime through our website</li>
            <li>For any questions, please contact our support team</li>
          </ul>
        </div>

        <p>We're sorry to see your appointment cancelled. We hope to serve you again soon!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Thank you for choosing SocioDent!<br>
            <strong>SocioDent Team</strong><br>
            📧 Email: support@sociodent.com<br>
            📞 Phone: +91-XXX-XXX-XXXX
          </p>
        </div>
      </div>
    `;

    emailPromises.push(
      fetch(API_ENDPOINTS.EMAIL.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.patientEmail,
          subject: 'Appointment Cancelled - SocioDent',
          html: patientEmailHtml
        })
      })
    );

    // Email to doctor (if doctor email available)
    if (data.doctorEmail) {
      const doctorEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          ${SOCIODENT_TEXT_LOGO}
          <h1 style="color: #dc3545; text-align: center;">Patient Appointment Cancelled</h1>
          <p>Dear Doctor,</p>
          <p>A patient has cancelled their appointment with you.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">Cancelled Appointment Details</h3>
            <p><strong>Patient:</strong> ${data.patientName}</p>
            <p><strong>Patient Email:</strong> ${data.patientEmail}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            ${data.consultationType ? `<p><strong>Type:</strong> ${data.consultationType}</p>` : ''}
            <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
            ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
          </div>

          <p>This time slot is now available for other patients.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              <strong>SocioDent Admin Team</strong>
            </p>
          </div>
        </div>
      `;

      emailPromises.push(
        fetch(API_ENDPOINTS.EMAIL.SEND, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.doctorEmail,
            subject: 'Patient Appointment Cancelled - SocioDent',
            html: doctorEmailHtml
          })
        })
      );
    }

    // Email to admin
    const adminEmail = data.adminEmail || 'saiaravindanstudiesonly@gmail.com';
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #dc3545; text-align: center;">Appointment Cancellation Alert</h1>
        <p>Dear Admin,</p>
        <p>An appointment has been cancelled by the patient.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Cancelled Appointment Details</h3>
          <p><strong>Patient:</strong> ${data.patientName}</p>
          <p><strong>Patient Email:</strong> ${data.patientEmail}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}</p>` : ''}
          ${data.consultationType ? `<p><strong>Type:</strong> ${data.consultationType}</p>` : ''}
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">Action Required:</h4>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Process refund if payment was made</li>
            <li>Update appointment status in admin portal</li>
            <li>Follow up with patient if needed</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>SocioDent System</strong>
          </p>
        </div>
      </div>
    `;

    emailPromises.push(
      fetch(API_ENDPOINTS.EMAIL.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmail,
          subject: 'Appointment Cancellation Alert - SocioDent',
          html: adminEmailHtml
        })
      })
    );

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.ok) {
        emailsSent++;
      }
    });

    return emailsSent > 0; // Return true if at least one email was sent
  } catch (error) {
    console.error('Error sending appointment cancellation emails:', error);
    return false;
  }
};

/**
 * Send meeting link notification email to patient via backend API
 */
export const sendMeetingLinkEmail = async (data: {
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  meetingLink: string;
  doctorName?: string;
  consultationType?: string;
  appointmentId: string;
}): Promise<boolean> => {
  try {
    const subject = 'Virtual Consultation Meeting Link - SocioDent';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${SOCIODENT_TEXT_LOGO}
        <h1 style="color: #4a90e2; text-align: center;">Virtual Consultation Meeting Link</h1>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your doctor has added a meeting link for your upcoming virtual consultation!</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a90e2;">Consultation Details</h3>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          ${data.doctorName ? `<p><strong>Doctor:</strong> ${data.doctorName}</p>` : ''}
          ${data.consultationType ? `<p><strong>Type:</strong> ${data.consultationType}</p>` : ''}
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
        </div>

        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a90e2;">
          <h3 style="margin-top: 0; color: #4a90e2;">🎥 Join Your Virtual Consultation</h3>
          <p style="margin-bottom: 15px;">Click the button below to join your virtual consultation:</p>
          <div style="text-align: center;">
            <a href="${data.meetingLink}" 
               style="display: inline-block; background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Join Meeting Now
            </a>
          </div>
          <p style="margin-top: 15px; font-size: 14px; color: #666;">
            <strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #4a90e2;">${data.meetingLink}</a>
          </p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">📋 Important Instructions:</h4>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Please join the meeting 5-10 minutes early to test your audio and video</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Find a quiet, well-lit space for the consultation</li>
            <li>Have your medical history and any relevant documents ready</li>
            <li>If you face any technical issues, please contact our support team</li>
          </ul>
        </div>

        <p>If you need to reschedule or have any questions, please contact us immediately.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Thank you for choosing SocioDent for your dental care!<br>
            <strong>SocioDent Team</strong><br>
            📧 Email: support@sociodent.com<br>
            📞 Phone: +91-XXX-XXX-XXXX
          </p>
        </div>
      </div>
    `;

    const res = await fetch(API_ENDPOINTS.EMAIL.SEND, {
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
    console.error('Error sending meeting link email:', error);
    return false;
  }
};

// Export the email service
export const emailService = {
  sendAppointmentConfirmationEmail,
  sendDoctorAssignmentEmail,
  sendNewDoctorRegistrationNotification,
  sendDoctorAssignmentNotificationToDoctor,
  sendUserRegistrationSuccessEmail,
  sendDoctorApprovalStatusEmail,
  sendEnhancedNewAppointmentNotificationToAdmin,
  sendDoctorAssignmentEmailToPatient,
  sendNewUserRegistrationNotificationToAdmin,
  sendOrganizationBookingNotification,
  sendOrganizationBookingConfirmation,
  sendAppointmentCancellationEmails,
  sendMeetingLinkEmail
};

export default emailService;
