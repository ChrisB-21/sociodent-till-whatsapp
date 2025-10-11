// Load .env only in local/emulator runs. Avoid loading during deploy.
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line global-require
    require('dotenv').config();
  } catch (err) {
    // ignore
  }
}

import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
}

const app = express();

// CORS configuration - crucial for allowing frontend to connect
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8084',
    'http://localhost:3000',
    'https://sociodent-smile-database.web.app',
    'https://sociodent-smile-database.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json());

// Basic health check
app.get("/", (req, res) => {
  res.json({ 
    message: "SocioDent backend is up and running!",
    timestamp: new Date().toISOString()
  });
});

// Initialize Razorpay with environment variables
let razorpay = null;
let razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

try {
  const keyId = process.env.RAZORPAY_KEY_ID;
  
  if (keyId && razorpaySecret) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: razorpaySecret,
    });
    console.log('Razorpay initialized successfully');
  } else {
    console.log('Razorpay not initialized - missing credentials');
  }
} catch (error) {
  console.error('Error initializing Razorpay:', error.message);
}

// Configure email transporter
let emailTransporter;
try {
  // Use createTransport (nodemailer API). Only verify the transporter locally.
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: typeof process.env.SMTP_SECURE !== 'undefined' ? (process.env.SMTP_SECURE === 'true') : true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
    emailTransporter.verify((error) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email transporter verified successfully');
      }
    });
  }

  console.log('Email transporter initialized');
} catch (error) {
  console.error('Error initializing email transporter:', error);
}

// Email endpoint
app.post('/email/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SocioDent" <sociodentwebapp@gmail.com>',
      replyTo: process.env.SMTP_USER || 'sociodentwebapp@gmail.com',
      to,
      subject,
      html,
      text
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    });
  }
});

// Send product order notification to admin
app.post('/email/send-product-order-email', async (req, res) => {
  try {
    const { adminEmail, orderData } = req.body;
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@sociodent.com',
      to: adminEmail,
      subject: `New Product Order - ${orderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
            New Product Order Received
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
            <p><strong>Product:</strong> ${orderData.productName}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod.toUpperCase()}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
          </div>
          
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Delivery Address</h3>
            <p>${orderData.address.line1}</p>
            ${orderData.address.line2 ? `<p>${orderData.address.line2}</p>` : ''}
            <p>${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}</p>
            ${orderData.address.landmark ? `<p><strong>Landmark:</strong> ${orderData.address.landmark}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Please process this order and update the status in the admin portal.</p>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated notification from SocioDent Admin System</p>
            <p>Generated at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Product order email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending product order email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send product order email' 
    });
  }
});

// OTP routes
app.post('/otp/send', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SocioDent" <sociodentwebapp@gmail.com>',
      to: email,
      subject: 'Your SocioDent Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #FF4A4A; font-size: 32px; margin: 0;">Socio<span style="color: #1D4C7C;">Dent</span></h1>
              <p style="color: #9E9E9E; margin: 5px 0 0 0;">redefining oral care</p>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h2>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="color: white; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
              <h1 style="color: white; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This verification code will expire in <strong>10 minutes</strong> for your security.
            </p>
          </div>
        </div>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId, otp: otp });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send OTP email' 
    });
  }
});

// Razorpay Routes
app.post('/razorpay/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      throw new Error('Razorpay not initialized');
    }

    const { amount, orderType = 'consultation', consultationType } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate consultation type if order type is consultation
    if (orderType === 'consultation' && (!consultationType || !['virtual', 'home', 'clinic'].includes(consultationType))) {
      return res.status(400).json({ error: 'Invalid consultation type' });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        orderType,
        consultationType: consultationType || '',
      },
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order.id);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      success: true
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error.message 
    });
  }
});

app.post('/razorpay/verify-payment', async (req, res) => {
  try {
    if (!razorpay) {
      throw new Error('Razorpay not initialized');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    const generated_signature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      console.log('Payment verified successfully:', razorpay_payment_id);
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      console.log('Payment verification failed for:', razorpay_payment_id);
      res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed' 
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed',
      message: error.message 
    });
  }
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
