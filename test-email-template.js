// Test script to verify the updated email template
import fetch from 'node-fetch';

const testNewDoctorNotification = async () => {
  try {
    console.log('🧪 Testing new doctor registration email template...');
    
    const emailData = {
      to: 'saiaravindanstudiesonly@gmail.com',      subject: 'New Doctor Registration - Dr. Test (Logo Removed)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">New Doctor Registration</h1>
          <p>Hello Admin,</p>
          <p>This is a test with the logo completely removed. A new doctor has registered on SocioDent Smile and is awaiting approval.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Doctor Details:</h3>
            <p><strong>Name:</strong> Dr. Test Template</p>
            <p><strong>Email:</strong> test@example.com</p>
            <p><strong>Specialization:</strong> General Dentistry</p>
            <p><strong>Registration Number:</strong> TEST123</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Please review the doctor's credentials and approve or reject their application through the admin portal.</p>
            <div style="text-align: center; margin: 30px 0;">
            <a href="#" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review Application
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p style="margin: 0;">Best regards,<br/>
            <strong style="color: #2563eb;">The SocioDent Smile Team</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">✅ Logo Removed - Clean Template!</p>
          </div>
        </div>
      `,      text: `
        New Doctor Registration - Logo Removed

        Hello Admin,

        This is a test with the logo completely removed. A new doctor has registered on SocioDent Smile and is awaiting approval.

        Doctor Details:
        Name: Dr. Test Template
        Email: test@example.com
        Specialization: General Dentistry
        Registration Number: TEST123
        Registration Date: ${new Date().toLocaleDateString()}

        Please review the doctor's credentials and approve or reject their application through the admin portal.

        Best regards,
        The SocioDent Smile System
      `
    };

    const response = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('🎯 Check your email to see the updated template without broken images!');
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
  }
};

// Run the test
testNewDoctorNotification();
