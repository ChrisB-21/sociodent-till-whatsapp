// Test script to create an appointment with a report file for testing admin portal display
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set } from 'firebase/database';

// Firebase configuration (using the same config as the app)
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
const database = getDatabase(app);

async function createTestAppointment() {
  try {
    console.log('Creating test appointment with report file...');
    
    // Create test appointment data with report file
    const appointmentData = {
      userId: "test_user_123",
      userName: "John Doe",
      userEmail: "john.doe@example.com",
      consultationType: "virtual",
      date: "2024-12-14",
      time: "10:00",
      symptoms: "Dental pain and sensitivity",
      hasReport: true,
      paymentMethod: "razorpay",
      paymentAmount: 500,
      status: "pending",
      createdAt: Date.now(),
      reportFile: {
        fileName: "dental-report-sample.pdf",
        fileUrl: "https://firebasestorage.googleapis.com/v0/b/sociodent-smile-database.firebasestorage.app/o/users%2Ftest_user_123%2Freports%2Fdental-report-sample.pdf?alt=media&token=sample-token",
        fileSize: 125000,
        fileType: "application/pdf",
        filePath: "users/test_user_123/reports/dental-report-sample.pdf",
        uploadedAt: Date.now() - 3600000 // 1 hour ago
      }
    };
    
    // Create reference to appointments collection
    const appointmentsRef = ref(database, 'appointments');
    
    // Create new appointment
    const newAppointmentRef = push(appointmentsRef);
    await set(newAppointmentRef, appointmentData);
    
    console.log('✅ Test appointment created successfully!');
    console.log('Appointment ID:', newAppointmentRef.key);
    console.log('Report file details:', appointmentData.reportFile);
    
    // Create another test appointment without report file for comparison
    const appointmentDataNoReport = {
      userId: "test_user_456",
      userName: "Jane Smith",
      userEmail: "jane.smith@example.com",
      consultationType: "clinic",
      date: "2024-12-15",
      time: "14:30",
      symptoms: "Routine checkup",
      hasReport: false,
      paymentMethod: "cash",
      paymentAmount: 300,
      status: "pending",
      createdAt: Date.now()
    };
    
    const newAppointmentRef2 = push(appointmentsRef);
    await set(newAppointmentRef2, appointmentDataNoReport);
    
    console.log('✅ Test appointment without report created successfully!');
    console.log('Appointment ID:', newAppointmentRef2.key);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test appointment:', error);
    process.exit(1);
  }
}

createTestAppointment();
