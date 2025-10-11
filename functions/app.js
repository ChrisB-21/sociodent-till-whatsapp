import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';
import emailRoutes from './routes/email.js';
import whatsappRoutes from './routes/whatsapp.js';
// Load dotenv only when running locally (emulator / development). Avoid loading
// .env during firebase deploy which can contain reserved keys and break the build.
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
  import('dotenv')
    .then((d) => d.config())
    .catch(() => {
      console.warn('dotenv not available, continuing without loading .env');
    });
}

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

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
  console.log('Continuing without Firebase...');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8082', 'http://localhost:8084', 'http://localhost:3000', 'https://sociodent-smile-database.web.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));
app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Razorpay
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  } else {
    console.warn('Razorpay keys not set.');
  }
} catch (error) {
  console.error('Error initializing Razorpay:', error.message);
}

// Endpoints
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    firebase: db ? 'connected' : 'disconnected',
    storage: storage ? 'connected' : 'disconnected',
    razorpay: razorpay ? 'connected' : 'disconnected'
  });
});

app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, orderType, consultationType } = req.body;
    if (!razorpay || !amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid Razorpay setup or amount' });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `consultation_${consultationType || 'unknown'}_${Date.now()}`,
      notes: { orderType, consultationType }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

app.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;
