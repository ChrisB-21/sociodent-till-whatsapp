// Test Firebase Database Connection and Appointment Retrieval
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAObQWt2VT4PLJz-6i3m0yfyl8rTewiW_0",
  authDomain: "sociodent-smile-database.firebaseapp.com",
  databaseURL: "https://sociodent-smile-database-default-rtdb.firebaseio.com",
  projectId: "sociodent-smile-database",
  storageBucket: "sociodent-smile-database.firebasestorage.app",
  messagingSenderId: "820086894749",
  appId: "1:820086894749:web:f22fb0a0107edcdb332474",
  measurementId: "G-D215D2Y24L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log('Testing Firebase Database Connection...');

// Test 1: Check if we can read the database structure
console.log('\n=== Test 1: Database Structure ===');
const rootRef = ref(db, '/');
onValue(rootRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    console.log('Database root keys:', Object.keys(data || {}));
    
    // Check appointments specifically
    if (data.appointments) {
      console.log('Appointments found:', Object.keys(data.appointments).length);
      console.log('Sample appointment keys:', Object.keys(data.appointments).slice(0, 3));
    } else {
      console.log('No appointments found in database');
    }
    
    // Check users specifically
    if (data.users) {
      console.log('Users found:', Object.keys(data.users).length);
      const users = data.users;
      const roles = {};
      Object.values(users).forEach(user => {
        const role = user.role || 'unknown';
        roles[role] = (roles[role] || 0) + 1;
      });
      console.log('User roles distribution:', roles);
    } else {
      console.log('No users found in database');
    }
  } else {
    console.log('Database appears to be empty or permission denied');
  }
}, (error) => {
  console.error('Error reading database:', error.message);
  console.log('This might be due to authentication requirements');
});

// Test 2: Try to create a test appointment
console.log('\n=== Test 2: Creating Test Appointment ===');
const testAppointment = {
  patientId: 'test-patient-123',
  doctorId: 'test-doctor-456',
  appointmentDate: '2024-12-01',
  appointmentTime: '10:00 AM',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  notes: 'Test appointment created for debugging purposes'
};

const appointmentsRef = ref(db, 'appointments');
const newAppointmentRef = push(appointmentsRef);

set(newAppointmentRef, testAppointment)
  .then(() => {
    console.log('Test appointment created successfully with ID:', newAppointmentRef.key);
    
    // Now try to retrieve it
    onValue(newAppointmentRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('Retrieved test appointment:', snapshot.val());
      } else {
        console.log('Could not retrieve the test appointment');
      }
    });
  })
  .catch((error) => {
    console.error('Error creating test appointment:', error.message);
    console.log('This is expected if authentication is required');
  });

// Test 3: Check specific user's appointments
console.log('\n=== Test 3: User-Specific Appointment Query ===');
const testUserId = 'test-patient-123';
onValue(appointmentsRef, (snapshot) => {
  if (snapshot.exists()) {
    const appointments = snapshot.val();
    const userAppointments = Object.entries(appointments)
      .filter(([_, appointment]) => appointment.patientId === testUserId);
    
    console.log(`Found ${userAppointments.length} appointments for user ${testUserId}`);
    userAppointments.forEach(([id, appointment]) => {
      console.log(`- Appointment ${id}:`, {
        doctorId: appointment.doctorId,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        status: appointment.status
      });
    });
  } else {
    console.log('No appointments data available for user query');
  }
}, (error) => {
  console.error('Error querying user appointments:', error.message);
});

// Keep the script running for a few seconds to see results
setTimeout(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}, 5000);
