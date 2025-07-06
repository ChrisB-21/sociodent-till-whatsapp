// Test WhatsApp with Updated Template Format
import fetch from 'node-fetch';

const WHATSAPP_ACCESS_TOKEN = "EAAeBLmkhPx8BPPVaMIOzocvBPJrgnmJLSaZBl8ddSPYxJtbpy1ZAG66ZBrlZCbQ0qAcQGJXdD7ph0ALs4SBHO5RTSnWC8jK2rK62uxsZAt5BX5mIDVEAAkAeJdHC25T8tOjqwNUhnYkeXHxdAI3cE6ZBCcs1dQiJJAqlJpoklCJVepbhZBSZBMd0I55F7lxQjkE6NgqZBNhq39ZCgQdEq4lprZBLYOPRsr7AD0xKRi5igE0UgZDZD";
const WHATSAPP_PHONE_NUMBER_ID = "753038067883264";
const WHATSAPP_API_VERSION = "v22.0";

async function testWelcomeTemplate() {
  console.log('🧪 Testing Updated WhatsApp Welcome Template');
  console.log('============================================\n');

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // Test the exact format from your working curl command
  const payload = {
    messaging_product: "whatsapp",
    to: "917042469530",
    type: "template",
    template: {
      name: "welcome",
      language: {
        code: "en"
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: "https://as2.ftcdn.net/v2/jpg/02/39/35/83/1000_F_239358311_5Ykfomx4YAvONXsylqUSV0wHIAKZZu6U.jpg"
              }
            }
          ]
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "name",
              text: "Test User"
            }
          ]
        }
      ]
    }
  };

  console.log('📤 Sending message with payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Message sent successfully');
      console.log('📱 Message ID:', data.messages[0].id);
      console.log('📞 Sent to:', payload.to);
      console.log('');
      console.log('🎉 The template format is working!');
      console.log('Now your app should be able to send WhatsApp welcome messages.');
    } else {
      console.log('❌ FAILED! Error response:');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
      
      if (data.error?.code === 10) {
        console.log('\n💡 SOLUTION: Permission error detected');
        console.log('Your app still needs WhatsApp Business API permissions.');
      } else if (data.error?.code === 131056) {
        console.log('\n💡 SOLUTION: Template error detected');
        console.log('The "welcome" template may not be approved yet.');
      } else {
        console.log('\n💡 Check the error details above for the specific issue.');
      }
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. If successful: Your app will now work with WhatsApp!');
  console.log('2. If failed: Check the error message and fix the template/permissions');
  console.log('3. Update your app\'s environment variables if needed');
}

testWelcomeTemplate();
