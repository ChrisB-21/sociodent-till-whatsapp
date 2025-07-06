# WhatsApp Permission Error Fix Guide

## Error: "(#10) Application does not have permission for this action"

This error indicates that your WhatsApp Business API setup needs additional configuration.

## 🔍 Root Causes & Solutions

### 1. **WhatsApp Business Account Verification**
**Issue**: Your WhatsApp Business Account may not be fully verified.

**Solution**:
1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to WhatsApp Manager
3. Ensure your business is verified with:
   - Business documents
   - Phone number verification
   - Business address verification

### 2. **App Permissions Not Granted**
**Issue**: Your Facebook App doesn't have WhatsApp Business messaging permissions.

**Solution**:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to "App Review" → "Permissions and Features"
4. Request these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Submit for review if required

### 3. **Phone Number Not Approved**
**Issue**: The phone number `753038067883264` is not approved for sending messages.

**Solution**:
1. In WhatsApp Manager, go to "Phone Numbers"
2. Verify your phone number is:
   - ✅ Added to your WhatsApp Business Account
   - ✅ Verified with SMS/Call
   - ✅ Approved for messaging
3. Check the phone number status

### 4. **Message Templates Not Approved**
**Issue**: The templates (`welcome`, `hello_world`) are not approved.

**Solution**:
1. In WhatsApp Manager, go to "Message Templates"
2. Create and submit templates for approval:
   - Template Name: `welcome`
   - Template Name: `hello_world`
3. Wait for Meta approval (24-48 hours)

### 5. **Access Token Issues**
**Issue**: Access token may be expired or have insufficient scope.

**Solution**:
1. Generate a new access token from WhatsApp Manager
2. Ensure token has correct permissions
3. Update your `.env` file with new token

## 🚀 Quick Fixes to Try First

### Option 1: Use System Templates
Try using pre-approved system templates like `hello_world`:

```javascript
// Test with basic hello_world template (usually pre-approved)
const result = await WhatsAppWelcomeService.sendSimpleWelcome('your_phone', 'Test User');
```

### Option 2: Verify Phone Number Access
Check if your phone number can receive test messages:

```bash
curl -X POST "https://graph.facebook.com/v22.0/753038067883264/messages" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "messaging_product": "whatsapp",
  "to": "917042469530",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "en_US"
    }
  }
}'
```

### Option 3: Check Current Status
1. Log into [WhatsApp Manager](https://business.whatsapp.com/)
2. Check "Overview" for any alerts or warnings
3. Verify all setup steps are complete

## 🛠️ Development Mode Setup

For testing, you can:

1. **Add Test Phone Numbers**:
   - In your app settings, add test phone numbers
   - These don't need business verification

2. **Use Sandbox Mode**:
   - Some features work in sandbox mode
   - Limited to test numbers only

## 📋 Verification Checklist

- [ ] WhatsApp Business Account verified
- [ ] Facebook App has `whatsapp_business_messaging` permission
- [ ] Phone number `753038067883264` is verified and active
- [ ] Message templates are created and approved
- [ ] Access token is valid and has correct scope
- [ ] Business verification documents submitted
- [ ] Test phone numbers added (for development)

## 🔄 Next Steps

1. **Immediate**: Check WhatsApp Manager for any pending verifications
2. **Short-term**: Submit templates for approval
3. **Long-term**: Complete business verification if not done

## 📞 Support

If issues persist:
- Contact Meta WhatsApp Business Support
- Check [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- Review Meta Business Help Center

---

**Note**: WhatsApp Business API has strict requirements. Even with valid tokens, messaging requires proper business verification and template approval.
