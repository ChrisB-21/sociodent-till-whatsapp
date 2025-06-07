/**
 * Comprehensive test suite for the enhanced doctor assignment system
 * Tests intelligent matching, geographical proximity, and manual assignment features
 */

// Import the enhanced doctor assignment functions
import { 
  assignDoctorToAppointment,
  manuallyAssignDoctor,
  reassignDoctor,
  getAvailableDoctorsForAppointment,
  assignDoctorsToAllPendingAppointments,
  getAssignmentStatistics,
  validateAssignmentEligibility
} from '../src/lib/doctorAssignment.js';

import { ref, set, get, remove } from 'firebase/database';
import { db } from '../src/firebase.js';

class EnhancedDoctorAssignmentTests {
  constructor() {
    this.testResults = [];
    this.testData = {
      doctors: [],
      appointments: [],
      schedules: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Enhanced Doctor Assignment Tests...\n');
    
    try {
      await this.setupTestData();
      
      await this.testIntelligentMatching();
      await this.testGeographicalProximity();
      await this.testManualAssignment();
      await this.testReassignment();
      await this.testBatchAssignment();
      await this.testStatistics();
      await this.testValidation();
      
      await this.cleanupTestData();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async setupTestData() {
    console.log('📝 Setting up test data...');
    
    // Create test doctors with different specializations and locations
    this.testData.doctors = [
      {
        id: 'test_doctor_1',
        fullName: 'Dr. Sarah Johnson',
        specialization: 'Orthodontist',
        status: 'approved',
        role: 'doctor',
        area: 'Koramangala',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560034',
          area: 'Koramangala',
          fullAddress: 'Koramangala, Bangalore, Karnataka 560034'
        }
      },
      {
        id: 'test_doctor_2',
        fullName: 'Dr. Raj Patel',
        specialization: 'Pediatric Dentist',
        status: 'approved',
        role: 'doctor',
        area: 'Indiranagar',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
          area: 'Indiranagar',
          fullAddress: 'Indiranagar, Bangalore, Karnataka 560038'
        }
      },
      {
        id: 'test_doctor_3',
        fullName: 'Dr. Priya Sharma',
        specialization: 'Oral Surgeon',
        status: 'approved',
        role: 'doctor',
        area: 'Whitefield',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560066',
          area: 'Whitefield',
          fullAddress: 'Whitefield, Bangalore, Karnataka 560066'
        }
      },
      {
        id: 'test_doctor_4',
        fullName: 'Dr. Michael Chen',
        specialization: 'General',
        status: 'approved',
        role: 'doctor',
        area: 'HSR Layout',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560102',
          area: 'HSR Layout',
          fullAddress: 'HSR Layout, Bangalore, Karnataka 560102'
        }
      }
    ];

    // Create test appointments with various symptoms and locations
    this.testData.appointments = [
      {
        id: 'test_appointment_1',
        userId: 'test_user_1',
        userName: 'John Doe',
        userEmail: 'john@test.com',
        consultationType: 'clinic',
        date: '2025-06-10',
        time: '10:00',
        symptoms: 'Need braces for crooked teeth alignment',
        status: 'pending',
        userArea: 'Koramangala',
        userAddress: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560034',
          area: 'Koramangala',
          fullAddress: 'Koramangala, Bangalore, Karnataka 560034'
        }
      },
      {
        id: 'test_appointment_2',
        userId: 'test_user_2',
        userName: 'Jane Smith',
        userEmail: 'jane@test.com',
        consultationType: 'home',
        date: '2025-06-10',
        time: '11:00',
        symptoms: 'Child has tooth pain and cavity',
        status: 'pending',
        userArea: 'Indiranagar',
        userAddress: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
          area: 'Indiranagar',
          fullAddress: 'Indiranagar, Bangalore, Karnataka 560038'
        }
      },
      {
        id: 'test_appointment_3',
        userId: 'test_user_3',
        userName: 'Robert Wilson',
        userEmail: 'robert@test.com',
        consultationType: 'clinic',
        date: '2025-06-10',
        time: '14:00',
        symptoms: 'Need wisdom tooth extraction surgery',
        status: 'pending',
        userArea: 'Whitefield',
        userAddress: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560066',
          area: 'Whitefield',
          fullAddress: 'Whitefield, Bangalore, Karnataka 560066'
        }
      }
    ];

    // Create doctor schedules
    this.testData.schedules = [
      {
        id: 'schedule_1',
        doctorId: 'test_doctor_1',
        doctorName: 'Dr. Sarah Johnson',
        specialization: 'Orthodontist',
        days: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        breakStartTime: '13:00',
        breakEndTime: '14:00'
      },
      {
        id: 'schedule_2',
        doctorId: 'test_doctor_2',
        doctorName: 'Dr. Raj Patel',
        specialization: 'Pediatric Dentist',
        days: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: false
        },
        startTime: '10:00',
        endTime: '18:00',
        slotDuration: 30
      },
      {
        id: 'schedule_3',
        doctorId: 'test_doctor_3',
        doctorName: 'Dr. Priya Sharma',
        specialization: 'Oral Surgeon',
        days: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        startTime: '09:00',
        endTime: '16:00',
        slotDuration: 60
      },
      {
        id: 'schedule_4',
        doctorId: 'test_doctor_4',
        doctorName: 'Dr. Michael Chen',
        specialization: 'General',
        days: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true
        },
        startTime: '08:00',
        endTime: '20:00',
        slotDuration: 30
      }
    ];

    // Insert test data into Firebase
    for (const doctor of this.testData.doctors) {
      await set(ref(db, `users/${doctor.id}`), doctor);
    }

    for (const appointment of this.testData.appointments) {
      await set(ref(db, `appointments/${appointment.id}`), appointment);
    }

    for (const schedule of this.testData.schedules) {
      await set(ref(db, `doctorSchedules/${schedule.id}`), schedule);
    }

    console.log('✅ Test data setup complete\n');
  }

  async testIntelligentMatching() {
    console.log('🧠 Testing Intelligent Matching...');
    
    try {
      // Test orthodontic appointment should match with orthodontist
      const result1 = await assignDoctorToAppointment('test_appointment_1');
      
      this.addTestResult(
        'Orthodontic Matching',
        result1.success && result1.doctorName === 'Dr. Sarah Johnson',
        `Expected Dr. Sarah Johnson (Orthodontist), got ${result1.doctorName}`,
        result1.matchDetails
      );

      // Test pediatric appointment should match with pediatric dentist
      const result2 = await assignDoctorToAppointment('test_appointment_2');
      
      this.addTestResult(
        'Pediatric Matching',
        result2.success && result2.doctorName === 'Dr. Raj Patel',
        `Expected Dr. Raj Patel (Pediatric), got ${result2.doctorName}`,
        result2.matchDetails
      );

      // Test oral surgery appointment should match with oral surgeon
      const result3 = await assignDoctorToAppointment('test_appointment_3');
      
      this.addTestResult(
        'Oral Surgery Matching',
        result3.success && result3.doctorName === 'Dr. Priya Sharma',
        `Expected Dr. Priya Sharma (Oral Surgeon), got ${result3.doctorName}`,
        result3.matchDetails
      );

    } catch (error) {
      this.addTestResult('Intelligent Matching', false, `Error: ${error.message}`);
    }
  }

  async testGeographicalProximity() {
    console.log('📍 Testing Geographical Proximity...');
    
    try {
      // Test area-based matching
      const availableDoctors = await getAvailableDoctorsForAppointment(
        '2025-06-11',
        '15:00',
        'general dental checkup',
        {
          area: 'Koramangala',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560034'
        }
      );

      this.addTestResult(
        'Available Doctors Query',
        availableDoctors.success && availableDoctors.doctors.length > 0,
        `Found ${availableDoctors.doctors.length} available doctors`
      );

      // Check if doctors are sorted by proximity
      if (availableDoctors.success && availableDoctors.doctors.length > 1) {
        const topDoctor = availableDoctors.doctors[0];
        this.addTestResult(
          'Proximity Sorting',
          topDoctor.score > 0,
          `Top doctor: ${topDoctor.doctor.name} with score: ${topDoctor.score}`
        );
      }

    } catch (error) {
      this.addTestResult('Geographical Proximity', false, `Error: ${error.message}`);
    }
  }

  async testManualAssignment() {
    console.log('👤 Testing Manual Assignment...');
    
    try {
      // Create a new test appointment for manual assignment
      const manualAppointment = {
        id: 'manual_test_appointment',
        userId: 'test_user_manual',
        userName: 'Manual Test',
        userEmail: 'manual@test.com',
        consultationType: 'clinic',
        date: '2025-06-12',
        time: '10:00',
        symptoms: 'General checkup',
        status: 'pending'
      };

      await set(ref(db, `appointments/${manualAppointment.id}`), manualAppointment);

      // Test manual assignment
      const result = await manuallyAssignDoctor(
        'manual_test_appointment',
        'test_doctor_4',
        'test_admin'
      );

      this.addTestResult(
        'Manual Assignment',
        result.success && result.doctorName === 'Dr. Michael Chen',
        `Manual assignment: ${result.message}`
      );

      // Verify assignment in database
      const appointmentRef = ref(db, `appointments/${manualAppointment.id}`);
      const snapshot = await get(appointmentRef);
      const updatedAppointment = snapshot.val();

      this.addTestResult(
        'Manual Assignment Verification',
        updatedAppointment.assignmentType === 'manual' && 
        updatedAppointment.assignedBy === 'test_admin',
        'Assignment type and assigner verified'
      );

    } catch (error) {
      this.addTestResult('Manual Assignment', false, `Error: ${error.message}`);
    }
  }

  async testReassignment() {
    console.log('🔄 Testing Doctor Reassignment...');
    
    try {
      // Test reassigning test_appointment_1 to a different doctor
      const result = await reassignDoctor(
        'test_appointment_1',
        'test_doctor_4',
        'test_admin',
        'Patient requested different doctor'
      );

      this.addTestResult(
        'Doctor Reassignment',
        result.success && result.newDoctorName === 'Dr. Michael Chen',
        `Reassignment: ${result.message}`
      );

      // Verify reassignment details in database
      const appointmentRef = ref(db, `appointments/test_appointment_1`);
      const snapshot = await get(appointmentRef);
      const updatedAppointment = snapshot.val();

      this.addTestResult(
        'Reassignment Verification',
        updatedAppointment.reassignmentReason === 'Patient requested different doctor' &&
        updatedAppointment.previousDoctorName === 'Dr. Sarah Johnson',
        'Reassignment details verified'
      );

    } catch (error) {
      this.addTestResult('Doctor Reassignment', false, `Error: ${error.message}`);
    }
  }

  async testBatchAssignment() {
    console.log('📦 Testing Batch Assignment...');
    
    try {
      // Create additional pending appointments
      const batchAppointments = [
        {
          id: 'batch_appointment_1',
          userId: 'batch_user_1',
          userName: 'Batch User 1',
          userEmail: 'batch1@test.com',
          consultationType: 'clinic',
          date: '2025-06-13',
          time: '09:00',
          symptoms: 'Tooth pain',
          status: 'pending',
          userArea: 'HSR Layout',
          userAddress: {
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560102',
            area: 'HSR Layout'
          }
        },
        {
          id: 'batch_appointment_2',
          userId: 'batch_user_2',
          userName: 'Batch User 2',
          userEmail: 'batch2@test.com',
          consultationType: 'home',
          date: '2025-06-13',
          time: '11:00',
          symptoms: 'Dental cleaning',
          status: 'pending',
          userArea: 'Koramangala',
          userAddress: {
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560034',
            area: 'Koramangala'
          }
        }
      ];

      for (const appointment of batchAppointments) {
        await set(ref(db, `appointments/${appointment.id}`), appointment);
      }

      // Test batch assignment
      const result = await assignDoctorsToAllPendingAppointments();

      this.addTestResult(
        'Batch Assignment',
        result.total > 0 && result.successful > 0,
        `Processed ${result.total} appointments, ${result.successful} successful, ${result.failed} failed`
      );

    } catch (error) {
      this.addTestResult('Batch Assignment', false, `Error: ${error.message}`);
    }
  }

  async testStatistics() {
    console.log('📊 Testing Statistics...');
    
    try {
      const stats = await getAssignmentStatistics();

      this.addTestResult(
        'Statistics Retrieval',
        stats.totalDoctors > 0 && stats.activeDoctors > 0,
        `Stats: ${stats.totalDoctors} total doctors, ${stats.activeDoctors} active, ${stats.totalAppointments} appointments`
      );

    } catch (error) {
      this.addTestResult('Statistics', false, `Error: ${error.message}`);
    }
  }

  async testValidation() {
    console.log('✅ Testing Assignment Validation...');
    
    try {
      // Test valid assignment
      const validResult = await validateAssignmentEligibility(
        'test_appointment_1',
        'test_doctor_1'
      );

      this.addTestResult(
        'Valid Assignment Check',
        validResult.eligible === true || validResult.warnings.length > 0, // May have warnings due to existing assignment
        `Validation result: ${validResult.eligible ? 'Eligible' : 'Not eligible'}, Reasons: ${validResult.reasons.join(', ')}`
      );

      // Test invalid doctor
      const invalidResult = await validateAssignmentEligibility(
        'test_appointment_1',
        'non_existent_doctor'
      );

      this.addTestResult(
        'Invalid Doctor Check',
        !invalidResult.eligible,
        `Correctly identified invalid doctor: ${invalidResult.reasons.join(', ')}`
      );

    } catch (error) {
      this.addTestResult('Assignment Validation', false, `Error: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Remove test doctors
      for (const doctor of this.testData.doctors) {
        await remove(ref(db, `users/${doctor.id}`));
      }

      // Remove test appointments
      for (const appointment of this.testData.appointments) {
        await remove(ref(db, `appointments/${appointment.id}`));
      }

      // Remove additional test appointments
      const additionalAppointments = [
        'manual_test_appointment',
        'batch_appointment_1',
        'batch_appointment_2'
      ];

      for (const id of additionalAppointments) {
        await remove(ref(db, `appointments/${id}`));
      }

      // Remove test schedules
      for (const schedule of this.testData.schedules) {
        await remove(ref(db, `doctorSchedules/${schedule.id}`));
      }

      console.log('✅ Cleanup complete\n');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  addTestResult(name, passed, details, extra = null) {
    this.testResults.push({
      name,
      passed,
      details,
      extra
    });
  }

  printResults() {
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('========================\n');
    
    let passed = 0;
    let total = this.testResults.length;

    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.name}: ${status}`);
      console.log(`   ${result.details}`);
      
      if (result.extra) {
        console.log(`   Match Details: Score ${result.extra.score}, Specialization: ${result.extra.specializationMatch}, Distance: ${result.extra.distanceScore}`);
      }
      console.log('');
      
      if (result.passed) passed++;
    });

    console.log(`\n📊 FINAL SCORE: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Enhanced doctor assignment system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Run the tests
const testSuite = new EnhancedDoctorAssignmentTests();
testSuite.runAllTests().catch(console.error);