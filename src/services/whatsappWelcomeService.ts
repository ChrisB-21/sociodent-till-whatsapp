// WhatsApp Welcome Service - Sends welcome messages using Facebook Graph API
import { ref, set } from 'firebase/database';
import { db } from '@/firebase';
import { API_ENDPOINTS } from '../config/api';

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  version: string;
}

interface WelcomeMessageData {
  name: string;
  phone: string;
  role: 'user' | 'doctor';
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppWelcomeService {
  private static config: WhatsAppConfig = {
    accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '753038067883264',
    version: import.meta.env.VITE_WHATSAPP_API_VERSION || 'v22.0'
  };

  /**
   * Format phone number to WhatsApp format (remove + and country code formatting)
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 91 (India country code), use as is
    // If it starts with +91, remove the +
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
   * Send welcome message using Facebook Graph API
   */
  private static async sendWhatsAppMessage(to: string, templateName: string, templateParams?: any[]): Promise<WhatsAppResponse> {
    try {
      const { accessToken, phoneNumberId, version } = this.config;
      
      if (!accessToken) {
        console.error('WhatsApp access token not configured');
        return { success: false, error: 'WhatsApp access token not configured' };
      }

      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
      
      // Build template payload based on template name
      let templatePayload;
      
      if (templateName === 'welcome' && templateParams && templateParams.length > 0) {
        // Use the exact format from your working curl command
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
                    link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:Ahttps://bizimages.withfloats.com/actual/682ad5cff0567fb7fd1e4275.jpgNd9GcQlTr-JXSkAB9S2I9XbBGmx1dKa0N4btpB8TA&s"
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
            code: "en"
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
        url,
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
        console.log('WhatsApp message sent successfully:', responseData);
        return {
          success: true,
          messageId: responseData.messages[0].id
        };
      } else {
        console.error('WhatsApp API error:', responseData);
        
        // Handle specific permission errors
        let errorMessage = responseData.error?.message || 'Unknown WhatsApp API error';
        
        if (responseData.error?.code === 10) {
          errorMessage = 'WhatsApp permission error: Application does not have permission. Please check:\n' +
            '1. WhatsApp Business Account verification\n' +
            '2. App permissions (whatsapp_business_messaging)\n' +
            '3. Phone number approval\n' +
            '4. Message template approval\n' +
            'See WHATSAPP_PERMISSION_ERROR_FIX.md for detailed instructions.';
        } else if (responseData.error?.code === 131056) {
          errorMessage = 'WhatsApp template error: Message template not found or not approved. Please check your message templates in WhatsApp Manager.';
        } else if (responseData.error?.code === 131047) {
          errorMessage = 'WhatsApp rate limit: Too many messages sent. Please wait before sending more messages.';
        } else if (responseData.error?.code === 131051) {
          errorMessage = 'WhatsApp recipient error: Invalid phone number or recipient cannot receive messages.';
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Send message via backend API
   */
  private static async sendViaBackend(data: WelcomeMessageData): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.WHATSAPP.SEND_WELCOME, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          role: data.role
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          messageId: result.messageId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Backend API error'
        };
      }
    } catch (error) {
      console.error('Backend API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backend API network error'
      };
    }
  }

  /**
   * Send welcome message to new user (with backend fallback)
   */
  public static async sendUserWelcomeMessage(data: WelcomeMessageData): Promise<WhatsAppResponse> {
    try {
      // Try direct API call first
      const formattedPhone = this.formatPhoneNumber(data.phone);
      const templateName = data.role === 'doctor' ? 'welcome' : 'welcome';
      const templateParams = [data.name];
      
      let result = await this.sendWhatsAppMessage(formattedPhone, templateName, templateParams);
      
      // If direct API fails, try backend endpoint
      if (!result.success) {
        console.log('Direct WhatsApp API failed, trying backend endpoint');
        result = await this.sendViaBackend(data);
      }
      
      // Log the message attempt to Firebase
      await this.logMessageAttempt(data, result);
      
      return result;
    } catch (error) {
      console.error('Error in sendUserWelcomeMessage:', error);
      
      // Try backend as final fallback
      try {
        const backendResult = await this.sendViaBackend(data);
        await this.logMessageAttempt(data, backendResult);
        return backendResult;
      } catch (backendError) {
        console.error('Backend fallback also failed:', backendError);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'All WhatsApp methods failed'
        };
      }
    }
  }

  /**
   * Send welcome message to new doctor (with backend fallback)
   */
  public static async sendDoctorWelcomeMessage(data: WelcomeMessageData): Promise<WhatsAppResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(data.phone);
      const templateName = 'welcome';
      const templateParams = [data.name];
      
      let result = await this.sendWhatsAppMessage(formattedPhone, templateName, templateParams);
      
      // If direct API fails, try backend endpoint
      if (!result.success) {
        console.log('Direct WhatsApp API failed, trying backend endpoint');
        result = await this.sendViaBackend(data);
      }
      
      // Log the message attempt to Firebase
      await this.logMessageAttempt(data, result);
      
      return result;
    } catch (error) {
      console.error('Error in sendDoctorWelcomeMessage:', error);
      
      // Try backend as final fallback
      try {
        const backendResult = await this.sendViaBackend(data);
        await this.logMessageAttempt(data, backendResult);
        return backendResult;
      } catch (backendError) {
        console.error('Backend fallback also failed:', backendError);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'All WhatsApp methods failed'
        };
      }
    }
  }

  /**
   * Fallback: Send simple hello_world template
   */
  public static async sendSimpleWelcome(phone: string, name: string): Promise<WhatsAppResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Use the basic hello_world template
      const result = await this.sendWhatsAppMessage(formattedPhone, 'hello_world');
      
      // Log the message attempt to Firebase
      await this.logMessageAttempt({ name, phone, role: 'user' }, result);
      
      return result;
    } catch (error) {
      console.error('Error in sendSimpleWelcome:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Log WhatsApp message attempts to Firebase for tracking
   */
  private static async logMessageAttempt(data: WelcomeMessageData, result: WhatsAppResponse): Promise<void> {
    try {
      const logRef = ref(db, `whatsapp_logs/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await set(logRef, {
        timestamp: Date.now(),
        phone: data.phone,
        name: data.name,
        role: data.role,
        success: result.success,
        messageId: result.messageId || null,
        error: result.error || null,
        createdAt: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging WhatsApp message attempt:', logError);
      // Don't throw error for logging failures
    }
  }

  /**
   * Test the WhatsApp configuration
   */
  public static async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      const { accessToken, phoneNumberId } = this.config;
      
      if (!accessToken) {
        return { success: false, error: 'Access token not configured' };
      }
      
      if (!phoneNumberId) {
        return { success: false, error: 'Phone number ID not configured' };
      }
      
      // Test with a simple hello_world message to your own number
      // Note: Replace with a test number
      const testPhone = '917042469530'; // Your test number from the curl example
      
      const result = await this.sendWhatsAppMessage(testPhone, 'hello_world');
      
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Diagnose WhatsApp API setup and permissions
   */
  public static async diagnoseSetup(): Promise<{ success: boolean; issues: string[]; recommendations: string[] }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const { accessToken, phoneNumberId } = this.config;
      
      // Check basic configuration
      if (!accessToken) {
        issues.push('Access token not configured');
        recommendations.push('Set VITE_WHATSAPP_ACCESS_TOKEN in your .env file');
      }
      
      if (!phoneNumberId) {
        issues.push('Phone number ID not configured');
        recommendations.push('Set VITE_WHATSAPP_PHONE_NUMBER_ID in your .env file');
      }
      
      if (issues.length > 0) {
        return { success: false, issues, recommendations };
      }
      
      // Test API access with phone number info endpoint
      const infoUrl = `https://graph.facebook.com/${this.config.version}/${phoneNumberId}?fields=verified_name,display_phone_number,status&access_token=${accessToken}`;
      
      const infoResponse = await fetch(infoUrl);
      const infoData = await infoResponse.json();
      
      if (!infoResponse.ok) {
        if (infoData.error?.code === 10) {
          issues.push('Application does not have permission for WhatsApp Business API');
          recommendations.push('Request whatsapp_business_messaging permission in Facebook App Review');
          recommendations.push('Verify your WhatsApp Business Account in WhatsApp Manager');
        } else {
          issues.push(`API access error: ${infoData.error?.message || 'Unknown error'}`);
          recommendations.push('Check your access token validity');
        }
      } else {
        console.log('Phone number info:', infoData);
        
        // Check phone number status
        if (infoData.status !== 'VERIFIED') {
          issues.push(`Phone number status is ${infoData.status}, expected VERIFIED`);
          recommendations.push('Verify your phone number in WhatsApp Manager');
        }
      }
      
      // Test with hello_world template (usually pre-approved)
      const testResult = await this.sendWhatsAppMessage('917042469530', 'hello_world');
      
      if (!testResult.success) {
        if (testResult.error?.includes('permission')) {
          issues.push('Cannot send messages due to permission issues');
          recommendations.push('Complete WhatsApp Business Account verification');
          recommendations.push('Ensure app has whatsapp_business_messaging permission');
        } else if (testResult.error?.includes('template')) {
          issues.push('Message template issues');
          recommendations.push('Create and submit hello_world template for approval in WhatsApp Manager');
        } else {
          issues.push(`Message test failed: ${testResult.error}`);
        }
      }
      
      return {
        success: issues.length === 0,
        issues,
        recommendations
      };
      
    } catch (error) {
      return {
        success: false,
        issues: [`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check your internet connection and API configuration']
      };
    }
  }

  /**
   * Get detailed account information for troubleshooting
   */
  public static async getAccountInfo(): Promise<any> {
    try {
      const { accessToken, phoneNumberId, version } = this.config;
      
      if (!accessToken || !phoneNumberId) {
        throw new Error('WhatsApp configuration incomplete');
      }
      
      // Get phone number details
      const phoneUrl = `https://graph.facebook.com/${version}/${phoneNumberId}?fields=verified_name,display_phone_number,status,name_status,quality_rating&access_token=${accessToken}`;
      const phoneResponse = await fetch(phoneUrl);
      const phoneData = await phoneResponse.json();
      
      // Get message templates
      const templatesUrl = `https://graph.facebook.com/${version}/${phoneNumberId}/message_templates?access_token=${accessToken}`;
      const templatesResponse = await fetch(templatesUrl);
      const templatesData = await templatesResponse.json();
      
      return {
        phoneNumber: phoneData,
        templates: templatesData,
        configuration: {
          hasAccessToken: !!accessToken,
          phoneNumberId,
          version
        }
      };
      
    } catch (error) {
      console.error('Error getting account info:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default WhatsAppWelcomeService;
