// Test Firebase database permissions for doctor assignment
import admin from 'firebase-admin';
import 'dotenv/config';

// Initialize Firebase Admin
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
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
  process.exit(1);
}

// Get reference to the Firebase Realtime Database
const db = admin.database();

// Test functions
async function testDatabaseWrite() {
  try {
    console.log('Testing database write permissions...');
    
    // Create a test appointment
    const appointmentRef = db.ref('appointments/test-appointment-' + Date.now());
    await appointmentRef.set({
      userId: 'test-user',
      userName: 'Test User',
      userEmail: 'test@example.com',
      consultationType: 'virtual',
      date: '2025-06-01',
      time: '10:00',
      symptoms: 'Test symptoms',
      status: 'pending',
      createdAt: Date.now()
    });
    
    console.log('Successfully created test appointment');
    
    // Assign a doctor to the appointment
    await appointmentRef.update({
      doctorId: 'test-doctor',
      doctorName: 'Test Doctor',
      specialization: 'General',
      status: 'confirmed',
      updatedAt: Date.now()
    });
    
    console.log('Successfully assigned doctor to appointment');
    
    // Read the appointment data
    const snapshot = await appointmentRef.once('value');
    console.log('Appointment data:', snapshot.val());
    
    // Clean up - delete the test appointment
    await appointmentRef.remove();
    console.log('Successfully deleted test appointment');
    
    console.log('All database permission tests passed successfully!');
  } catch (error) {
    console.error('Error testing database permissions:', error);
  }
}

// Run the tests
testDatabaseWrite()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
