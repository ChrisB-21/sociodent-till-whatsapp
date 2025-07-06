import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import razorpayRoutes from './routes/razorpay.js';
import admin from 'firebase-admin';
import emailRoutes from './routes/email.js';
import whatsappRoutes from './routes/whatsapp.js';

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
  
  // Configure CORS for Firebase Storage
  const bucket = storage.bucket();
  if (bucket) {
    console.log('Firebase Storage initialized with bucket:', bucket.name);
    console.log('To configure CORS, update your Firebase Storage Rules in the Firebase Console');
    console.log('For reference: https://firebase.google.com/docs/storage/web/download-files#cors_configuration');
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
  console.log('Continuing without Firebase...');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:3000', 'https://sociodent-smile-database.web.app', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
app.use(express.json());

// Routes
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Status endpoint for connectivity checking
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    firebase: db ? 'connected' : 'disconnected',
    storage: storage ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
