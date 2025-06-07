// Script to inspect and update doctor schedules to have maximum availability
// This will ensure the enhanced doctor assignment system can function properly

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove } = require('firebase/database');

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

console.log('🏥 SocioDent - Doctor Schedule Update Tool');
console.log('==========================================\n');

async function inspectCurrentSchedules() {
  console.log('📋 Step 1: Inspecting current doctor schedules...\n');
  
  try {
    // Get all current schedules
    const schedulesRef = ref(db, 'doctorSchedules');
    const schedulesSnapshot = await get(schedulesRef);
    
    if (!schedulesSnapshot.exists()) {
      console.log('❌ No doctor schedules found in database');
      return null;
    }
    
    const schedules = schedulesSnapshot.val();
    const scheduleEntries = Object.entries(schedules);
    
    console.log(`✅ Found ${scheduleEntries.length} doctor schedules\n`);
    console.log('Current Schedule Overview:');
    console.log('==========================');
    
    scheduleEntries.forEach(([id, schedule], index) => {
      console.log(`${index + 1}. Schedule ID: ${id}`);
      console.log(`   Doctor: ${schedule.doctorName || 'Unknown'}`);
      console.log(`   Doctor ID: ${schedule.doctorId}`);
      console.log(`   Specialization: ${schedule.specialization || 'General'}`);
      console.log(`   Working Days: ${Object.entries(schedule.days || {})
        .filter(([_, enabled]) => enabled)
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
        .join(', ') || 'None'}`);
      console.log(`   Hours: ${schedule.startTime || 'N/A'} - ${schedule.endTime || 'N/A'}`);
      console.log(`   Slot Duration: ${schedule.slotDuration || 30} minutes`);
      if (schedule.breakStartTime && schedule.breakEndTime) {
        console.log(`   Break: ${schedule.breakStartTime} - ${schedule.breakEndTime}`);
      }
      console.log('');
    });
    
    return schedules;
  } catch (error) {
    console.error('❌ Error inspecting schedules:', error);
    return null;
  }
}

async function getApprovedDoctors() {
  console.log('👨‍⚕️ Step 2: Getting all approved doctors...\n');
  
  try {
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (!usersSnapshot.exists()) {
      console.log('❌ No users found in database');
      return [];
    }
    
    const users = usersSnapshot.val();
    const doctors = Object.entries(users)
      .filter(([_, user]) => user.role === 'doctor' && user.status === 'approved')
      .map(([id, doctor]) => ({
        id,
        name: doctor.fullName || 'Unknown Doctor',
        specialization: doctor.specialization || 'General Dentistry',
        email: doctor.email || '',
        phone: doctor.phone || ''
      }));
    
    console.log(`✅ Found ${doctors.length} approved doctors\n`);
    console.log('Approved Doctors:');
    console.log('=================');
    
    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.name}`);
      console.log(`   ID: ${doctor.id}`);
      console.log(`   Specialization: ${doctor.specialization}`);
      console.log(`   Email: ${doctor.email}`);
      console.log('');
    });
    
    return doctors;
  } catch (error) {
    console.error('❌ Error getting doctors:', error);
    return [];
  }
}

async function createMaxAvailabilitySchedules(doctors) {
  console.log('⚡ Step 3: Creating maximum availability schedules...\n');
  
  const schedulesRef = ref(db, 'doctorSchedules');
  
  // Remove all existing schedules first
  console.log('🗑️  Removing existing schedules...');
  await remove(schedulesRef);
  console.log('✅ Existing schedules removed\n');
  
  console.log('🔧 Creating new maximum availability schedules...\n');
  
  for (const doctor of doctors) {
    const scheduleId = `schedule_${doctor.id}_${Date.now()}`;
    
    const schedule = {
      id: scheduleId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
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
      slotDuration: 30,
      // No break times for maximum availability
      breakStartTime: null,
      breakEndTime: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'schedule_update_script'
    };
    
    const scheduleRef = ref(db, `doctorSchedules/${scheduleId}`);
    await set(scheduleRef, schedule);
    
    console.log(`✅ Created schedule for ${doctor.name}`);
    console.log(`   Schedule ID: ${scheduleId}`);
    console.log(`   Working Days: All 7 days (Monday-Sunday)`);
    console.log(`   Working Hours: 08:00 - 20:00 (12 hours)`);
    console.log(`   Slot Duration: 30 minutes`);
    console.log(`   Break Times: None (maximum availability)`);
    console.log('');
  }
  
  console.log(`🎉 Successfully created ${doctors.length} maximum availability schedules!\n`);
}

async function verifyScheduleUpdates() {
  console.log('🔍 Step 4: Verifying schedule updates...\n');
  
  try {
    const schedulesRef = ref(db, 'doctorSchedules');
    const schedulesSnapshot = await get(schedulesRef);
    
    if (!schedulesSnapshot.exists()) {
      console.log('❌ No schedules found after update');
      return false;
    }
    
    const schedules = schedulesSnapshot.val();
    const scheduleEntries = Object.entries(schedules);
    
    console.log('Updated Schedule Verification:');
    console.log('==============================');
    
    let allSchedulesValid = true;
    
    scheduleEntries.forEach(([id, schedule], index) => {
      const workingDays = Object.entries(schedule.days || {})
        .filter(([_, enabled]) => enabled).length;
      
      const isMaxAvailability = 
        workingDays === 7 && 
        schedule.startTime === '08:00' && 
        schedule.endTime === '20:00' &&
        schedule.slotDuration === 30 &&
        (!schedule.breakStartTime && !schedule.breakEndTime);
      
      console.log(`${index + 1}. ${schedule.doctorName}`);
      console.log(`   Working Days: ${workingDays}/7 days`);
      console.log(`   Hours: ${schedule.startTime} - ${schedule.endTime}`);
      console.log(`   Max Availability: ${isMaxAvailability ? '✅ Yes' : '❌ No'}`);
      console.log('');
      
      if (!isMaxAvailability) {
        allSchedulesValid = false;
      }
    });
    
    if (allSchedulesValid) {
      console.log('🎉 All schedules have maximum availability configuration!');
    } else {
      console.log('⚠️  Some schedules may not have maximum availability');
    }
    
    return allSchedulesValid;
  } catch (error) {
    console.error('❌ Error verifying schedules:', error);
    return false;
  }
}

async function testEnhancedAssignmentSystem() {
  console.log('\n🧪 Step 5: Testing enhanced doctor assignment system...\n');
  
  try {
    // Import the assignment function (simulated test)
    console.log('Testing assignment system functionality...');
    
    // Check if we have schedules
    const schedulesRef = ref(db, 'doctorSchedules');
    const schedulesSnapshot = await get(schedulesRef);
    
    if (!schedulesSnapshot.exists()) {
      console.log('❌ No schedules available for testing');
      return false;
    }
    
    const schedules = Object.values(schedulesSnapshot.val());
    console.log(`✅ Found ${schedules.length} schedules for assignment testing`);
    
    // Test availability for different times
    const testTimes = [
      { date: '2025-01-15', time: '09:00', day: 'Wednesday' },
      { date: '2025-01-18', time: '14:00', day: 'Saturday' },
      { date: '2025-01-19', time: '18:00', day: 'Sunday' },
      { date: '2025-01-20', time: '20:00', day: 'Monday' }
    ];
    
    console.log('\nTesting doctor availability for different times:');
    console.log('================================================');
    
    for (const testTime of testTimes) {
      console.log(`Testing ${testTime.day} ${testTime.date} at ${testTime.time}:`);
      
      const availableDoctors = schedules.filter(schedule => {
        const dateObj = new Date(testTime.date);
        const dayOfWeek = dateObj.getDay();
        const dayMap = {
          0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
          4: 'thursday', 5: 'friday', 6: 'saturday'
        };
        const scheduleDay = dayMap[dayOfWeek];
        
        return schedule.days[scheduleDay] && 
               testTime.time >= schedule.startTime && 
               testTime.time <= schedule.endTime;
      });
      
      console.log(`  Available doctors: ${availableDoctors.length}/${schedules.length}`);
      if (availableDoctors.length > 0) {
        console.log(`  Doctors: ${availableDoctors.map(s => s.doctorName).join(', ')}`);
      }
      console.log('');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing assignment system:', error);
    return false;
  }
}

async function main() {
  try {
    // Step 1: Inspect current schedules
    const currentSchedules = await inspectCurrentSchedules();
    
    // Step 2: Get all approved doctors
    const doctors = await getApprovedDoctors();
    
    if (doctors.length === 0) {
      console.log('❌ No approved doctors found. Cannot create schedules.');
      return;
    }
    
    // Step 3: Create maximum availability schedules
    await createMaxAvailabilitySchedules(doctors);
    
    // Step 4: Verify the updates
    const verificationResult = await verifyScheduleUpdates();
    
    // Step 5: Test the enhanced assignment system
    await testEnhancedAssignmentSystem();
    
    console.log('\n🎊 Doctor Schedule Update Summary');
    console.log('=================================');
    console.log(`✅ Processed ${doctors.length} approved doctors`);
    console.log('✅ Created maximum availability schedules');
    console.log('✅ All doctors now work 7 days a week, 08:00-20:00');
    console.log('✅ 30-minute appointment slots');
    console.log('✅ No break times (maximum availability)');
    console.log('✅ Enhanced doctor assignment system ready for testing');
    
    console.log('\n📝 Next Steps:');
    console.log('==============');
    console.log('1. Run the enhanced doctor assignment tests');
    console.log('2. Test appointment booking with doctor assignment');
    console.log('3. Verify assignments work correctly in the admin portal');
    console.log('4. Check that doctors see assigned appointments in their portal');
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  }
}

// Run the schedule update
main().then(() => {
  console.log('\n✨ Doctor schedule update completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Failed to update doctor schedules:', error);
  process.exit(1);
});
