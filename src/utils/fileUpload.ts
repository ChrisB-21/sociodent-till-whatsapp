import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface FileUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // MIME types
}

const DEFAULT_OPTIONS: FileUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
};

/**
 * Upload a file to Firebase Storage in user-specific folders
 * @param file - The file to upload
 * @param userId - The user ID for creating user-specific folders
 * @param folderType - The type of folder (reports, prescriptions, profile, etc.)
 * @param options - Upload options for validation
 * @returns Promise with upload result
 */
export async function uploadFileToStorage(
  file: File,
  userId: string,
  folderType: 'reports' | 'prescriptions' | 'profile' | 'medicalRecords' | 'documents',
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate file size
  if (opts.maxSize && file.size > opts.maxSize) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${(opts.maxSize / 1024 / 1024).toFixed(1)}MB`);
  }

  // Validate file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`);
  }

  try {
    // Create unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create file path in user-specific folder
    const filePath = `users/${userId}/${folderType}/${uniqueFileName}`;
    
    // Create storage reference
    const fileRef = ref(storage, filePath);
    
    // Upload file
    await uploadBytes(fileRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    return {
      url: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath: filePath
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple files to Firebase Storage
 * @param files - Array of files to upload
 * @param userId - The user ID for creating user-specific folders
 * @param folderType - The type of folder
 * @param options - Upload options for validation
 * @returns Promise with array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  folderType: 'reports' | 'prescriptions' | 'profile' | 'medicalRecords' | 'documents',
  options: FileUploadOptions = {}
): Promise<FileUploadResult[]> {
  const uploadPromises = files.map(file => 
    uploadFileToStorage(file, userId, folderType, options)
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param options - Validation options
 * @returns validation result
 */
export function validateFile(file: File, options: FileUploadOptions = {}): { isValid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (opts.maxSize && file.size > opts.maxSize) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${(opts.maxSize / 1024 / 1024).toFixed(1)}MB`
    };
  }

  // Check file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`
    };
  }

  return { isValid: true };
}
