// Test WhatsApp Integration in Onboarding
import WhatsAppWelcomeService from './src/services/whatsappWelcomeService.js';

async function testWhatsAppIntegration() {
  console.log('Testing WhatsApp Welcome Service Integration...\n');
  
  // Test 1: Configuration check
  console.log('1. Testing configuration...');
  try {
    const configTest = await WhatsAppWelcomeService.testConfiguration();
    if (configTest.success) {
      console.log('✅ Configuration test passed');
    } else {
      console.log('❌ Configuration test failed:', configTest.error);
    }
  } catch (error) {
    console.log('❌ Configuration test error:', error.message);
  }
  
  // Test 2: User welcome message
  console.log('\n2. Testing user welcome message...');
  try {
    const userResult = await WhatsAppWelcomeService.sendUserWelcomeMessage({
      name: 'Test User',
      phone: '7042469530',
      role: 'user'
    });
    
    if (userResult.success) {
      console.log('✅ User welcome message sent successfully');
      console.log('   Message ID:', userResult.messageId);
    } else {
      console.log('❌ User welcome message failed:', userResult.error);
    }
  } catch (error) {
    console.log('❌ User welcome message error:', error.message);
  }
  
  // Test 3: Doctor welcome message
  console.log('\n3. Testing doctor welcome message...');
  try {
    const doctorResult = await WhatsAppWelcomeService.sendUserWelcomeMessage({
      name: 'Dr. Test Doctor',
      phone: '7042469530',
      role: 'doctor'
    });
    
    if (doctorResult.success) {
      console.log('✅ Doctor welcome message sent successfully');
      console.log('   Message ID:', doctorResult.messageId);
    } else {
      console.log('❌ Doctor welcome message failed:', doctorResult.error);
    }
  } catch (error) {
    console.log('❌ Doctor welcome message error:', error.message);
  }
  
  // Test 4: Simple welcome fallback
  console.log('\n4. Testing simple welcome fallback...');
  try {
    const simpleResult = await WhatsAppWelcomeService.sendSimpleWelcome('7042469530', 'Test User');
    
    if (simpleResult.success) {
      console.log('✅ Simple welcome message sent successfully');
      console.log('   Message ID:', simpleResult.messageId);
    } else {
      console.log('❌ Simple welcome message failed:', simpleResult.error);
    }
  } catch (error) {
    console.log('❌ Simple welcome message error:', error.message);
  }
  
  console.log('\n=== WhatsApp Integration Test Complete ===');
}

// Run the test
testWhatsAppIntegration().catch(console.error);
