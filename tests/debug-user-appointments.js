// Debug script to check current user state and appointments
// Open browser console and run this to see what's happening

console.log('=== SocioDent Appointment Debug ===');

// Check localStorage state
console.log('Current localStorage state:');
const keys = ['userId', 'uid', 'userEmail', 'userName', 'isAuthenticated', 'userRole'];
keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value}`);
});

// Check the combined user ID (our fix logic)
const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
console.log('\nCombined userId (our fix):', userId);

// If we have Firebase access, let's check appointments
if (typeof firebase !== 'undefined' && firebase.database) {
    console.log('\nChecking Firebase appointments...');
    
    const db = firebase.database();
    const appointmentsRef = db.ref('appointments');
    
    appointmentsRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const appointments = snapshot.val();
            console.log('Total appointments in database:', Object.keys(appointments).length);
            
            // Check appointments for current user
            const userAppointments = Object.entries(appointments).filter(([_, appointment]) => {
                return appointment.patientId === userId || 
                       appointment.userId === userId ||
                       appointment.userEmail === localStorage.getItem('userEmail');
            });
            
            console.log(`Appointments for user ${userId}:`, userAppointments.length);
            
            if (userAppointments.length > 0) {
                console.log('User appointments found:', userAppointments);
            } else {
                console.log('No appointments found for this user.');
                
                // Let's see what user IDs exist in appointments
                const allUserIds = Object.values(appointments).map(apt => ({
                    patientId: apt.patientId,
                    userId: apt.userId,
                    userEmail: apt.userEmail,
                    userName: apt.userName
                }));
                console.log('All user IDs in appointments:', allUserIds);
            }
        } else {
            console.log('No appointments found in database');
        }
    });
} else {
    console.log('Firebase not available in this context');
}

// Instructions
console.log('\n=== Instructions ===');
console.log('1. Copy this entire script');
console.log('2. Open browser console (F12)');
console.log('3. Paste and run the script');
console.log('4. Check the output to see what user ID is being used');
console.log('5. Verify if appointments exist for that user ID');
