// This file contains the fixed code to fetch reports from user folders structure
import { getDownloadURL, listAll, ref as storageRef, getMetadata } from 'firebase/storage';
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database';
import { db, storage } from '@/firebase';

/**
 * Fetch user reports from Firebase Storage using the correct folder structure
 * @returns Array of user reports
 */
export async function fetchUserReports() {
  try {
    // Get the root reference to the users directory
    const usersRef = storageRef(storage, 'users');
    // List all user folders
    const userFolders = await listAll(usersRef);
    let allReports = [];

    // Process each user folder
    for (const userFolder of userFolders.prefixes) {
      try {
        const userId = userFolder.name;
        // Look for reports folder within user folder
        const userReportsRef = storageRef(storage, `users/${userId}/reports`);
        
        // Try to list files in the reports folder
        try {
          const reportFiles = await listAll(userReportsRef);
          
          // Process each report file
          const userReportsPromises = reportFiles.items.map(async (fileRef) => {
            try {
              const [url, metadata] = await Promise.all([
                getDownloadURL(fileRef),
                getMetadata(fileRef)
              ]);
              
              // Get user info from appointments if available
              const appointmentRef = dbRef(db, 'appointments');
              const appointmentQuery = query(
                appointmentRef, 
                orderByChild('userId'), 
                equalTo(userId)
              );
              const appointmentSnap = await get(appointmentQuery);
              let userName = metadata.customMetadata?.userName || 'Unknown';
              let userEmail = metadata.customMetadata?.userEmail || 'unknown@example.com';
              
              if (appointmentSnap.exists()) {
                // Get first appointment for this user
                const appointmentData = Object.values(appointmentSnap.val())[0] as { 
                  userName?: string; 
                  userEmail?: string;
                };
                userName = appointmentData.userName || userName;
                userEmail = appointmentData.userEmail || userEmail;
              }
              
              return {
                id: fileRef.name,
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                fileName: metadata.customMetadata?.originalName || fileRef.name,
                fileUrl: url,
                uploadDate: new Date(metadata.timeCreated).toLocaleDateString(),
                fileType: fileRef.name.split('.').pop()?.toUpperCase() || 'FILE',
                fileCategory: metadata.customMetadata?.category || 'report'
              };
            } catch (error) {
              console.error(`Error processing file ${fileRef.name}:`, error);
              return null;
            }
          });
          
          const userReports = await Promise.all(userReportsPromises);
          allReports = [...allReports, ...userReports.filter(Boolean)];
        } catch (error) {
          // Skip if reports folder doesn't exist
          console.log(`No reports folder found for user ${userId}`);
        }
      } catch (error) {
        console.error(`Error processing user folder ${userFolder.name}:`, error);
      }
    }
    
    return allReports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}
