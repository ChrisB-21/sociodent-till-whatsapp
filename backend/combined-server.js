import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';
import emailRoutes from './routes/email.js';
import whatsappRoutes from './routes/whatsapp.js';
import otpRoutes from './routes/otp.js';
import 'dotenv/config';

const app = express();

// Initialize Firebase Admin
let db = null;
let auth = null;
let storage = null;

try {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'sociodent-smile-database.firebasestorage.app'
  });

  // Get Firebase services
  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
  console.log('Continuing without Firebase...');
}

// Configure CORS - allow common local dev origins and reflect localhost origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8084',
  'http://localhost:3000',
  'https://sociodent-smile-database.web.app',
  'https://sociodent-smile-database.firebaseapp.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow server-to-server requests (no origin) and allowed origins.
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      return callback(null, true);
    }
    // Reject unknown origins (will cause browser to block)
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(express.json());

// Register routes
app.use('/api/email', emailRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/otp', otpRoutes);

// Initialize Razorpay
let razorpay = null;

try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not set in environment variables, Razorpay functionality will be limited');
  } else {
    // Log the keys being used (only first few characters for security)
    console.log(`Initializing Razorpay with Key ID: ${process.env.RAZORPAY_KEY_ID.substring(0, 6)}... and Key Secret: ${process.env.RAZORPAY_KEY_SECRET.substring(0, 5)}...`);
    
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Razorpay:', error.message);
}

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    firebase: db ? 'connected' : 'disconnected',
    storage: storage ? 'connected' : 'disconnected',
    razorpay: razorpay ? 'connected' : 'disconnected'
  });
});

// Razorpay routes
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      console.error('Razorpay service is not available');
      return res.status(503).json({ message: 'Razorpay service is not available' });
    }

    const { amount, orderType, consultationType } = req.body;
    
    if (!amount || isNaN(amount)) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    console.log(`Creating Razorpay order for ${consultationType || 'unknown'} consultation with amount:`, amount);
    
    const options = {
      amount: amount, // amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `consultation_${consultationType || 'unknown'}_${Date.now()}`,
      notes: {
        orderType: orderType || 'consultation',
        consultationType: consultationType || 'unknown'
      },
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order);
    res.json(order);
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ message: 'Failed to create order: ' + error.message });
  }
});

app.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        success: false,
        message: 'Razorpay service is not available' 
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing payment verification parameters' 
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Verifying payment signature:', {
      expected: expectedSignature,
      received: razorpay_signature
    });

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// Debug endpoint to check users data
app.get('/api/debug/users', async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(500).json({ error: 'Firebase not initialized' });
    }
    
    const realtimeDb = admin.database();
    const usersRef = realtimeDb.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      return res.json({});
    }
    
    const users = snapshot.val();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});