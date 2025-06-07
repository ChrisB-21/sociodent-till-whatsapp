import { ref, set, get } from "firebase/database";
import { db } from "@/firebase";

// Function to verify Firebase database connection
export async function verifyDatabaseConnection() {
  try {
    // Create a temporary reference for testing
    const testRef = ref(db, "connectionTest");
    
    // Try to write to the database
    await set(testRef, {
      timestamp: Date.now(),
      message: "Connection test successful"
    });
    
    // Try to read from the database
    const snapshot = await get(testRef);
    
    // Return connection state
    return {
      success: snapshot.exists(),
      data: snapshot.val(),
      errorMessage: null
    };
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return {
      success: false,
      data: null,
      errorMessage: error.message || "Unknown error occurred"
    };
  }
}

// Function to add a test user to Firebase 
export async function addTestUser() {
  try {
    const testUserId = `test-user-${Date.now()}`;
    const testUserRef = ref(db, `users/${testUserId}`);
    
    const userData = {
      fullName: `Test User ${Math.floor(Math.random() * 1000)}`,
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      role: "user",
      registeredAt: new Date().toISOString(),
      age: Math.floor(Math.random() * 50) + 18,
      allergies: "None",
      uid: testUserId
    };
    
    await set(testUserRef, userData);
    return { 
      success: true, 
      id: testUserId, 
      user: userData 
    };
  } catch (error) {
    console.error("Error adding test user:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Function to list all users in the database
export async function listAllUsers() {
  try {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        users.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      return {
        success: true,
        users,
        count: users.length
      };
    } else {
      return {
        success: true,
        users: [],
        count: 0
      };
    }
  } catch (error) {
    console.error("Error listing users:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
