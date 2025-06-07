// Script to add a test user from the browser console
// Copy and paste this into your browser console when visiting the admin portal

import { ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Initialize Firebase with your config
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

// Function to add a test user
async function addTestUser() {
  try {
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
    
    console.log("Adding test user:", testUserData);
    await set(testUserRef, testUserData);
    console.log("Test user added successfully with ID:", testUserId);
    return { id: testUserId, ...testUserData };
  } catch (error) {
    console.error("Error adding test user:", error);
  }
}

// Call the function
addTestUser();
