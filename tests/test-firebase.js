// A simple test script to debug Firebase initialization
import 'dotenv/config';
import admin from 'firebase-admin';

console.log('Testing Firebase Admin SDK initialization');
console.log('Environment variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID ? 'Set' : 'Not set');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not set');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_CLIENT_ID:', process.env.FIREBASE_CLIENT_ID);
console.log('FIREBASE_CLIENT_CERT_URL:', process.env.FIREBASE_CLIENT_CERT_URL ? 'Set' : 'Not set');
console.log('FIREBASE_DATABASE_URL:', process.env.FIREBASE_DATABASE_URL);
console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET);

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

  console.log('\nService Account Object:');
  // Print each key in the service account object to verify
  Object.keys(serviceAccount).forEach(key => {
    if (key === 'private_key') {
      console.log(key + ': ' + (serviceAccount[key] ? 'Set (not showing for security)' : 'Not set'));
    } else {
      console.log(key + ': ' + serviceAccount[key]);
    }
  });

  // Initialize Firebase
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  console.log('\nFirebase Admin SDK initialized successfully');
  
  // Test storage
  const storage = admin.storage();
  console.log('Storage initialized successfully');
  
  // Get bucket and test CORS configuration
  const bucket = storage.bucket();
  console.log('Storage bucket name:', bucket.name);
  
  // Get and log current CORS configuration
  bucket.getCorsConfiguration()
    .then(corsConfig => {
      console.log('\nCurrent CORS Configuration:', corsConfig);
    })
    .catch(error => {
      console.error('Error getting CORS configuration:', error);
    });
    
} catch (error) {
  console.error('Error initializing Firebase:', error);
  console.error('Error details:', error.message);
}
