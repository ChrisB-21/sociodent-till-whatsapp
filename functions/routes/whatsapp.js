import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

/**
 * Format phone number to WhatsApp format
 */
function formatPhoneNumber(phone) {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 91 (India country code), use as is
  // If it's a 10 digit number, add 91 prefix
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  } else if (cleaned.length === 10) {
    return '91' + cleaned;
  } else if (cleaned.startsWith('91') && cleaned.length > 12) {
    // Take first 12 digits if longer
    return cleaned.substring(0, 12);
  }
  
  return cleaned;
}

/**
 * Send WhatsApp message using Facebook Graph API
 */
async function sendWhatsAppMessage(to, templateName, templateParams = []) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '753038067883264';
    const version = process.env.WHATSAPP_API_VERSION || 'v22.0';
    
    if (!accessToken) {
      throw new Error('WhatsApp access token not configured');
    }

    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
    
    // Build template payload based on template name
    let templatePayload;
    
    if (templateName === 'welcome' && templateParams && templateParams.length > 0) {
      // Use the exact format from the working curl command
      templatePayload = {
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
                text: templateParams[0] // User's name
              }
            ]
          }
        ]
      };
    } else if (templateName === 'hello_world') {
      // Simple hello_world template without parameters
      templatePayload = {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      };
    } else {
      // Fallback for other templates
      templatePayload = {
        name: templateName,
        language: {
          code: "en_US"
        },
        ...(templateParams && templateParams.length > 0 && {
          components: [
            {
              type: "body",
              parameters: templateParams.map(param => ({
                type: "text",
                text: param
              }))
            }
          ]
        })
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: templatePayload
    };

    console.log('Sending WhatsApp message:', {
      to,
      template: templateName,
      params: templateParams
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.messages && responseData.messages[0]) {
      console.log('WhatsApp message sent successfully:', responseData.messages[0].id);
      return {
        success: true,
        messageId: responseData.messages[0].id
      };
    } else {
      console.error('WhatsApp API error:', responseData);
      return {
        success: false,
        error: responseData.error?.message || 'Unknown WhatsApp API error'
      };
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

// Send welcome message endpoint
router.post('/send-welcome', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and phone are required' 
      });
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    // Determine template based on role
    let templateName = 'hello_world'; // Fallback template
    let templateParams = [];
    
    if (role === 'doctor') {
      templateName = 'doctor_welcome'; // If you have a doctor-specific template
      templateParams = [name];
    } else {
      templateName = 'user_welcome'; // If you have a user-specific template
      templateParams = [name];
    }
    
    // Try with specific template first, fallback to hello_world if it fails
    let result = await sendWhatsAppMessage(formattedPhone, templateName, templateParams);
    
    if (!result.success && templateName !== 'hello_world') {
      console.log('Specific template failed, trying hello_world template');
      result = await sendWhatsAppMessage(formattedPhone, 'hello_world');
    }
    
    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Welcome message sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message'
      });
    }
  } catch (error) {
    console.error('WhatsApp welcome message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Test WhatsApp configuration endpoint
router.post('/test', async (req, res) => {
  try {
    const testPhone = req.body.phone || '917042469530'; // Default test number
    
    const result = await sendWhatsAppMessage(testPhone, 'hello_world');
    
    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Test message sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Test message failed'
      });
    }
  } catch (error) {
    console.error('WhatsApp test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get WhatsApp configuration status
router.get('/status', (req, res) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  res.json({
    configured: !!(accessToken && phoneNumberId),
    phoneNumberId: phoneNumberId || 'Not configured',
    hasAccessToken: !!accessToken
  });
});

export default router;
