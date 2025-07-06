import React, { useState, useEffect } from 'react';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { notifyDoctorOfAssignment, notifyPatientOfConfirmation } from '@/lib/notifications';

interface Doctor {
  id: string;
  fullName: string;
  specialization?: string;
  status: string;
}

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  consultationType: string;
  date: string;
  time: string;
  doctorId?: string;
  doctorName?: string;
  status: string;
}

interface DoctorReassignmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onReassignmentComplete: () => void;
}

const DoctorReassignmentModal: React.FC<DoctorReassignmentModalProps> = ({
  open,
  onClose,
  appointment,
  onReassignmentComplete
}) => {
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available doctors when the modal opens
  useEffect(() => {
    if (open && appointment) {
      fetchAvailableDoctors();
      // Reset error message when modal opens
      setErrorMessage(null);
    }
  }, [open, appointment]);

  const fetchAvailableDoctors = async () => {
    if (!appointment) return;
    
    try {
      setIsLoading(true);
      
      // Get all doctors
      const doctorsRef = ref(db, 'users');
      const doctorsQuery = query(
        doctorsRef,
        orderByChild('role'),
        equalTo('doctor')
      );
      
      const snapshot = await get(doctorsQuery);
      
      if (!snapshot.exists()) {
        setAvailableDoctors([]);
        return;
      }
      
      // Process doctors data
      const doctorsData: Doctor[] = [];
      snapshot.forEach((childSnapshot) => {
        const doctor = childSnapshot.val();
        if (doctor.status === 'approved') {
          doctorsData.push({
            id: childSnapshot.key,
            fullName: doctor.fullName || 'Unknown Doctor',
            specialization: doctor.specialization || 'General',
            status: doctor.status
          });
        }
      });
      
      setAvailableDoctors(doctorsData);
      
      // If the appointment has a doctor, select it
      if (appointment.doctorId) {
        setSelectedDoctorId(appointment.doctorId);
      } else if (doctorsData.length > 0) {
        setSelectedDoctorId(doctorsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      setErrorMessage('Failed to load available doctors. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load available doctors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReassignDoctor = async () => {
    if (!appointment || !selectedDoctorId) return;
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Get the selected doctor's details
      const selectedDoctor = availableDoctors.find(d => d.id === selectedDoctorId);
      
      if (!selectedDoctor) {
        throw new Error('Selected doctor not found');
      }
      
      console.log('Attempting to assign doctor:', {
        appointmentId: appointment.id,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName
      });
      
      // Update the appointment with the new doctor
      const appointmentRef = ref(db, `appointments/${appointment.id}`);
      
      // Create update data
      const updateData = {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        specialization: selectedDoctor.specialization,
        status: 'confirmed',
        updatedAt: Date.now()
      };
      
      // Use try-catch specifically for the database update
      try {
        await update(appointmentRef, updateData);
        console.log('Appointment updated successfully:', updateData);
      } catch (updateError) {
        console.error('Firebase update error:', updateError);
        setErrorMessage(`Database update failed: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
        throw new Error(`Database update failed: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
      
      // Send notifications
      try {
        // Send notification to doctor
        await notifyDoctorOfAssignment(
          selectedDoctor.id,
          selectedDoctor.fullName,
          appointment.id,
          appointment.userName,
          appointment.date,
          appointment.time
        );
        
        // Send notification to patient
        await notifyPatientOfConfirmation(
          appointment.userId,
          appointment.id,
          selectedDoctor.fullName,
          appointment.date,
          appointment.time
        );
        
        // Send email notification to the assigned doctor
        try {
          const { sendDoctorAssignmentNotificationToDoctor, sendDoctorAssignmentEmailToPatient } = await import('../services/emailService');
          
          // Get doctor's email from Firebase
          const doctorRef = ref(db, `users/${selectedDoctor.id}`);
          const doctorSnapshot = await get(doctorRef);
          
          if (doctorSnapshot.exists()) {
            const doctorData = doctorSnapshot.val();
            if (doctorData.email) {
              // Send email to doctor
              await sendDoctorAssignmentNotificationToDoctor(
                selectedDoctor.fullName,
                doctorData.email,
                appointment.userName,
                appointment.userEmail || '',
                appointment.date,
                appointment.time,
                appointment.consultationType || 'consultation',
                appointment.id
              );
              console.log(`Email notification sent to doctor: ${doctorData.email}`);
              
              // Send email to patient about doctor assignment
              if (appointment.userEmail) {
                await sendDoctorAssignmentEmailToPatient({
                  patientName: appointment.userName,
                  patientEmail: appointment.userEmail,
                  doctorName: selectedDoctor.fullName,
                  doctorSpecialization: selectedDoctor.specialization,
                  date: appointment.date,
                  time: appointment.time,
                  consultationType: appointment.consultationType,
                  appointmentId: appointment.id
                });
                console.log(`Doctor assignment email sent to patient: ${appointment.userEmail}`);
              }
            }
          }
        } catch (emailError) {
          console.error('Error sending email notifications:', emailError);
          // Don't fail the assignment if email fails
        }
        
        console.log('Notifications sent successfully');
      } catch (notificationError) {
        // Don't fail the entire operation if notifications fail
        console.error('Error sending notifications:', notificationError);
        // Still show success for the appointment update, but mention notification issue
        toast({
          title: "Doctor Reassigned",
          description: `Doctor assigned successfully, but there was an issue sending notifications.`,
        });
        
        onReassignmentComplete();
        onClose();
        return; // Exit early after showing the toast
      }
      
      toast({
        title: "Doctor Reassigned",
        description: `Doctor ${selectedDoctor.fullName} has been assigned to this appointment.`,
      });
      
      onReassignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error reassigning doctor:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      
      toast({
        title: "Error",
        description: `Failed to reassign doctor: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reassign Doctor</AlertDialogTitle>
          <AlertDialogDescription>
            {appointment ? (
              <div className="py-2">
                <p className="mb-3">Appointment details:</p>
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="font-semibold">Patient:</div>
                  <div>{appointment.userName}</div>
                  
                  <div className="font-semibold">Date:</div>
                  <div>{appointment.date}</div>
                  
                  <div className="font-semibold">Time:</div>
                  <div>{appointment.time}</div>
                  
                  <div className="font-semibold">Current Status:</div>
                  <div className="capitalize">{appointment.status}</div>
                  
                  <div className="font-semibold">Current Doctor:</div>
                  <div>{appointment.doctorName || 'Not assigned'}</div>
                </div>
                
                {errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    Error: {errorMessage}
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="mb-2 font-medium">Select New Doctor:</p>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDoctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.fullName} ({doctor.specialization})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p>Loading appointment details...</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReassignDoctor}
            disabled={isLoading || !selectedDoctorId}
            className="bg-sociodent-600 hover:bg-sociodent-700"
          >
            {isLoading ? 'Processing...' : 'Reassign Doctor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DoctorReassignmentModal;
