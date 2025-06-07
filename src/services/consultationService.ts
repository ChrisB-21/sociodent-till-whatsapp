// Consultation Service - Handles appointment booking and data management
import { db } from '@/firebase';
import { ref, push, set, get, update } from 'firebase/database';
import { assignDoctorToAppointment } from '@/lib/doctorAssignment';
import { fileUploadService, FileUploadService } from './fileUploadService';
import { sendAppointmentConfirmationEmail } from '@/services/emailService';

export type ConsultationType = 'virtual' | 'home' | 'clinic';
export type PaymentMethod = 'razorpay' | 'cash';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ConsultationOption {
  type: ConsultationType;
  title: string;
  description: string;
  price: number;
}

export interface AppointmentData {
  userId: string;
  userName: string;
  userEmail: string;
  consultationType: ConsultationType;
  date: string;
  time: string;
  symptoms: string;
  hasReport: boolean;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  status: AppointmentStatus;
  createdAt: number;
  address?: string;
  userArea?: string;
  reportUrl?: string;
  reportStoragePath?: string;
}

export interface BookingFormData {
  name: string;
  phone: string;
  date: string;
  time: string;
  address?: string;
  symptoms: string;
  hasReport: boolean;
  reportFile?: File | null;
}

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
  doctorAssigned?: boolean;
}

export class ConsultationService {
  private static instance: ConsultationService;
  private fileUploadService: FileUploadService;

  constructor() {
    this.fileUploadService = fileUploadService;
  }

  public static getInstance(): ConsultationService {
    if (!ConsultationService.instance) {
      ConsultationService.instance = new ConsultationService();
    }
    return ConsultationService.instance;
  }

  /**
   * Get available consultation types with pricing
   */
  public getConsultationTypes(): ConsultationOption[] {
    return [
      {
        type: 'virtual',
        title: 'Virtual Consultation',
        description: 'Connect with a dentist via video call without leaving your home',
        price: 2,
      },
      {
        type: 'home',
        title: 'Home Visit',
        description: 'Have a qualified dentist visit your home for consultation',
        price: 1499,
      },
      {
        type: 'clinic',
        title: 'Clinic Consultation',
        description: 'Visit our dental clinic for a comprehensive consultation',
        price: 999,
      },
    ];
  }

  /**
   * Get consultation option by type
   */
  public getConsultationByType(type: ConsultationType): ConsultationOption | undefined {
    return this.getConsultationTypes().find(consultation => consultation.type === type);
  }

  /**
   * Generate available time slots
   */
  public getAvailableTimeSlots(): string[] {
    const timeSlots = [];
    // Generate time slots from 9:00 AM to 8:00 PM in 1-hour intervals
    for (let hour = 9; hour <= 20; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const timeString = `${displayHour}:00 ${period}`;
      timeSlots.push(timeString);
    }
    return timeSlots;
  }

  /**
   * Get date constraints for booking
   */
  public getDateConstraints(): { minDate: string; maxDate: string } {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);

    return {
      minDate: today.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0],
    };
  }

  /**
   * Validate booking form data
   */
  public validateBookingForm(formData: BookingFormData, consultationType: ConsultationType): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validations
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    if (!formData.date) errors.push('Date is required');
    if (!formData.time) errors.push('Time is required');
    if (!formData.symptoms.trim()) errors.push('Symptoms description is required');
    
    // Address required for non-virtual consultations
    if (consultationType !== 'virtual' && !formData.address?.trim()) {
      errors.push('Address is required for home and clinic consultations');
    }

    // Report file validation
    if (formData.hasReport && !formData.reportFile) {
      errors.push('Please upload a report file or uncheck the report option');
    }

    // Date validation
    const { minDate, maxDate } = this.getDateConstraints();
    if (formData.date < minDate || formData.date > maxDate) {
      errors.push('Please select a valid date within the allowed range');
    }

    // Phone number basic validation
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone.trim())) {
      errors.push('Please enter a valid phone number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Save appointment to Firebase
   */
  public async saveAppointment(
    formData: BookingFormData,
    consultationType: ConsultationType,
    paymentMethod: PaymentMethod
  ): Promise<BookingResult> {
    try {
      // Get user information
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid') || 'anonymous';
      const userEmail = localStorage.getItem('userEmail') || '';

      // Fetch user area information
      let userArea: string | undefined;
      if (userId !== 'anonymous') {
        try {
          const userRef = ref(db, `users/${userId}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            userArea = userData.area || userData.address?.area;
          }
        } catch (error) {
          console.warn('Could not fetch user area information:', error);
        }
      }

      // Get consultation details
      const consultation = this.getConsultationByType(consultationType);
      if (!consultation) {
        throw new Error('Invalid consultation type');
      }

      // Prepare appointment data
      const appointmentData: AppointmentData = {
        userId,
        userName: formData.name,
        userEmail,
        consultationType,
        date: formData.date,
        time: formData.time,
        symptoms: formData.symptoms,
        hasReport: formData.hasReport,
        paymentMethod,
        paymentAmount: consultation.price,
        status: 'pending',
        createdAt: Date.now(),
      };

      // Add address for non-virtual consultations
      if (consultationType !== 'virtual' && formData.address) {
        appointmentData.address = formData.address;
      }

      // Add user area if available
      if (userArea) {
        appointmentData.userArea = userArea;
      }

      // Handle report file upload
      if (formData.hasReport && formData.reportFile) {
        const uploadResult = await this.fileUploadService.uploadReportFile(
          formData.reportFile,
          {
            userId,
            userName: formData.name,
            userEmail,
            category: 'consultation',
          }
        );

        if (uploadResult.success) {
          appointmentData.reportUrl = uploadResult.url;
          appointmentData.reportStoragePath = uploadResult.filePath;
        } else {
          console.warn('Failed to upload report file:', uploadResult.error);
          // Continue with appointment creation even if file upload fails
        }
      }

      // Save to Firebase
      const appointmentsRef = ref(db, 'appointments');
      const newAppointmentRef = push(appointmentsRef);
      await set(newAppointmentRef, appointmentData);

      const appointmentId = newAppointmentRef.key;
      if (!appointmentId) {
        throw new Error('Failed to create appointment record');
      }

      // Assign doctor to appointment
      let doctorAssigned = false;
      let assignedDoctorName: string | undefined;
      let assignedDoctorSpecialization: string | undefined;
      try {
        console.log('Starting doctor assignment for appointment:', appointmentId);
        
        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const assignmentResult = await assignDoctorToAppointment(appointmentId);
        doctorAssigned = assignmentResult.success;
        assignedDoctorName = doctorAssigned ? assignmentResult.doctorName : undefined;
        assignedDoctorSpecialization = doctorAssigned ? assignmentResult.matchDetails?.doctor.specialization : undefined;
        
        if (!assignmentResult.success) {
          console.warn('Doctor assignment failed:', assignmentResult.message);
          
          // Update appointment to indicate manual assignment is needed
          const appointmentRef = ref(db, `appointments/${appointmentId}`);
          await update(appointmentRef, {
            needsManualAssignment: true,
            assignmentAttempted: true,
            assignmentErrorMessage: assignmentResult.message
          });
        } else {
          console.log('Doctor assignment successful:', assignmentResult.doctorName);
        }
      } catch (error) {
        console.error('Error during doctor assignment:', error);
        
        // Update appointment to indicate error
        try {
          const appointmentRef = ref(db, `appointments/${appointmentId}`);
          await update(appointmentRef, {
            needsManualAssignment: true,
            assignmentAttempted: true,
            assignmentErrorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (updateError) {
          console.error('Failed to update appointment with error info:', updateError);
        }
      }

      // After doctor assignment, send confirmation email
      try {
        await sendAppointmentConfirmationEmail({
          patientName: formData.name,
          patientEmail: userEmail,
          date: formData.date,
          time: formData.time,
          consultationType,
          doctorName: assignedDoctorName,
          doctorSpecialization: assignedDoctorSpecialization,
          paymentMethod,
          paymentAmount: consultation.price,
          appointmentId,
        });
      } catch (emailError) {
        console.error('Error sending appointment confirmation email:', emailError);
      }

      // Save phone number for future use
      if (formData.phone) {
        localStorage.setItem('lastUsedPhone', formData.phone);
      }

      return {
        success: true,
        appointmentId,
        doctorAssigned,
      };

    } catch (error: any) {
      console.error('Error saving appointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to save appointment',
      };
    }
  }

  /**
   * Get appointment status display text
   */
  public getStatusDisplayText(status: AppointmentStatus): string {
    const statusMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  }

  /**
   * Get consultation type display text
   */
  public getConsultationDisplayText(type: ConsultationType): string {
    const consultation = this.getConsultationByType(type);
    return consultation?.title || type;
  }
}

export const consultationService = ConsultationService.getInstance();
