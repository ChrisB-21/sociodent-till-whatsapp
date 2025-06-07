// Check Backend Doctor Approval Status
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update, query, orderByChild, equalTo } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyCnFCq0p-eIHGU1wOVV4JZ4J_lRfEtxnLY",
    authDomain: "socio-dent.firebaseapp.com",
    databaseURL: "https://socio-dent-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "socio-dent",
    storageBucket: "socio-dent.appspot.com",
    messagingSenderId: "717754172862",
    appId: "1:717754172862:web:86ac840ff9e4d1a8c4b7df",
    measurementId: "G-EWGL5XXRMR"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkDoctorApprovalStatus() {
    console.log('🩺 SocioDent - Backend Doctor Approval Status Check');
    console.log('=================================================');

    try {
        // Get all doctors from the database
        console.log('\n1. Fetching all doctors from database...');
        const usersRef = ref(db, 'users');
        const doctorsQuery = query(usersRef, orderByChild('role'), equalTo('doctor'));
        const snapshot = await get(doctorsQuery);

        if (!snapshot.exists()) {
            console.log('❌ No doctors found in database');
            return;
        }

        const doctors = snapshot.val();
        const doctorEntries = Object.entries(doctors);
        
        console.log(`✅ Found ${doctorEntries.length} doctors in database\n`);

        // Display each doctor's status
        console.log('📋 Doctor Status Report:');
        console.log('========================');
        
        doctorEntries.forEach(([uid, doctor], index) => {
            console.log(`${index + 1}. ${doctor.fullName || 'Unknown'}`);
            console.log(`   UID: ${uid}`);
            console.log(`   Email: ${doctor.email || 'Unknown'}`);
            console.log(`   Status: ${doctor.status || 'undefined'}`);
            console.log(`   Role: ${doctor.role}`);
            console.log(`   Created: ${doctor.createdAt ? new Date(doctor.createdAt).toLocaleString() : 'Unknown'}`);
            console.log(`   Updated: ${doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleString() : 'Never'}`);
            console.log('   ---');
        });

        // Check for pending doctors
        const pendingDoctors = doctorEntries.filter(([_, doctor]) => 
            doctor.status === 'pending' || !doctor.status
        );

        if (pendingDoctors.length > 0) {
            console.log(`\n⚠️  Found ${pendingDoctors.length} pending doctors:`);
            pendingDoctors.forEach(([uid, doctor]) => {
                console.log(`   - ${doctor.fullName} (${uid})`);
            });

            // Ask if we should approve the first pending doctor for testing
            console.log('\n🔧 Testing approval workflow...');
            const testDoctorUid = pendingDoctors[0][0];
            const testDoctor = pendingDoctors[0][1];
            
            console.log(`\n📝 Approving test doctor: ${testDoctor.fullName} (${testDoctorUid})`);
            
            const userRef = ref(db, `users/${testDoctorUid}`);
            await update(userRef, {
                status: 'approved',
                updatedAt: Date.now()
            });
            
            console.log('✅ Test doctor approved in database');
            
            // Verify the update
            const verifySnapshot = await get(userRef);
            const updatedDoctor = verifySnapshot.val();
            console.log('\n🔍 Verification - Updated doctor data:');
            console.log(`   Status: ${updatedDoctor.status}`);
            console.log(`   Updated At: ${new Date(updatedDoctor.updatedAt).toLocaleString()}`);
            
            console.log('\n📋 What should happen now:');
            console.log('1. Doctor logs in or refreshes page');
            console.log('2. AuthContext.onAuthStateChanged detects role="doctor"');
            console.log('3. AuthContext fetches fresh data from database');
            console.log('4. AuthContext sets user.status="approved"');
            console.log('5. DoctorPortal checks: user.status !== "approved" → FALSE');
            console.log('6. DoctorPortal shows full portal instead of pending screen');
            
            return { testDoctorUid, testDoctor: updatedDoctor };
        } else {
            console.log('\n✅ All doctors are already approved');
        }

    } catch (error) {
        console.error('❌ Error checking doctor approval status:', error);
        throw error;
    }
}

async function testAuthContextLogic(doctorUid) {
    console.log('\n🔄 Testing AuthContext Logic');
    console.log('============================');
    
    try {
        // Simulate what AuthContext does
        console.log(`1. Simulating AuthContext fetch for doctor: ${doctorUid}`);
        
        const userRef = ref(db, `users/${doctorUid}`);
        const userSnapshot = await get(userRef);
        
        if (!userSnapshot.exists()) {
            console.log('❌ Doctor not found in database');
            return;
        }
        
        const userData = userSnapshot.val();
        console.log('2. Fresh data from database:', JSON.stringify(userData, null, 2));
        
        // This is what AuthContext creates
        const userInfo = {
            uid: doctorUid,
            role: userData.role || 'doctor',
            name: userData.fullName || 'Doctor',
            email: userData.email || undefined,
            status: userData.status, // This is the key field!
        };
        
        console.log('3. AuthContext would create user object:', JSON.stringify(userInfo, null, 2));
        
        // Test DoctorPortal logic
        const isLoading = false;
        const hasUser = !!userInfo;
        const isDoctor = userInfo.role === 'doctor';
        const isApproved = userInfo.status === 'approved';
        
        console.log('\n4. DoctorPortal condition check:');
        console.log(`   !isLoading: ${!isLoading}`);
        console.log(`   user exists: ${hasUser}`);
        console.log(`   user.role === 'doctor': ${isDoctor}`);
        console.log(`   user.status !== 'approved': ${!isApproved}`);
        
        const shouldShowPending = !isLoading && hasUser && isDoctor && !isApproved;
        console.log(`\n5. Final result: shouldShowPending = ${shouldShowPending}`);
        
        if (shouldShowPending) {
            console.log('❌ ISSUE: Doctor would still see pending approval screen');
            console.log(`   Root cause: user.status = "${userInfo.status}"`);
        } else {
            console.log('✅ SUCCESS: Doctor would see full portal');
        }
        
        return { userInfo, shouldShowPending };
        
    } catch (error) {
        console.error('❌ Error testing AuthContext logic:', error);
        throw error;
    }
}

// Run the tests
async function runTests() {
    try {
        const approvalResult = await checkDoctorApprovalStatus();
        
        if (approvalResult) {
            console.log('\n' + '='.repeat(50));
            await testAuthContextLogic(approvalResult.testDoctorUid);
        }
        
        console.log('\n🎯 Next Steps:');
        console.log('1. Open browser developer console');
        console.log('2. Navigate to doctor login page');
        console.log('3. Log in as the approved doctor');
        console.log('4. Check console logs for AuthContext debugging');
        console.log('5. Verify if pending screen still appears');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTests();
