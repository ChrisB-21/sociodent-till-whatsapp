// Import the Firebase SDK
import { ref, set } from "firebase/database";
import { db } from "@/firebase";

// Function to add a test user to Firebase
export async function addTestUserToFirebase() {
  const testUserId = `test-user-${Date.now()}`;
  const testUserRef = ref(db, `users/${testUserId}`);
  
  const testUserData = {
    fullName: `Test User ${Math.floor(Math.random() * 1000)}`,
    email: `test${Math.floor(Math.random() * 1000)}@example.com`,
    role: "user",
    registeredAt: new Date().toISOString(),
    phone: `555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    age: Math.floor(Math.random() * 50) + 18,
    allergies: "None"
  };
  
  await set(testUserRef, testUserData);
  return { id: testUserId, ...testUserData };
}
