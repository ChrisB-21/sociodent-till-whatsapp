// WhatsApp Permission Diagnostic Tool
// Run this to diagnose and fix WhatsApp permission issues

console.log('🔍 WhatsApp Permission Diagnostic Tool');
console.log('=====================================\n');

// Mock the WhatsApp service for Node.js environment
const WHATSAPP_ACCESS_TOKEN = "EAAeBLmkhPx8BPAZCeqKKaWiZBwLWAHKz22FsXeF5loh5tp90j23jmOK6hdGoG1z9NVEScmHD1u182XlVLkTZBR4EXCcNkzPd0bz8Ssanj38iHYKV6vlBZCuTyxbYToKZBZAA4wM0HdnRizokgFGQK0Do2NMQ1Jl9Hd6LnXy9AUY159bG6b2sGxcCPq0nsEgmyS4AJjZBM6S8GCNK36SwBXMDZA3FVZBebqxhlGj2S";
const WHATSAPP_PHONE_NUMBER_ID = "753038067883264";
const WHATSAPP_API_VERSION = "v22.0";

async function diagnoseProblem() {
  console.log('Step 1: Checking configuration...');
  
  if (!WHATSAPP_ACCESS_TOKEN) {
    console.log('❌ Access token not found');
    return false;
  }
  console.log('✅ Access token configured');
  
  if (!WHATSAPP_PHONE_NUMBER_ID) {
    console.log('❌ Phone number ID not found');
    return false;
  }
  console.log('✅ Phone number ID configured');
  console.log('');
  
  // Test 1: Check phone number info
  console.log('Step 2: Checking phone number status...');
  try {
    const infoUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}?fields=verified_name,display_phone_number,status,name_status,quality_rating&access_token=${WHATSAPP_ACCESS_TOKEN}`;
    
    const response = await fetch(infoUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Cannot access phone number info');
      console.log('Error:', data.error?.message || 'Unknown error');
      
      if (data.error?.code === 10) {
        console.log('\n🚨 PERMISSION ERROR DETECTED');
        console.log('Your app does not have permission to access WhatsApp Business API');
        console.log('\n🔧 IMMEDIATE FIXES:');
        console.log('1. Go to https://business.facebook.com/');
        console.log('2. Navigate to WhatsApp Manager');
        console.log('3. Verify your business account');
        console.log('4. Check phone number verification status');
        console.log('5. Go to developers.facebook.com → Your App → App Review');
        console.log('6. Request "whatsapp_business_messaging" permission');
        return false;
      }
    } else {
      console.log('✅ Phone number accessible');
      console.log('Display Name:', data.verified_name || 'Not set');
      console.log('Phone Number:', data.display_phone_number || 'Not shown');
      console.log('Status:', data.status || 'Unknown');
      console.log('Name Status:', data.name_status || 'Unknown');
      console.log('Quality Rating:', data.quality_rating || 'Not rated');
      
      if (data.status !== 'VERIFIED') {
        console.log('⚠️  Phone number is not verified');
        console.log('💡 Fix: Verify your phone number in WhatsApp Manager');
      }
    }
  } catch (error) {
    console.log('❌ Network error checking phone number:', error.message);
    return false;
  }
  console.log('');
  
  // Test 2: Check message templates
  console.log('Step 3: Checking message templates...');
  try {
    const templatesUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/message_templates?access_token=${WHATSAPP_ACCESS_TOKEN}`;
    
    const response = await fetch(templatesUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Cannot access templates');
      console.log('Error:', data.error?.message || 'Unknown error');
    } else {
      console.log('✅ Templates accessible');
      
      if (data.data && data.data.length > 0) {
        console.log(`Found ${data.data.length} template(s):`);
        data.data.forEach(template => {
          console.log(`- ${template.name}: ${template.status}`);
        });
        
        // Check for required templates
        const hasHelloWorld = data.data.some(t => t.name === 'hello_world' && t.status === 'APPROVED');
        const hasWelcome = data.data.some(t => t.name === 'welcome' && t.status === 'APPROVED');
        
        if (!hasHelloWorld) {
          console.log('⚠️  hello_world template not found or not approved');
        }
        if (!hasWelcome) {
          console.log('⚠️  welcome template not found or not approved');
        }
      } else {
        console.log('⚠️  No templates found');
        console.log('💡 Fix: Create message templates in WhatsApp Manager');
      }
    }
  } catch (error) {
    console.log('❌ Network error checking templates:', error.message);
  }
  console.log('');
  
  // Test 3: Try sending a test message
  console.log('Step 4: Testing message sending...');
  try {
    const messageUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: "917042469530", // Test number
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    };
    
    const response = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test message sent successfully!');
      console.log('Message ID:', data.messages[0].id);
    } else {
      console.log('❌ Test message failed');
      console.log('Error:', data.error?.message || 'Unknown error');
      
      if (data.error?.code === 10) {
        console.log('\n🚨 PERMISSION ERROR CONFIRMED');
        console.log('This is the same error you\'re seeing in the app');
      } else if (data.error?.code === 131056) {
        console.log('\n📝 TEMPLATE ERROR');
        console.log('The hello_world template is not approved');
      } else if (data.error?.code === 131051) {
        console.log('\n📞 PHONE NUMBER ERROR');
        console.log('Invalid recipient phone number');
      }
    }
  } catch (error) {
    console.log('❌ Network error sending test message:', error.message);
  }
  
  console.log('\n🔗 Helpful Links:');
  console.log('- WhatsApp Manager: https://business.whatsapp.com/');
  console.log('- Facebook Developers: https://developers.facebook.com/');
  console.log('- Meta Business Help: https://www.facebook.com/business/help/');
  console.log('- WhatsApp API Docs: https://developers.facebook.com/docs/whatsapp/');
  
  return true;
}

// Import fetch for Node.js
import('node-fetch').then(({ default: fetch }) => {
  global.fetch = fetch;
  diagnoseProblem();
}).catch(() => {
  console.log('Installing node-fetch...');
  console.log('Run: npm install node-fetch');
  console.log('Then run this script again');
});
