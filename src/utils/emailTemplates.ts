interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const EmailTemplates = {
  otp: (
    name: string,
    otpCode: string,
  appName: string = process.env.APP_NAME || 'SocioDent'
  ): EmailTemplate => ({
    subject: `Your Login Verification Code - ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Login Verification Code</h1>
        <p>Hello ${name},</p>
        <p>Your verification code for ${appName} is:</p>
        <div style="text-align: center; margin: 25px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            ${otpCode}
          </div>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p style="margin-top: 30px;">Best regards,<br/>The ${appName} Team</p>
      </div>
    `,
    text: `
      Login Verification Code\n\n
      Hello ${name},\n\n
      Your verification code for ${appName} is: ${otpCode}\n\n
      This code will expire in 10 minutes.\n\n
      If you did not request this code, please ignore this email.\n\n
      Best regards,\n
      The ${appName} Team
    `,
  }),
  
  welcome: (name: string, appName: string = process.env.APP_NAME || 'SocioDent'): EmailTemplate => ({
    subject: `Welcome to ${appName}, ${name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to ${appName}</h1>
        <p>Hello ${name},</p>
        <p>Thank you for joining ${appName}. We're excited to have you on board!</p>
        <p>Get started by exploring our platform.</p>
        <p style="margin-top: 30px;">Best regards,<br/>The ${appName} Team</p>
      </div>
    `,
    text: `
      Welcome to ${appName}, ${name}!\n\n
      Thank you for joining ${appName}. We're excited to have you on board!\n\n
      Get started by exploring our platform.\n\n
      Best regards,\n
      The ${appName} Team
    `,
  }),

  passwordReset: (
    name: string,
    resetLink: string,
    appName: string = process.env.APP_NAME || 'SocioDent'
  ): EmailTemplate => ({
    subject: `Reset your password for ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #f8fafc; padding: 24px 0 12px 0; text-align: center;">
          <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 120px; margin-bottom: 8px;" />
          <h1 style="color: #2563eb; font-size: 2rem; margin: 0;">SocioDent</h1>
        </div>
        <div style="padding: 32px 24px 24px 24px;">
          <h2 style="color: #2563eb; margin-top: 0;">Reset your password</h2>
          <p style="font-size: 1.1rem; color: #222;">Hello ${name || ''},</p>
          <p style="color: #333;">We received a request to reset your password for <b>${appName}</b>.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}"
               style="background-color: #2563eb; color: white; padding: 14px 32px; font-size: 1.1rem; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #555;">If you didn’t ask to reset your password, you can ignore this email.</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p style="margin: 0;">Best regards,<br/>
            <strong style="color: #2563eb;">The SocioDent Team</strong></p>
          </div>
        </div>
      </div>
    `,
    text: `
      Reset your password for ${appName}\n\n
      Hello ${name || ''},\n\n
      We received a request to reset your password for ${appName}.\n\n
      Please click the following link to reset your password:\n
      ${resetLink}\n\n
      If you didn’t ask to reset your password, you can ignore this email.\n\n
      Best regards,\n
  The SocioDent Team
    `,
  }),

  newDoctorRegistration: (
    doctorName: string,
    doctorEmail: string,
    specialization: string,
    registrationNumber: string,
    appName: string = process.env.APP_NAME || 'SocioDent'
  ): EmailTemplate => ({
    subject: `New Doctor Registration - ${doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">New Doctor Registration</h1>
        <p>Hello Admin,</p>
        <p>A new doctor has registered on ${appName} and is awaiting approval.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Doctor Details:</h3>
          <p><strong>Name:</strong> ${doctorName}</p>
          <p><strong>Email:</strong> ${doctorEmail}</p>
          <p><strong>Specialization:</strong> ${specialization}</p>
          <p><strong>Registration Number:</strong> ${registrationNumber}</p>
          <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Please review the doctor's credentials and approve or reject their application through the admin portal.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://your-app-url.com'}/admin" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Review Application
          </a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
          <p style="margin: 0;">Best regards,<br/>
          <strong style="color: #2563eb;">The ${appName} Team</strong></p>
        </div>
      </div>
    `,
    text: `
      New Doctor Registration\n\n
      Hello Admin,\n\n
      A new doctor has registered on ${appName} and is awaiting approval.\n\n
      Doctor Details:\n
      Name: ${doctorName}\n
      Email: ${doctorEmail}\n
      Specialization: ${specialization}\n
      Registration Number: ${registrationNumber}\n
      Registration Date: ${new Date().toLocaleDateString()}\n\n
      Please review the doctor's credentials and approve or reject their application through the admin portal.\n\n
      Admin Portal: ${process.env.APP_URL || 'https://your-app-url.com'}/admin\n\n
      Best regards,\n
      The ${appName} System
    `,
  }),
  
  // Add new templates for admin and doctor notifications
  newAppointmentNotification: (
    patientName: string,
    patientEmail: string,
    appointmentDate: string,
    appointmentTime: string,
    consultationType: string,
    appointmentId: string,
    appName: string = process.env.APP_NAME || 'SocioDent Smile'
  ): EmailTemplate => ({
    subject: `New Appointment Created - ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #f8fafc; padding: 24px 0 12px 0; text-align: center;">
          <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 120px; margin-bottom: 8px;" />
          <h1 style="color: #2563eb; font-size: 2rem; margin: 0;">SocioDent</h1>
        </div>
        <div style="padding: 32px 24px 24px 24px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Appointment Alert</h2>
          <p style="font-size: 1.1rem; color: #222;">Hello Admin,</p>
          <p style="color: #333;">A new appointment has been booked on <b>${appName}</b> and requires doctor assignment.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Appointment Details:</h3>
            <p><strong>Patient Name:</strong> ${patientName}</p>
            <p><strong>Patient Email:</strong> ${patientEmail}</p>
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time:</strong> ${appointmentTime}</p>
            <p><strong>Consultation Type:</strong> ${consultationType}</p>
            <p><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Status:</strong> Pending Doctor Assignment</p>
          </div>
          
          <p>Please assign a suitable doctor to this appointment through the admin portal.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://your-app-url.com'}/admin" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Manage Appointments
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p style="margin: 0;">Best regards,<br/>
            <strong style="color: #2563eb;">The ${appName} System</strong></p>
          </div>
        </div>
      </div>
    `,
    text: `
      New Appointment Alert\n\n
      Hello Admin,\n\n
      A new appointment has been booked on ${appName} and requires doctor assignment.\n\n
      Appointment Details:\n
      Patient Name: ${patientName}\n
      Patient Email: ${patientEmail}\n
      Date: ${appointmentDate}\n
      Time: ${appointmentTime}\n
      Consultation Type: ${consultationType}\n
      Appointment ID: ${appointmentId}\n
      Status: Pending Doctor Assignment\n\n
      Please assign a suitable doctor to this appointment through the admin portal.\n\n
      Admin Portal: ${process.env.APP_URL || 'https://your-app-url.com'}/admin\n\n
      Best regards,\n
      The ${appName} System
    `,
  }),

  doctorAssignmentNotification: (
    doctorName: string,
    patientName: string,
    patientEmail: string,
    appointmentDate: string,
    appointmentTime: string,
    consultationType: string,
    appointmentId: string,
    appName: string = process.env.APP_NAME || 'SocioDent Smile'
  ): EmailTemplate => ({
    subject: `New Patient Assignment - ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #f8fafc; padding: 24px 0 12px 0; text-align: center;">
          <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 120px; margin-bottom: 8px;" />
          <h1 style="color: #2563eb; font-size: 2rem; margin: 0;">SocioDent</h1>
        </div>
        <div style="padding: 32px 24px 24px 24px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Patient Assigned</h2>
          <p style="font-size: 1.1rem; color: #222;">Hello Dr. ${doctorName},</p>
          <p style="color: #333;">You have been assigned to a new patient appointment on <b>${appName}</b>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Appointment Details:</h3>
            <p><strong>Patient Name:</strong> ${patientName}</p>
            <p><strong>Patient Email:</strong> ${patientEmail}</p>
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time:</strong> ${appointmentTime}</p>
            <p><strong>Consultation Type:</strong> ${consultationType}</p>
            <p><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          
          <p>Please prepare for the appointment and contact the patient if needed. You can view more details and manage your appointments through the doctor portal.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://your-app-url.com'}/doctor-portal" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Doctor Portal
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p style="margin: 0;">Best regards,<br/>
            <strong style="color: #2563eb;">The ${appName} Team</strong></p>
          </div>
        </div>
      </div>
    `,
    text: `
      New Patient Assigned\n\n
      Hello Dr. ${doctorName},\n\n
      You have been assigned to a new patient appointment on ${appName}.\n\n
      Appointment Details:\n
      Patient Name: ${patientName}\n
      Patient Email: ${patientEmail}\n
      Date: ${appointmentDate}\n
      Time: ${appointmentTime}\n
      Consultation Type: ${consultationType}\n
      Appointment ID: ${appointmentId}\n
      Status: Confirmed\n\n
      Please prepare for the appointment and contact the patient if needed. You can view more details and manage your appointments through the doctor portal.\n\n
      Doctor Portal: ${process.env.APP_URL || 'https://your-app-url.com'}/doctor-portal\n\n
      Best regards,\n
      The ${appName} Team
    `,
  }),
};