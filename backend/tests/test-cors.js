// Test Firebase Storage CORS Configuration
import fetch from 'node-fetch';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";

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

// Initialize Storage and get a reference to the service
const storage = getStorage(app);

// Test file upload and download
async function testStorage() {
  try {
    // Create a test file
    const testContent = 'Test content: ' + new Date().toISOString();
    const storageRef = ref(storage, 'test/cors-test.txt');
    
    console.log('Uploading test file...');
    
    // Upload test content
    await uploadString(storageRef, testContent);
    console.log('Test file uploaded successfully');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);
    
    // Test CORS functionality with different headers
    console.log('Testing CORS with various headers...');
    
    // Test 1: Basic fetch
    const response1 = await fetch(downloadURL);
    console.log('Test 1 - Basic fetch:', 
      response1.status, 
      response1.statusText, 
      response1.headers.get('access-control-allow-origin') || 'No CORS header'
    );
    
    // Test 2: With Origin header
    const response2 = await fetch(downloadURL, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('Test 2 - With Origin header:', 
      response2.status, 
      response2.statusText, 
      response2.headers.get('access-control-allow-origin') || 'No CORS header'
    );
    
    // Test 3: With OPTIONS method (preflight)
    const response3 = await fetch(downloadURL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('Test 3 - OPTIONS preflight:', 
      response3.status, 
      response3.statusText,
      'CORS headers:',
      response3.headers.get('access-control-allow-origin') || 'No CORS header',
      response3.headers.get('access-control-allow-methods') || 'No methods header',
      response3.headers.get('access-control-allow-headers') || 'No headers header'
    );
    
    if (response1.ok && response2.ok) {
      console.log('✅ CORS configuration is working correctly for basic requests!');
    } else {
      console.error('❌ CORS configuration is not working correctly for basic requests');
    }
    
  } catch (error) {
    console.error('Error in storage test:', error);
  }
}

testStorage();
