// Test script to verify admin email notification for new doctor registration
const testAdminEmailNotification = async () => {
  console.log('🧪 Testing Admin Email Notification for New Doctor Registration...\n');
  
  try {
    // Test data for a new doctor registration
    const testDoctorData = {
      to: 'saiaravindanstudiesonly@gmail.com',
      subject: 'New Doctor Registration - Dr. Test Doctor',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://sociodent-smile-database.web.app/logo.png" alt="SocioDent Logo" style="max-width: 150px;">
          </div>
          <h1 style="color: #4a90e2; text-align: center;">New Doctor Registration</h1>
          <p>Hello Admin,</p>
          <p>A new doctor has registered on SocioDent Smile and is awaiting approval.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4a90e2;">Doctor Details</h3>
            <p><strong>Name:</strong> Dr. Test Doctor</p>
            <p><strong>Email:</strong> test.doctor@example.com</p>
            <p><strong>Specialization:</strong> General Dentistry</p>
            <p><strong>Registration/License Number:</strong> DL123456</p>
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
      `
    };

    console.log('📧 Sending test email to admin...');
    console.log('🌐 Request URL:', 'http://localhost:3000/api/email/send');
    
    const response = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDoctorData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText.substring(0, 200) + '...');

    try {
      const result = JSON.parse(responseText);
      
      if (result.success) {
        console.log('✅ Test email sent successfully!');
        console.log(`📩 Message ID: ${result.messageId}`);
        console.log(`📬 Sent to: ${testDoctorData.to}`);
        console.log('📝 Subject:', testDoctorData.subject);
        console.log('\n🎉 Admin email notification feature is working correctly!');
      } else {
        console.error('❌ Failed to send test email:', result.error);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError.message);
      console.log('Response was:', responseText);
    }

  } catch (error) {
    console.error('❌ Error testing admin email notification:', error.message);
    console.log('\n⚠️  Make sure the backend server is running on port 3000');
    console.log('   Run: npm run backend');
  }
};

// Dynamic import for fetch (Node.js 18+) or use a polyfill
const globalThis = (function() {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof global !== 'undefined') return global;
  if (typeof window !== 'undefined') return window;
  throw new Error('Unable to locate global object');
})();

if (!globalThis.fetch) {
  globalThis.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

// Run the test
testAdminEmailNotification();
