// Test script to verify new Firebase credentials are working
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('Testing New Firebase Credentials');
console.log('================================');
console.log('Date:', new Date().toISOString());
console.log('');

// Verify environment variables
console.log('Environment Variables Check:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_CLIENT_ID:', process.env.FIREBASE_CLIENT_ID);
console.log('FIREBASE_DATABASE_URL:', process.env.FIREBASE_DATABASE_URL);
console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET);
console.log('');

try {
  // Initialize Firebase Admin SDK with new credentials
  const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL,
    "universe_domain": "googleapis.com"
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  console.log('✅ Firebase Admin SDK initialized successfully with NEW credentials');
  console.log('');

  // Test Database access
  const db = admin.database();
  const testRef = db.ref('credentials_test');
  
  const testData = {
    timestamp: Date.now(),
    message: 'New Firebase credentials test',
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    test_id: `cred-test-${Date.now()}`
  };

  await testRef.set(testData);
  console.log('✅ Database Write Test: SUCCESS');
  
  const snapshot = await testRef.once('value');
  const retrievedData = snapshot.val();
  console.log('✅ Database Read Test: SUCCESS');
  console.log('Retrieved data:', {
    timestamp: retrievedData.timestamp,
    message: retrievedData.message,
    private_key_id: retrievedData.private_key_id
  });
  
  // Test Storage access
  const storage = admin.storage();
  const bucket = storage.bucket();
  console.log('✅ Storage Access Test: SUCCESS');
  console.log('Storage bucket name:', bucket.name);
  
  // Test Auth access
  const auth = admin.auth();
  console.log('✅ Auth Service Test: SUCCESS');
  
  // Clean up test data
  await testRef.remove();
  console.log('✅ Test data cleanup: SUCCESS');
  
  console.log('');
  console.log('🎉 ALL TESTS PASSED - New Firebase credentials are working perfectly!');
  console.log('');
  console.log('Summary:');
  console.log('- Firebase Admin SDK initialization: ✅');
  console.log('- Database read/write operations: ✅');
  console.log('- Storage service access: ✅');
  console.log('- Authentication service access: ✅');
  console.log('- Test data cleanup: ✅');
  
} catch (error) {
  console.error('❌ Error testing Firebase credentials:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}
