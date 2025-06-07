// File Upload Service - Handles report file uploads to Firebase Storage
import { ref as storageRef, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage';
import { storage } from '@/firebase';

export interface UploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
}

export interface FileUploadData {
  userId: string;
  userName: string;
  userEmail: string;
  category?: string;
}

export class FileUploadService {
  private static instance: FileUploadService;

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Upload a report file to Firebase Storage
   */
  public async uploadReportFile(file: File, uploadData: FileUploadData): Promise<UploadResult> {
    try {
      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Create unique file path
      const filePath = `reports/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, filePath);
      
      // Set metadata
      const metadata: UploadMetadata = {
        customMetadata: {
          userId: uploadData.userId,
          userName: uploadData.userName,
          userEmail: uploadData.userEmail,
          category: uploadData.category || 'consultation',
          uploadedAt: new Date().toISOString(),
        },
      };

      // Upload file
      await uploadBytes(fileRef, file, metadata);
      
      // Get download URL
      const url = await getDownloadURL(fileRef);

      return {
        success: true,
        url,
        filePath,
      };

    } catch (error: any) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only PDF, JPG, and PNG files are allowed',
      };
    }

    return { isValid: true };
  }

  /**
   * Get supported file extensions for display
   */
  public getSupportedFileTypes(): string {
    return '.pdf,.jpg,.jpeg,.png';
  }

  /**
   * Get maximum file size in MB
   */
  public getMaxFileSize(): number {
    return 5; // MB
  }

  /**
   * Format file size for display
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileUploadService = FileUploadService.getInstance();
