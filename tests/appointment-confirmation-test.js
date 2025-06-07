// Test script for appointment confirmation and doctor assignment
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Firebase Admin SDK
const serviceAccount = {
  "type": process.env.FIREBASE_TYPE,
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_AUTH_URI,
  "token_uri": process.env.FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize the app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.database();

// Function to test updating an appointment status
async function testUpdateAppointmentStatus() {
  try {
    console.log('Testing appointment status update...');
    // Get a list of appointments
    const appointmentsRef = db.ref('appointments');
    const snapshot = await appointmentsRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('No appointments found.');
      return;
    }
    
    // Find a pending appointment
    let pendingAppointment = null;
    let pendingAppointmentId = null;
    
    snapshot.forEach((childSnapshot) => {
      const appointment = childSnapshot.val();
      if (appointment.status === 'pending') {
        pendingAppointment = appointment;
        pendingAppointmentId = childSnapshot.key;
        return true; // Break the forEach loop
      }
    });
    
    if (!pendingAppointment) {
      console.log('No pending appointments found.');
      return;
    }
    
    console.log('Found pending appointment:', pendingAppointmentId);
    console.log(pendingAppointment);
    
    // Try to update the status
    console.log('Attempting to update status to "confirmed"...');
    try {
      await appointmentsRef.child(pendingAppointmentId).update({
        status: 'confirmed',
        updatedAt: Date.now()
      });
      console.log('Successfully updated appointment status!');
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  } catch (error) {
    console.error('Error in test function:', error);
  }
}

// Function to test assigning a doctor
async function testAssignDoctor() {
  try {
    console.log('\nTesting doctor assignment...');
    // Get a list of appointments
    const appointmentsRef = db.ref('appointments');
    const snapshot = await appointmentsRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('No appointments found.');
      return;
    }
    
    // Find a pending appointment
    let pendingAppointment = null;
    let pendingAppointmentId = null;
    
    snapshot.forEach((childSnapshot) => {
      const appointment = childSnapshot.val();
      if (appointment.status === 'pending' && !appointment.doctorId) {
        pendingAppointment = appointment;
        pendingAppointmentId = childSnapshot.key;
        return true; // Break the forEach loop
      }
    });
    
    if (!pendingAppointment) {
      console.log('No unassigned pending appointments found.');
      return;
    }
    
    console.log('Found unassigned pending appointment:', pendingAppointmentId);
    console.log(pendingAppointment);
    
    // Get available doctors
    const usersRef = db.ref('users');
    const doctorsSnapshot = await usersRef.orderByChild('role').equalTo('doctor').once('value');
    
    if (!doctorsSnapshot.exists()) {
      console.log('No doctors found.');
      return;
    }
    
    let doctor = null;
    let doctorId = null;
    
    doctorsSnapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.status === 'approved') {
        doctor = userData;
        doctorId = childSnapshot.key;
        return true; // Break the forEach loop
      }
    });
    
    if (!doctor) {
      console.log('No approved doctors found.');
      return;
    }
    
    console.log('Found doctor:', doctorId);
    console.log(doctor);
    
    // Try to assign the doctor
    console.log('Attempting to assign doctor...');
    try {
      await appointmentsRef.child(pendingAppointmentId).update({
        doctorId: doctorId,
        doctorName: doctor.fullName || 'Unknown Doctor',
        specialization: doctor.specialization || 'General',
        status: 'confirmed',
        updatedAt: Date.now()
      });
      console.log('Successfully assigned doctor!');
    } catch (error) {
      console.error('Error assigning doctor:', error);
    }
  } catch (error) {
    console.error('Error in test function:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    await testUpdateAppointmentStatus();
    await testAssignDoctor();
    
    console.log('\nTests completed.');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Close the database connection
    admin.app().delete();
  }
}

runTests();
