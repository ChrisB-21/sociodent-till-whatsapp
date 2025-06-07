import { ref, push, get, set, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/firebase';

export interface Notification {
  id?: string;
  recipientId: string;
  recipientType: 'doctor' | 'patient' | 'admin';
  title: string;
  message: string;
  type: 'appointment_assigned' | 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'general';
  relatedTo?: {
    type: 'appointment' | 'message' | 'payment';
    id: string;
  };
  isRead: boolean;
  createdAt: number;
}

/**
 * Create a new notification
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<string | null> => {
  try {
    const notificationsRef = ref(db, 'notifications');
    const newNotificationRef = push(notificationsRef);
    
    const fullNotification: Omit<Notification, 'id'> = {
      ...notification,
      isRead: false,
      createdAt: Date.now()
    };
    
    await set(newNotificationRef, fullNotification);
    return newNotificationRef.key;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Get notifications for a specific recipient
 */
export const getNotificationsForUser = async (userId: string, limit = 20): Promise<Notification[]> => {
  try {
    const notificationsRef = ref(db, 'notifications');
    const userNotificationsQuery = query(
      notificationsRef,
      orderByChild('recipientId'),
      equalTo(userId)
    );
    
    const snapshot = await get(userNotificationsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const notifications: Notification[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const notification = {
        id: childSnapshot.key,
        ...childSnapshot.val()
      };
      
      notifications.push(notification);
    });
    
    // Sort by createdAt (newest first) and limit results
    return notifications
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = ref(db, `notifications/${notificationId}`);
    await update(notificationRef, { isRead: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const notificationsRef = ref(db, 'notifications');
    const userNotificationsQuery = query(
      notificationsRef,
      orderByChild('recipientId'),
      equalTo(userId)
    );
    
    const snapshot = await get(userNotificationsQuery);
    
    if (!snapshot.exists()) {
      return true;
    }
    
    const updates: Record<string, any> = {};
    
    snapshot.forEach((childSnapshot) => {
      if (!childSnapshot.val().isRead) {
        updates[`notifications/${childSnapshot.key}/isRead`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Create a notification for doctor when assigned to an appointment
 */
export const notifyDoctorOfAssignment = async (
  doctorId: string, 
  doctorName: string,
  appointmentId: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<string | null> => {
  return createNotification({
    recipientId: doctorId,
    recipientType: 'doctor',
    title: 'New Appointment Assigned',
    message: `You have been assigned to a new appointment with ${patientName} on ${appointmentDate} at ${appointmentTime}.`,
    type: 'appointment_assigned',
    relatedTo: {
      type: 'appointment',
      id: appointmentId
    }
  });
};

/**
 * Create a notification for patient when appointment is confirmed
 */
export const notifyPatientOfConfirmation = async (
  patientId: string,
  appointmentId: string,
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<string | null> => {
  return createNotification({
    recipientId: patientId,
    recipientType: 'patient',
    title: 'Appointment Confirmed',
    message: `Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime} has been confirmed.`,
    type: 'appointment_confirmed',
    relatedTo: {
      type: 'appointment',
      id: appointmentId
    }
  });
};

/**
 * Create appointment reminder notifications 
 */
export const createAppointmentReminders = async (
  appointmentId: string,
  patientId: string,
  doctorId: string,
  patientName: string,
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<boolean> => {
  try {
    // Create a reminder for the patient
    await createNotification({
      recipientId: patientId,
      recipientType: 'patient',
      title: 'Appointment Reminder',
      message: `Reminder: You have an appointment with Dr. ${doctorName} tomorrow at ${appointmentTime}.`,
      type: 'appointment_reminder',
      relatedTo: {
        type: 'appointment',
        id: appointmentId
      }
    });
    
    // Create a reminder for the doctor
    await createNotification({
      recipientId: doctorId,
      recipientType: 'doctor',
      title: 'Appointment Reminder',
      message: `Reminder: You have an appointment with ${patientName} tomorrow at ${appointmentTime}.`,
      type: 'appointment_reminder',
      relatedTo: {
        type: 'appointment',
        id: appointmentId
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error creating appointment reminders:', error);
    return false;
  }
};
