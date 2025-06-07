// Test file upload functionality
import { storage } from './src/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function testFileUpload() {
  try {
    console.log('Testing Firebase Storage upload...');
    
    // Create a test file
    const testContent = new Blob(['This is a test file for Firebase Storage upload.'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test-upload.txt', { type: 'text/plain' });
    
    const userId = 'test-user-' + Date.now();
    const filePath = `users/${userId}/reports/${testFile.name}`;
    
    console.log('Uploading to:', filePath);
    
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, testFile);
    const downloadURL = await getDownloadURL(fileRef);
    
    console.log('Upload successful!');
    console.log('Download URL:', downloadURL);
    console.log('File path:', filePath);
    
    return { downloadURL, filePath };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Make it available globally for testing
window.testFileUpload = testFileUpload;

export { testFileUpload };
