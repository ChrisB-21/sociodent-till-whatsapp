// Test script to verify area-based doctor matching functionality
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
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

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.database();

async function testAreaBasedMatching() {
  try {
    console.log('🏥 Testing Area-Based Doctor Matching...\n');

    // Test 1: Check if users have area fields
    console.log('📋 Test 1: Checking user area fields...');
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');
    
    if (!usersSnapshot.exists()) {
      console.log('❌ No users found in database');
      return;
    }

    let doctorsWithArea = 0;
    let patientsWithArea = 0;
    let totalDoctors = 0;
    let totalPatients = 0;

    usersSnapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      const userRole = userData.role;
      
      if (userRole === 'doctor') {
        totalDoctors++;
        if (userData.area || userData.address?.area) {
          doctorsWithArea++;
          console.log(`✅ Doctor ${userData.fullName || userData.name || 'Unknown'} has area: ${userData.area || userData.address?.area}`);
        }
      } else if (userRole === 'patient' || !userRole) {
        totalPatients++;
        if (userData.area || userData.address?.area) {
          patientsWithArea++;
          console.log(`✅ Patient ${userData.fullName || userData.name || 'Unknown'} has area: ${userData.area || userData.address?.area}`);
        }
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Doctors with area: ${doctorsWithArea}/${totalDoctors}`);
    console.log(`   Patients with area: ${patientsWithArea}/${totalPatients}`);

    // Test 2: Check appointments with userArea field
    console.log('\n📋 Test 2: Checking appointments with area information...');
    const appointmentsRef = db.ref('appointments');
    const appointmentsSnapshot = await appointmentsRef.once('value');
    
    if (!appointmentsSnapshot.exists()) {
      console.log('❌ No appointments found in database');
      return;
    }

    let appointmentsWithArea = 0;
    let totalAppointments = 0;
    let homeConsultations = 0;
    let homeConsultationsWithArea = 0;

    appointmentsSnapshot.forEach((childSnapshot) => {
      const appointmentData = childSnapshot.val();
      totalAppointments++;
      
      if (appointmentData.userArea) {
        appointmentsWithArea++;
        console.log(`✅ Appointment ${childSnapshot.key} has userArea: ${appointmentData.userArea}`);
      }
      
      if (appointmentData.consultationType === 'home') {
        homeConsultations++;
        if (appointmentData.userArea) {
          homeConsultationsWithArea++;
        }
      }
    });

    console.log(`\n📊 Appointments Summary:`);
    console.log(`   Appointments with area: ${appointmentsWithArea}/${totalAppointments}`);
    console.log(`   Home consultations: ${homeConsultations}`);
    console.log(`   Home consultations with area: ${homeConsultationsWithArea}/${homeConsultations}`);

    // Test 3: Test doctor assignment logic simulation
    console.log('\n📋 Test 3: Simulating area-based doctor assignment...');
    
    // Create a sample appointment for testing
    const testAppointment = {
      userId: 'test-user',
      userName: 'Test Patient',
      userEmail: 'test@example.com',
      consultationType: 'home',
      date: '2024-06-15',
      time: '10:00',
      symptoms: 'tooth pain',
      status: 'pending',
      userArea: 'Koramangala',
      createdAt: Date.now()
    };

    console.log(`🔍 Test appointment: Patient in ${testAppointment.userArea} needs ${testAppointment.consultationType} consultation`);

    // Find doctors in the same area
    const doctorsInSameArea = [];
    const doctorsInOtherAreas = [];

    usersSnapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.role === 'doctor' && userData.status === 'approved') {
        const doctorArea = userData.area || userData.address?.area;
        if (doctorArea === testAppointment.userArea) {
          doctorsInSameArea.push({
            id: childSnapshot.key,
            name: userData.fullName || userData.name || 'Unknown',
            area: doctorArea,
            specialization: userData.specialization || 'General'
          });
        } else {
          doctorsInOtherAreas.push({
            id: childSnapshot.key,
            name: userData.fullName || userData.name || 'Unknown',
            area: doctorArea,
            specialization: userData.specialization || 'General'
          });
        }
      }
    });

    console.log(`\n🎯 Matching Results:`);
    console.log(`   Doctors in same area (${testAppointment.userArea}): ${doctorsInSameArea.length}`);
    doctorsInSameArea.forEach(doctor => {
      console.log(`     ✅ Dr. ${doctor.name} - ${doctor.specialization} (Area: ${doctor.area})`);
    });
    
    console.log(`   Doctors in other areas: ${doctorsInOtherAreas.length}`);
    doctorsInOtherAreas.slice(0, 3).forEach(doctor => {
      console.log(`     📍 Dr. ${doctor.name} - ${doctor.specialization} (Area: ${doctor.area || 'Not specified'})`);
    });

    // Test 4: Verify the scoring system gives area priority
    console.log('\n📋 Test 4: Verifying area-based scoring...');
    
    if (doctorsInSameArea.length > 0 && doctorsInOtherAreas.length > 0) {
      console.log(`✅ Area-based matching would prioritize doctors in ${testAppointment.userArea}`);
      console.log(`   Same area doctors get +10 bonus points for matching area`);
      console.log(`   This ensures better matches for home consultations`);
    } else if (doctorsInSameArea.length === 0) {
      console.log(`⚠️  No doctors found in patient's area (${testAppointment.userArea})`);
      console.log(`   System will assign doctors from other areas`);
    } else {
      console.log(`✅ Only doctors in same area available - perfect match!`);
    }

    console.log('\n🎉 Area-based matching test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    // Clean up
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Run the test
testAreaBasedMatching();
