import { db } from '@/firebase';
import { ref, update, get } from 'firebase/database';
import { updateAdminLog } from './adminLogService';

export interface DoctorProfileUpdate {
  fullName?: string;
  specialization?: string;
  qualifications?: string;
  experience?: string;
  licenseNumber?: string;
  clinicAddress?: string;
  phone?: string;
  email?: string;
  availableHours?: string;
  consultationFee?: string;
  about?: string;
  languages?: string[];
  profileImage?: string;
  lastUpdated?: string;
  updateHistory?: {
    timestamp: string;
    fields: string[];
    previousValues: any;
  }[];
}

export const updateDoctorProfile = async (
  doctorId: string, 
  updates: DoctorProfileUpdate
) => {
  try {
    const doctorRef = ref(db, `users/${doctorId}`);
    
    // Get current profile data for change tracking
    const snapshot = await get(doctorRef);
    const currentProfile = snapshot.val();
    
    // Track which fields are being updated
    const changedFields = Object.keys(updates).filter(
      key => updates[key] !== currentProfile[key]
    );
    
    // If no changes, return early
    if (changedFields.length === 0) {
      return { success: true, message: 'No changes detected' };
    }
    
    // Prepare update history entry
    const updateHistoryEntry = {
      timestamp: new Date().toISOString(),
      fields: changedFields,
      previousValues: changedFields.reduce((prev, field) => ({
        ...prev,
        [field]: currentProfile[field]
      }), {})
    };
    
    // Combine updates with metadata
    const updatedProfile = {
      ...updates,
      lastUpdated: new Date().toISOString(),
      updateHistory: [
        ...(currentProfile.updateHistory || []),
        updateHistoryEntry
      ]
    };
    
    // Update doctor profile
    await update(doctorRef, updatedProfile);
    
    // Log update in admin portal
    await updateAdminLog({
      type: 'DOCTOR_PROFILE_UPDATE',
      doctorId,
      doctorName: updates.fullName || currentProfile.fullName,
      changes: changedFields,
      timestamp: new Date().toISOString(),
      details: {
        previous: updateHistoryEntry.previousValues,
        new: changedFields.reduce((prev, field) => ({
          ...prev,
          [field]: updates[field]
        }), {})
      }
    });
    
    return {
      success: true,
      message: 'Profile updated successfully',
      updatedFields: changedFields
    };
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return {
      success: false,
      message: 'Failed to update profile',
      error: error.message
    };
  }
};