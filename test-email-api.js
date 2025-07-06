// Test script to verify email functionality
const testEmailAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'saiaravindanstudiesonly@gmail.com',
        subject: 'SocioDent Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">Email System Test</h1>
            <p>This is a test email to verify that the SocioDent email system is working correctly.</p>
            <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
            <p>If you received this email, the system is functioning properly!</p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log('✅ Test email sent successfully!');
      console.log('Email API is working correctly.');
    } else {
      console.log('❌ Test email failed to send.');
      console.log('Response status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error connecting to email API:', error.message);
    console.log('Make sure the backend server is running on http://localhost:3000');
  }
};

// Run the test
testEmailAPI();
