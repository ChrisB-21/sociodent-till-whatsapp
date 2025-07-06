# WhatsApp Welcome Messages Setup Guide

## 🎯 Overview

This implementation adds WhatsApp welcome messages to your SocioDent signup process. When users and doctors register, they automatically receive a welcome message on their WhatsApp.

## 📋 Prerequisites

1. **WhatsApp Business Account**: You need a verified WhatsApp Business account
2. **Facebook Developer Account**: Required for WhatsApp Business API access
3. **WhatsApp Business API Access**: Approved access to WhatsApp Business API

## 🚀 Setup Steps

### 1. Facebook App Configuration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add "WhatsApp" product to your app
4. Navigate to WhatsApp > API Setup

### 2. Get Required Credentials

From your Facebook App Dashboard > WhatsApp > API Setup, get:

- **Access Token**: Your app's access token
- **Phone Number ID**: Your WhatsApp Business phone number ID (e.g., `753038067883264`)
- **Phone Number**: Your WhatsApp Business phone number (e.g., `+918825786991`)

### 3. Environment Variables

Add these to your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=753038067883264
WHATSAPP_API_VERSION=v22.0

# Frontend environment variables (for Vite)
VITE_WHATSAPP_ACCESS_TOKEN=your_access_token_here
VITE_WHATSAPP_PHONE_NUMBER_ID=753038067883264
VITE_WHATSAPP_API_VERSION=v22.0
```

### 4. WhatsApp Message Templates

You need to create and get approval for message templates in Facebook Business Manager:

#### Basic Template (Already Available)
- **Name**: `hello_world`
- **Content**: "Hello World"
- **Status**: Pre-approved by Facebook

#### Custom Templates (Need Approval)
- **Name**: `user_welcome`
- **Content**: "Hi {{1}}, welcome to SocioDent! Your registration was successful."

- **Name**: `doctor_welcome`  
- **Content**: "Hi Dr. {{1}}, welcome to SocioDent medical network! Your registration is under review."

### 5. Template Approval Process

1. Go to Facebook Business Manager
2. Navigate to WhatsApp Manager
3. Go to Account Tools > Message Templates
4. Create new templates with the content above
5. Submit for approval (usually takes 24-48 hours)

## 🧪 Testing

### 1. Test Configuration

Open the test page in your browser:
```bash
# Make sure your backend server is running
cd backend
npm start

# Then open in browser
http://localhost:3000/test-whatsapp-welcome.html
```

### 2. Command Line Testing

```bash
# Test the WhatsApp service directly
node test-whatsapp-welcome.js
```

### 3. Test API Endpoints

```bash
# Check configuration status
curl http://localhost:3000/api/whatsapp/status

# Test welcome message
curl -X POST http://localhost:3000/api/whatsapp/send-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "917042469530",
    "role": "user"
  }'

# Test simple hello_world
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "917042469530"}'
```

## 📱 Phone Number Format

The system automatically handles phone number formatting:

- **Input**: `9876543210` or `+919876543210` or `919876543210`
- **Output**: `919876543210` (country code + number)

## 🔧 Implementation Details

### Frontend Integration (`src/pages/Signup.tsx`)

The signup form now:
1. Collects user information
2. Creates Firebase account
3. Sends WhatsApp welcome message
4. Shows success/error messages

### Backend API (`backend/routes/whatsapp.js`)

Provides endpoints:
- `POST /api/whatsapp/send-welcome` - Send welcome message
- `POST /api/whatsapp/test` - Test hello_world template
- `GET /api/whatsapp/status` - Check configuration

### Service Layer (`src/services/whatsappWelcomeService.ts`)

Features:
- Direct Facebook Graph API integration
- Backend API fallback
- Automatic phone number formatting
- Firebase logging of message attempts
- Error handling and retries

## 🛠️ Troubleshooting

### Common Issues

1. **"WhatsApp access token not configured"**
   - Add `WHATSAPP_ACCESS_TOKEN` to your `.env` file
   - Restart your server after adding environment variables

2. **"Template does not exist"**
   - Use `hello_world` template for testing (pre-approved)
   - Submit custom templates for approval in Facebook Business Manager

3. **"Phone number not registered"**
   - The recipient's phone number must have WhatsApp installed
   - For testing, use your own WhatsApp number

4. **CORS errors in browser**
   - The direct API calls from frontend may fail due to CORS
   - Backend API is used as fallback automatically

### Debugging

1. **Check logs**: WhatsApp attempts are logged to Firebase under `whatsapp_logs/`
2. **Test with curl**: Use the curl commands above to test backend directly
3. **Facebook Graph API Explorer**: Test your access token and phone number ID

## 🔒 Security Notes

1. **Never expose access tokens**: Keep `WHATSAPP_ACCESS_TOKEN` secret
2. **Environment variables**: Don't commit `.env` files to version control
3. **Rate limiting**: Facebook has rate limits on message sending
4. **Template compliance**: Follow WhatsApp Business Policy for templates

## 📞 Production Deployment

### 1. Template Approval

Ensure all custom templates are approved before going live:
- `user_welcome`
- `doctor_welcome`

### 2. Phone Number Verification

Your WhatsApp Business phone number must be:
- Verified in Facebook Business Manager
- Added to your WhatsApp Business API account
- Approved for sending template messages

### 3. Environment Variables

Set production environment variables:
```bash
WHATSAPP_ACCESS_TOKEN=prod_access_token
WHATSAPP_PHONE_NUMBER_ID=your_prod_phone_number_id
```

### 4. Monitoring

Monitor WhatsApp message delivery:
- Check Firebase `whatsapp_logs/` collection
- Monitor Facebook Business Manager for delivery reports
- Set up alerts for failed messages

## 📈 Usage Analytics

The system logs all WhatsApp attempts to Firebase:

```javascript
// Example log entry in Firebase
{
  timestamp: 1703123456789,
  phone: "917042469530",
  name: "John Doe",
  role: "user",
  success: true,
  messageId: "wamid.xxx",
  createdAt: "2023-12-20T10:30:00.000Z"
}
```

Use this data to:
- Track delivery success rates
- Monitor signup completion flow
- Debug failed messages
- Generate usage reports

## 🆘 Support

If you encounter issues:

1. **Check Facebook Developer Console**: Look for API errors and limits
2. **WhatsApp Business Support**: Contact Facebook Business Support
3. **Template Issues**: Check template approval status
4. **Rate Limits**: Monitor your API usage in Facebook Developer Console

---

## ✅ Quick Test Checklist

- [ ] Environment variables configured
- [ ] Backend server running
- [ ] Test page loads: `http://localhost:3000/test-whatsapp-welcome.html`
- [ ] Configuration status shows "configured: true"
- [ ] hello_world template works
- [ ] Signup form sends welcome messages
- [ ] Messages logged to Firebase
- [ ] Production templates submitted for approval

🎉 **Your WhatsApp welcome messages are now ready!**
