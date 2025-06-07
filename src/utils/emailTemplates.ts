interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const EmailTemplates = {
  otp: (
    name: string,
    otpCode: string,
    appName: string = process.env.APP_NAME || 'SocioDent Smile'
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
  
  welcome: (name: string, appName: string = process.env.APP_NAME || 'Our App'): EmailTemplate => ({
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
    appName: string = process.env.APP_NAME || 'Our App'
  ): EmailTemplate => ({
    subject: `Password Reset Request for ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for ${appName}.</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" 
             style="background-color: #2563eb; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="margin-top: 30px;">Best regards,<br/>The ${appName} Team</p>
      </div>
    `,
    text: `
      Password Reset Request\n\n
      Hello ${name},\n\n
      We received a request to reset your password for ${appName}.\n\n
      Please click the following link to reset your password:\n
      ${resetLink}\n\n
      If you didn't request this, please ignore this email.\n\n
      Best regards,\n
      The ${appName} Team
    `,
  }),
};