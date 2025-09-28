// Script to configure CORS settings for Firebase Storage
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Firebase service account credentials from environment variables
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'sociodent-smile-database.firebasestorage.app'
});

// Get storage bucket
const bucket = admin.storage().bucket();

// Set CORS configuration
async function setCORS() {
  try {
    // Load CORS configuration from file
    const corsFilePath = path.join(__dirname, '..', 'cors.json');
    const corsConfig = JSON.parse(fs.readFileSync(corsFilePath, 'utf8'));
    
    console.log('Setting CORS configuration:', JSON.stringify(corsConfig, null, 2));
    
    // Apply CORS settings to bucket
    await bucket.setCorsConfiguration(corsConfig);
    
    console.log('CORS configuration successfully applied to bucket:', bucket.name);
    
    // Get and display the updated CORS configuration
    const [metadata] = await bucket.getMetadata();
    console.log('Current CORS configuration:', JSON.stringify(metadata.cors, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
    process.exit(1);
  }
}

// Run the CORS configuration
setCORS();
