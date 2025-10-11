import dotenv from 'dotenv';
dotenv.config();

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
// Load .env only when running locally (emulator/development). Avoid loading
// during firebase deploy which can expose reserved keys or cause validation
// errors.
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line global-require
    require('dotenv').config();
  } catch (err) {
    // ignore
  }
}

// Initialize Razorpay with hardcoded values for now (will use env vars later)
// Initialize Razorpay from environment/runtime config
let razorpay = null;
let razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

try {
  const keyId = 'rzp_live_IdmsDlhHXg0haO'; // Hardcoded for testing
  
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
// Email transporter setup
let emailTransporter;
try {
  // Configure transporter from env/runtime config. Do not perform verify
  // during packaging/deploy step to avoid outbound network calls.
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpSecure = typeof process.env.SMTP_SECURE !== 'undefined' ? (process.env.SMTP_SECURE === 'true') : (smtpPort === 465);

  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpSecure,
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
    const { to, subject, html } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    console.log('=== EMAIL SIMULATION ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Content:', html);
    console.log('========================');

    // For now, simulate successful email sending
    // TODO: Fix Gmail authentication and replace with actual email sending
    const simulatedMessageId = 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    res.json({ 
      success: true, 
      messageId: simulatedMessageId,
      message: 'Email simulated successfully (check server logs for content)' 
    });
  } catch (error) {
    console.error('Error in email endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process email request',
      details: error.message 
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
