// Consultation Service - Handles appointment booking and data management
import { db } from '@/firebase';
import { ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { fileUploadService, FileUploadService } from './fileUploadService';
import { sendAppointmentConfirmationEmail } from '@/services/emailService';

export type ConsultationType = 'virtual' | 'home' | 'clinic';
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
        price: 1.00
      },
      {
        type: 'home',
        title: 'Home Visit',
        description: 'Have a qualified dentist visit your home for consultation',
        price: 1.00
      },
      {
        type: 'clinic',
        title: 'Clinic Consultation',
        description: 'Visit our dental clinic for a comprehensive consultation',
        price: 1.00
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
  public getAvailableTimeSlots(dateStr?: string): string[] {
    const timeSlots = [];
    // Generate time slots from 9:00 AM to 8:00 PM in 1-hour intervals
    for (let hour = 9; hour <= 20; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const timeString = `${displayHour}:00 ${period}`;
      timeSlots.push(timeString);
    }
    // If date is today, filter slots based on current time
    if (dateStr) {
      const today = new Date();
      const selectedDate = new Date(dateStr);
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      if (today.getTime() === selectedDate.getTime()) {
        const now = new Date();
        // Only allow slots at least 1 hour from now
        const minHour = now.getHours() + 1;
        // If current time is after or at 18:00 (6 PM), no slots for today
        if (now.getHours() >= 18) {
          return [];
        }
        return timeSlots.filter(slot => {
          // Parse slot hour
          const [slotHour] = slot.split(':');
          let hour = parseInt(slotHour);
          const period = slot.includes('PM') ? 'PM' : 'AM';
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return hour >= minHour && hour <= 18; // Only allow up to 6:00 PM
        });
      }
    }
    // For other days, only allow up to 6:00 PM
    return timeSlots.filter(slot => {
      const [slotHour] = slot.split(':');
      let hour = parseInt(slotHour);
      const period = slot.includes('PM') ? 'PM' : 'AM';
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour <= 18;
    });
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
   * Get user's appointment history
   */
  public async getUserAppointments(userId?: string): Promise<any[]> {
    try {
      const currentUserId = userId || localStorage.getItem('userId') || localStorage.getItem('uid');
      
      if (!currentUserId || currentUserId === 'anonymous') {
        return [];
      }

      const appointmentsRef = ref(db, 'appointments');
      const userAppointmentsQuery = query(
        appointmentsRef,
        orderByChild('userId'),
        equalTo(currentUserId)
      );
      
      const appointmentsSnapshot = await get(userAppointmentsQuery);
      
      if (!appointmentsSnapshot.exists()) {
        return [];
      }

      const appointments = appointmentsSnapshot.val();
      const appointmentsList = Object.entries(appointments).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }));

      // Sort by creation date (newest first)
      return appointmentsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      return [];
    }
  }

  /**
   * Check if user has any pending appointments
   */
  public async hasIncompleteAppointments(userId?: string): Promise<{ hasIncomplete: boolean; appointments?: any[] }> {
    try {
      const currentUserId = userId || localStorage.getItem('userId') || localStorage.getItem('uid');
      
      if (!currentUserId || currentUserId === 'anonymous') {
        return { hasIncomplete: false };
      }

      const appointmentsRef = ref(db, 'appointments');
      
      // Get all appointments first, then filter (to handle different field patterns)
      const appointmentsSnapshot = await get(appointmentsRef);
      
      if (!appointmentsSnapshot.exists()) {
        return { hasIncomplete: false };
      }

      const appointments = appointmentsSnapshot.val();
      const appointmentsList = Object.entries(appointments).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }));

      // Filter appointments that belong to this user (using multiple criteria for robustness)
      const userAppointments = appointmentsList.filter((appointment: any) => {
        return (
          appointment.userId === currentUserId || 
          appointment.patientId === currentUserId ||
          appointment.userEmail === localStorage.getItem('userEmail')
        );
      });

      // Define incomplete statuses that should block new appointments
      const incompleteStatuses = ['pending', 'confirmed', 'assigned', 'scheduled'];
      
      const incompleteAppointments = userAppointments.filter((appointment: any) => {
        const status = appointment.status?.toLowerCase() || 'pending';
        return incompleteStatuses.includes(status);
      });

      console.log('Incomplete appointments check:', {
        userId: currentUserId,
        totalUserAppointments: userAppointments.length,
        incompleteAppointments: incompleteAppointments.length,
        incompleteStatuses,
        appointments: incompleteAppointments
      });

      return {
        hasIncomplete: incompleteAppointments.length > 0,
        appointments: incompleteAppointments
      };
    } catch (error) {
      console.error('Error checking incomplete appointments:', error);
      return { hasIncomplete: false };
    }
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
    rescheduleAppointmentId?: string
  ): Promise<BookingResult> {
    try {
      // Validate appointment date constraints
      const appointmentDate = new Date(formData.date);
      const today = new Date();
      const minDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

      // Reset time to start of day for accurate comparison
      appointmentDate.setHours(0, 0, 0, 0);
      minDate.setHours(0, 0, 0, 0);
      maxDate.setHours(0, 0, 0, 0);

      if (appointmentDate < minDate) {
        return {
          success: false,
          error: 'Appointments can only be booked starting from 2 days in advance. Please select a date at least 2 days from today.',
          appointmentId: undefined,
        };
      }

      if (appointmentDate > maxDate) {
        return {
          success: false,
          error: 'Appointments can only be booked up to 2 months in advance. Please select an earlier date.',
          appointmentId: undefined,
        };
      }

      // Get user information
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid') || 'anonymous';
      const userEmail = localStorage.getItem('userEmail') || '';

      // Check for existing non-completed appointments (skip if reschedule)
      if (userId !== 'anonymous' && !rescheduleAppointmentId) {
        try {
          const appointmentsRef = ref(db, 'appointments');
          const appointmentsSnapshot = await get(appointmentsRef);
          
          if (appointmentsSnapshot.exists()) {
            const appointments = appointmentsSnapshot.val();
            
            // Filter appointments that belong to this user (using multiple criteria for robustness)
            const userAppointments = Object.values(appointments).filter((appointment: any) => {
              return (
                appointment.userId === userId || 
                appointment.patientId === userId ||
                appointment.userEmail === userEmail
              );
            });

            // Define incomplete statuses that should block new appointments
            const incompleteStatuses = ['pending', 'confirmed', 'assigned', 'scheduled'];
            
            const hasIncompleteAppointment = userAppointments.some((appointment: any) => {
              const status = appointment.status?.toLowerCase() || 'pending';
              return incompleteStatuses.includes(status);
            });
            
            if (hasIncompleteAppointment) {
              console.log('Blocking appointment booking - user has incomplete appointments:', {
                userId,
                userEmail,
                userAppointments: userAppointments.length,
                incompleteCount: userAppointments.filter((apt: any) => {
                  const status = apt.status?.toLowerCase() || 'pending';
                  return incompleteStatuses.includes(status);
                }).length
              });
              
              return {
                success: false,
                error: 'You cannot book a new appointment while you have pending appointments. Please wait for your current appointment to be completed or cancelled.',
                appointmentId: undefined,
              };
            }
          }
        } catch (error) {
          console.warn('Could not check existing appointments:', error);
          // Continue with booking if check fails (don't block user due to technical issues)
        }
      }

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
      let appointmentId: string;
      if (rescheduleAppointmentId) {
        // Update existing appointment for reschedule
        const existingAppointmentRef = ref(db, `appointments/${rescheduleAppointmentId}`);
        await update(existingAppointmentRef, {
          ...appointmentData,
          updatedAt: Date.now(),
          previousDate: (await get(existingAppointmentRef)).val()?.date,
          previousTime: (await get(existingAppointmentRef)).val()?.time
        });
        appointmentId = rescheduleAppointmentId;
      } else {
        // Create new appointment
        const appointmentsRef = ref(db, 'appointments');
        const newAppointmentRef = push(appointmentsRef);
        await set(newAppointmentRef, appointmentData);
        appointmentId = newAppointmentRef.key;
        if (!appointmentId) {
          throw new Error('Failed to create appointment record');
        }
      }

      // DO NOT assign doctor automatically. Admin will assign manually.
      // Optionally, you can notify admin or set a flag for pending assignment.
      // await update(newAppointmentRef, { needsManualAssignment: true });

      // Send admin notification about new appointment
      try {
        const { sendEnhancedNewAppointmentNotificationToAdmin } = await import('./emailService');
        await sendEnhancedNewAppointmentNotificationToAdmin({
          appointmentId,
          patientName: formData.name,
          patientEmail: userEmail,
          date: formData.date,
          time: formData.time,
          consultationType,
          symptoms: formData.symptoms
        });
        console.log('Enhanced admin notification sent successfully');
      } catch (adminEmailError) {
        console.error('Error sending enhanced admin notification:', adminEmailError);
        // Don't fail the appointment creation if email fails
      }

      // After appointment creation, send confirmation email (without doctor info)
      try {
        await sendAppointmentConfirmationEmail({
          patientName: formData.name,
          patientEmail: userEmail,
          date: formData.date,
          time: formData.time,
          consultationType,
          doctorName: undefined, // No doctor assigned yet
          doctorSpecialization: undefined,
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
        doctorAssigned: false, // No doctor assigned
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

  /**
   * Get appointment details by ID
   */
  public async getAppointmentById(appointmentId: string): Promise<any | null> {
    try {
      const appointmentRef = ref(db, `appointments/${appointmentId}`);
      const snapshot = await get(appointmentRef);
      
      if (snapshot.exists()) {
        return { id: appointmentId, ...snapshot.val() };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return null;
    }
  }
}

export const consultationService = ConsultationService.getInstance();
