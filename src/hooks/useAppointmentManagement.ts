import { useState, useCallback } from 'react';
import { db } from '@/firebase';
import { ref, update, get } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  status: string;
  [key: string]: any;
}

export function useAppointmentManagement() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    // Immediately update UI
    setAppointments(current => 
      current.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: 'cancelled' }
          : appointment
      )
    );

    // Show optimistic toast
    toast({
      title: 'Appointment Cancelled',
      description: 'Your appointment has been cancelled successfully.',
    });

    // Mark this specific appointment as loading
    setLoading(prev => ({ ...prev, [appointmentId]: true }));

    try {
      // Get the current appointment data
      const appointmentRef = ref(db, `appointments/${appointmentId}`);
      const snapshot = await get(appointmentRef);
      const appointmentData = snapshot.val();

      if (!appointmentData) {
        throw new Error('Appointment not found');
      }

      // Update the appointment status in Firebase
      await update(appointmentRef, {
        status: 'cancelled',
        cancelledAt: Date.now(),
      });

      // If we reach here, the cancellation was successful
      // The UI is already updated, so we don't need to do anything else

    } catch (error) {
      console.error('Error cancelling appointment:', error);

      // Revert the optimistic update
      setAppointments(current =>
        current.map(appointment =>
          appointment.id === appointmentId
            ? { ...appointment, status: 'active' }
            : appointment
        )
      );

      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Clear loading state
      setLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  }, [toast]);

  const isLoading = useCallback((appointmentId: string) => {
    return !!loading[appointmentId];
  }, [loading]);

  return {
    appointments,
    setAppointments,
    cancelAppointment,
    isLoading,
  };
}