// Test WhatsApp Welcome Message Integration
// Run this with: node test-whatsapp-welcome.js

import WhatsAppWelcomeService from './src/services/whatsappWelcomeService.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testWhatsAppWelcome() {
  console.log('🔄 Testing WhatsApp Welcome Message Integration...\n');

  // Test configuration
  console.log('1. Testing WhatsApp configuration...');
  const configTest = await WhatsAppWelcomeService.testConfiguration();
  
  if (configTest.success) {
    console.log('✅ WhatsApp configuration is working!\n');
  } else {
    console.log(`❌ WhatsApp configuration failed: ${configTest.error}\n`);
    return;
  }

  // Test user welcome message
  console.log('2. Testing user welcome message...');
  const userTest = await WhatsAppWelcomeService.sendUserWelcomeMessage({
    name: 'Test User',
    phone: '917042469530', // Your test number
    role: 'user'
  });

  if (userTest.success) {
    console.log(`✅ User welcome message sent! Message ID: ${userTest.messageId}`);
  } else {
    console.log(`❌ User welcome message failed: ${userTest.error}`);
  }

  // Test doctor welcome message
  console.log('\n3. Testing doctor welcome message...');
  const doctorTest = await WhatsAppWelcomeService.sendDoctorWelcomeMessage({
    name: 'Dr. Test',
    phone: '917042469530', // Your test number
    role: 'doctor'
  });

  if (doctorTest.success) {
    console.log(`✅ Doctor welcome message sent! Message ID: ${doctorTest.messageId}`);
  } else {
    console.log(`❌ Doctor welcome message failed: ${doctorTest.error}`);
  }

  // Test simple hello world
  console.log('\n4. Testing simple hello_world template...');
  const simpleTest = await WhatsAppWelcomeService.sendSimpleWelcome('917042469530', 'Test User');

  if (simpleTest.success) {
    console.log(`✅ Simple hello_world message sent! Message ID: ${simpleTest.messageId}`);
  } else {
    console.log(`❌ Simple hello_world message failed: ${simpleTest.error}`);
  }

  console.log('\n🎉 WhatsApp Welcome Message Test Complete!');
}

// Test backend API endpoint
async function testBackendAPI() {
  console.log('\n🔄 Testing Backend WhatsApp API...\n');

  try {
    // Test status endpoint
    console.log('1. Checking backend status...');
    const statusResponse = await fetch('http://localhost:3000/api/whatsapp/status');
    const statusData = await statusResponse.json();
    
    console.log('Backend WhatsApp Status:', statusData);

    if (!statusData.configured) {
      console.log('❌ Backend WhatsApp not configured');
      return;
    }

    // Test welcome message via backend
    console.log('\n2. Testing welcome message via backend...');
    const welcomeResponse = await fetch('http://localhost:3000/api/whatsapp/send-welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Backend Test User',
        phone: '917042469530',
        role: 'user'
      })
    });

    const welcomeData = await welcomeResponse.json();
    
    if (welcomeData.success) {
      console.log(`✅ Backend welcome message sent! Message ID: ${welcomeData.messageId}`);
    } else {
      console.log(`❌ Backend welcome message failed: ${welcomeData.error}`);
    }

  } catch (error) {
    console.error('❌ Backend API test failed:', error.message);
    console.log('Make sure the backend server is running on http://localhost:3000');
  }
}

// Run tests
async function runAllTests() {
  try {
    await testWhatsAppWelcome();
    await testBackendAPI();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Check if running as module or script
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testWhatsAppWelcome, testBackendAPI };
