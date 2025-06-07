// Firebase Debug Helper
// This file provides utility functions to help debug Firebase connection issues

import { db } from "@/firebase";
import { ref, set, get, onValue } from "firebase/database";

/**
 * Run a complete Firebase database test
 * This will:
 * 1. Test connection
 * 2. Verify database structure
 * 3. Attempt to add a test document
 * 4. Retrieve the test document
 */
export async function runFirebaseTests() {
  try {
    console.group("🔍 Firebase Database Tests");
    
    // Test 1: Check database connection
    console.log("Test 1: Checking database connection...");
    const rootRef = ref(db, "/");
    const snapshot = await get(rootRef);
    
    console.log("Database connection:", snapshot.exists() ? "✅ SUCCESS" : "❌ FAILED");
    console.log("Database structure:", snapshot.exists() ? Object.keys(snapshot.val() || {}) : "No data");
    
    // Test 2: Write test data
    console.log("\nTest 2: Writing test data...");
    const testRef = ref(db, "connectionTest");
    const testData = {
      timestamp: new Date().toISOString(),
      message: "Connection test"
    };
    
    await set(testRef, testData);
    console.log("Write test:", "✅ SUCCESS");
    
    // Test 3: Read test data back
    console.log("\nTest 3: Reading test data...");
    const testSnapshot = await get(testRef);
    
    if (testSnapshot.exists()) {
      console.log("Read test:", "✅ SUCCESS");
      console.log("Data:", testSnapshot.val());
    } else {
      console.log("Read test:", "❌ FAILED - No data found");
    }
    
    // Test 4: Check users path
    console.log("\nTest 4: Checking users collection...");
    const usersRef = ref(db, "users");
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const userCount = Object.keys(usersData).length;
      console.log("Users test:", "✅ SUCCESS");
      console.log(`Found ${userCount} users in the database`);
      
      // Show sample of first user
      if (userCount > 0) {
        const firstUserId = Object.keys(usersData)[0];
        console.log("Sample user:", {
          id: firstUserId,
          ...usersData[firstUserId]
        });
      }
    } else {
      console.log("Users test:", "⚠️ WARNING - No users found");
      console.log("Creating test user...");
      
      // Add a test user
      const testUserId = `test-user-${Date.now()}`;
      const testUserRef = ref(db, `users/${testUserId}`);
      
      const userData = {
        fullName: "Debug Test User",
        email: `test${Date.now()}@example.com`,
        phone: "5555555555",
        role: "user",
        registeredAt: new Date().toISOString(),
        age: 30,
        allergies: "None",
        uid: testUserId
      };
      
      await set(testUserRef, userData);
      console.log("Test user created:", userData);
    }
    
    console.groupEnd();
    return {
      success: true,
      message: "All Firebase tests completed"
    };
  } catch (error) {
    console.error("Firebase test error:", error);
    console.groupEnd();
    return {
      success: false,
      error: error.message || "Unknown error"
    };
  }
}

/**
 * Add a test user to the database
 */
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
    console.log("Test user added:", { id: testUserId, ...userData });
    return { 
      success: true, 
      user: { id: testUserId, ...userData } 
    };
  } catch (error) {
    console.error("Error adding test user:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
