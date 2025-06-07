// Simple test script to verify email sending functionality
import fetch from 'node-fetch';

async function testSendEmail() {
  try {
    const response = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'rsreeram@Rs-MacBook-Air-2.local', // Replace with your email
        subject: 'SocioDent Email Test',
        html: '<h1>Test Email</h1><p>This is a test email from SocioDent dental appointment app.</p>'
      })
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('Email sent successfully!');
    } else {
      console.error('Failed to send email:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSendEmail();
