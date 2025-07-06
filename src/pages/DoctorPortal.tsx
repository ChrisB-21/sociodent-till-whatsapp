import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MessageSquare, FileText, Settings,
ClipboardList, RefreshCw, Video, Copy, Mail, Phone, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, get, query, orderByChild, equalTo, update, push } from 'firebase/database';
import { db } from '@/firebase';
import NotificationCenter from '@/components/NotificationCenter';
import DoctorPendingApproval from '@/components/DoctorPendingApproval';
import { sendMeetingLinkEmail } from '@/services/emailService';
import { Sheet, SheetContent, SheetHeader, SheetTitle,
SheetDescription, SheetClose } from '@/components/ui/sheet';
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

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  consultationType: 'virtual' | 'home' | 'clinic';
  date: string;
  time: string;
  symptoms: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctorId?: string;
  doctorName?: string;
  specialization?: string;
  address?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  createdAt: number;
  updatedAt?: number;
  hasReport?: boolean;
  reportUrl?: string;
  meetingLink?: string;
}

interface UserDetails {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Prescription {
  medicine: string;
  doctorName: string;
  doctorId: string;
  createdAt: number;
  appointmentId?: string;
}

const DoctorPortal = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading, refreshUserData } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'upcoming', 'all'
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  // Map of userId -> user profile
  const [userDetails, setUserDetails] = useState<Record<string, any>>({});
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<string | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [editingMeetingLink, setEditingMeetingLink] = useState<string | null>(null);

  // Prescription state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [medicineInput, setMedicineInput] = useState('');
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);

  // Check authentication and role
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'doctor')) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as a doctor to access this page",
        variant: "destructive"
      });
      navigate('/auth?mode=login&role=doctor', { replace: true });
    }
  }, [user, isLoading, navigate, toast]);

  // Refresh user data when component mounts to get latest approval status
  useEffect(() => {
    let isMounted = true;
    
    const refreshData = async () => {
      if (!isLoading && user && user.role === 'doctor') {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };
    
    if (isMounted) {
      refreshData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isLoading, user?.uid, refreshUserData]);

  // Check if doctor is approved - if not, show pending approval screen
  if (!isLoading && user && user.role === 'doctor' && user.status !== 'approved') {
    console.log('DoctorPortal: Doctor status check:', {
      isLoading,
      user: user ? { uid: user.uid, role: user.role, status: user.status, name: user.name } : null,
      showingPendingScreen: true
    });
    return <DoctorPendingApproval />;
  }

  // Load doctor's appointments and all patient user profiles
  useEffect(() => {
    const fetchDoctorAppointments = async () => {
      if (!user || user.role !== 'doctor') return;
      try {
        setIsLoadingAppointments(true);
        // Reference to appointments in Firebase
        const appointmentsRef = ref(db, 'appointments');
        // Query appointments assigned to this doctor
        let appointmentsData: Appointment[] = [];
        try {
          const doctorAppointmentsQuery = query(
            appointmentsRef,
            orderByChild('doctorId'),
            equalTo(user.uid)
          );
          const snapshot = await get(doctorAppointmentsQuery);
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const appointment = {
                id: childSnapshot.key,
                ...childSnapshot.val()
              } as Appointment;
              appointmentsData.push(appointment);
            });
          }
        } catch (queryError) {
          console.error('Doctor appointment query failed, falling back to all appointments:', queryError);
        }
        // Fallback: If no appointments found, fetch all and filter in JS
        if (appointmentsData.length === 0) {
          try {
            const allSnapshot = await get(appointmentsRef);
            if (allSnapshot.exists()) {
              allSnapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.doctorId === user.uid) {
                  appointmentsData.push({
                    id: childSnapshot.key,
                    ...data
                  } as Appointment);
                }
              });
            }
          } catch (allError) {
            console.error('Fallback all-appointments fetch failed:', allError);
          }
        }
        // Fetch user details for each unique patient
        const userIds = Array.from(new Set(appointmentsData.map(a => a.userId)));
        const userDetailsMap: Record<string, any> = {};
        await Promise.all(userIds.map(async (uid) => {
          if (!uid) return;
          try {
            const userSnapshot = await get(ref(db, `users/${uid}`));
            if (userSnapshot.exists()) {
              userDetailsMap[uid] = userSnapshot.val();
            }
          } catch (error) {
            console.error(`Error fetching user details for ${uid}:`, error);
          }
        }));
        setUserDetails(userDetailsMap);
        // Add email/phone to appointments for convenience
        appointmentsData.forEach(app => {
          if (userDetailsMap[app.userId]) {
            app.userEmail = userDetailsMap[app.userId].email;
            app.userPhone = userDetailsMap[app.userId].phone;
          }
        });
        // Sort appointments by date and time
        appointmentsData.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching doctor appointments (outer catch):', error);
        toast({
          title: "Error",
          description: "Failed to load appointments. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAppointments(false);
      }
    };
    fetchDoctorAppointments();
  }, [user, toast]);

  // Ensure prescriptions are fetched correctly for the logged-in doctor
  const fetchPrescriptions = async () => {
    if (!user || user.role !== 'doctor') return;
    const presMap: Record<string, Prescription[]> = {};
    const presRef = ref(db, 'prescriptions');
    const snapshot = await get(presRef);

    if (snapshot.exists()) {
      const prescriptionsData = snapshot.val();
      for (const [patientId, patientPrescriptions] of Object.entries(prescriptionsData)) {
        const filteredPrescriptions = Object.values(patientPrescriptions).filter(
          (prescription: any) => prescription.doctorId === user.uid
        );
        if (filteredPrescriptions.length > 0) {
          presMap[patientId] = filteredPrescriptions;
        }
      }
    }

    setPrescriptions(presMap);
  };

  // Call fetchPrescriptions in useEffect
  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  // Show loading state or return null if not authenticated
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  if (!user || user.role !== 'doctor') {
    return null;
  }

  const tabs = [
    { id: 'appointments', name: 'Appointments', icon: <Calendar className="w-5 h-5 mr-2" /> },
    { id: 'patients', name: 'My Patients', icon: <Users className="w-5 h-5 mr-2" /> },
    { id: 'consultations', name: 'Virtual Consultations', icon: <MessageSquare className="w-5 h-5 mr-2" /> },
    { id: 'prescriptions', name: 'Prescriptions', icon: <FileText className="w-5 h-5 mr-2" /> },
    { id: 'records', name: 'Patient Records', icon: <ClipboardList className="w-5 h-5 mr-2" /> },
    { id: 'settings', name: 'Profile Settings', icon: <Settings className="w-5 h-5 mr-2" /> }
  ];

  // Get doctor name from auth context
  const doctorName = user?.name || "Doctor";
  
  // Function to refresh appointments
  const refreshAppointments = async () => {
    if (!user || user.role !== 'doctor') return;
    
    try {
      setIsLoadingAppointments(true);
      
      // Reference to appointments in Firebase
      const appointmentsRef = ref(db, 'appointments');
      
      // Query appointments assigned to this doctor
      const doctorAppointmentsQuery = query(
        appointmentsRef,
        orderByChild('doctorId'),
        equalTo(user.uid)
      );
      
      const snapshot = await get(doctorAppointmentsQuery);
      
      if (!snapshot.exists()) {
        setAppointments([]);
        setIsLoadingAppointments(false); // Ensure loading is stopped
        return;
      }
      
      // Process appointments data
      const appointmentsData: Appointment[] = [];
      snapshot.forEach((childSnapshot) => {
        const appointment = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        } as Appointment;
        appointmentsData.push(appointment);
      });
      
      // Sort appointments by date and time
      appointmentsData.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      setAppointments(appointmentsData);
      setIsLoadingAppointments(false); // Ensure loading is stopped
      
      toast({
        title: "Appointments Refreshed",
        description: "Your appointment list has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing doctor appointments:', error);
      toast({
        title: "Error",
        description: "Failed to refresh appointments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Function to complete an appointment
  const markAppointmentComplete = async (appointmentId: string) => {
    try {
      const appointmentRef = ref(db, `appointments/${appointmentId}`);
      
      await update(appointmentRef, {
        status: 'completed',
        updatedAt: Date.now()
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? { ...app, status: 'completed', updatedAt: Date.now() } : app
        )
      );
      
      toast({
        title: "Appointment Completed",
        description: "The appointment has been marked as completed.",
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to view appointment details
  const viewAppointmentDetails = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Fetch detailed user information
    if (appointment.userId) {
      try {
        const userSnapshot = await get(ref(db, `users/${appointment.userId}`));
        if (userSnapshot.exists()) {
          setUserDetails(userSnapshot.val());
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    setShowAppointmentDetails(true);
  };

  // Function to handle completion confirmation
  const handleCompleteAppointment = (appointmentId: string) => {
    setAppointmentToComplete(appointmentId);
    setShowCompleteDialog(true);
  };

  const confirmCompleteAppointment = async () => {
    if (appointmentToComplete) {
      await markAppointmentComplete(appointmentToComplete);
      setShowCompleteDialog(false);
      setAppointmentToComplete(null);
    }
  };

  // Function to update meeting link
  const updateMeetingLink = async (appointmentId: string) => {
    if (!meetingLinkInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid meeting link",
        variant: "destructive"
      });
      return;
    }

    try {
      const appointmentRef = ref(db, `appointments/${appointmentId}`);
      
      await update(appointmentRef, {
        meetingLink: meetingLinkInput,
        updatedAt: Date.now()
      });
      
      // Get the appointment details for email notification
      const appointmentSnapshot = await get(appointmentRef);
      const appointmentData = appointmentSnapshot.val();
      
      // Update local state
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? { ...app, meetingLink: meetingLinkInput, updatedAt: Date.now() } : app
        )
      );
      
      setEditingMeetingLink(null);
      setMeetingLinkInput('');
      
      toast({
        title: "Meeting Link Updated",
        description: "The meeting link has been saved successfully.",
      });

      // Send email notification to patient
      if (appointmentData && appointmentData.userEmail) {
        try {
          const emailSuccess = await sendMeetingLinkEmail({
            patientName: appointmentData.userName || 'Patient',
            patientEmail: appointmentData.userEmail,
            date: appointmentData.date,
            time: appointmentData.time,
            meetingLink: meetingLinkInput,
            doctorName: appointmentData.doctorName || user?.name || 'Doctor',
            consultationType: appointmentData.consultationType || 'Virtual Consultation',
            appointmentId: appointmentId
          });

          if (emailSuccess) {
            toast({
              title: "Email Sent",
              description: "Meeting link has been sent to the patient via email.",
            });
          } else {
            toast({
              title: "Email Warning",
              description: "Meeting link saved but email notification failed to send.",
              variant: "destructive"
            });
          }
        } catch (emailError) {
          console.error('Error sending meeting link email:', emailError);
          toast({
            title: "Email Warning",
            description: "Meeting link saved but email notification failed to send.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error updating meeting link:', error);
      toast({
        title: "Error",
        description: "Failed to update meeting link. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to copy meeting link to clipboard
  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Meeting link has been copied to clipboard.",
    });
  };

  // Function to check if meeting is active (15 mins before)
  const isMeetingActive = (date: string, time: string) => {
    try {
      const appointmentDateTime = new Date(`${date} ${time}`);
      const now = new Date();
      const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
      return now >= fifteenMinutesBefore;
    } catch (e) {
      return false;
    }
  };

  // Helper to check if appointment is past
  const isPastAppointment = (date: string, time: string) => {
    try {
      const appointmentDateTime = new Date(`${date} ${time}`);
      return new Date() > appointmentDateTime;
    } catch {
      return false;
    }
  };
  
  // Filter appointments based on view mode
  const getFilteredAppointments = () => {
    if (!appointments.length) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    switch (viewMode) {
      case 'today':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === now.getTime();
        });
      case 'upcoming':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() >= now.getTime();
        });
      case 'all':
      default:
        return appointments;
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    
    try {
      const date = new Date(dateStr);
      
      // Check if today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (appointmentDate.getTime() === today.getTime()) {
        return 'Today';
      }
      
      // Check if tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (appointmentDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      }
      
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  // Add prescription for a patient
  const addPrescription = async () => {
    if (!selectedPatientId || !medicineInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a medicine name",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPrescription: Prescription = {
        medicine: medicineInput.trim(),
        doctorName: user.name,
        doctorId: user.uid,
        createdAt: Date.now(),
        appointmentId: selectedAppointmentId
      };

      // Add to Firebase
      const presRef = ref(db, `prescriptions/${selectedPatientId}`);
      const newPresRef = push(presRef);
      await update(newPresRef, newPrescription);

      // Update local state
      setPrescriptions(prev => ({
        ...prev,
        [selectedPatientId]: [
          ...(prev[selectedPatientId] || []),
          newPrescription
        ]
      }));

      setMedicineInput('');
      setShowPrescriptionDialog(false);

      toast({
        title: "Success",
        description: "Prescription added successfully",
      });
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast({
        title: "Error",
        description: "Failed to add prescription",
        variant: "destructive"
      });
    }
  };

  // When adding a prescription, always write to the database (not just local state)
  const handleAddPrescription = async () => {
    if (!selectedPatientId || !medicineInput.trim()) return;
    const newPrescription: Prescription = {
      medicine: medicineInput.trim(),
      doctorName: user.name,
      doctorId: user.uid,
      createdAt: Date.now(),
      appointmentId: selectedAppointmentId,
    };
    // Always push to the database so it persists across logins
    const presRef = ref(db, `prescriptions/${selectedPatientId}`);
    const newPresKey = Date.now().toString();
    await update(presRef, { [newPresKey]: newPrescription });
    setMedicineInput('');
    setShowPrescriptionDialog(false);
    // Refetch prescriptions from DB to ensure UI is in sync
    fetchPrescriptions();
  };

  // Open prescription dialog for a patient
  const openPrescriptionDialog = (patientId: string, patientName: string, appointmentId: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setSelectedAppointmentId(appointmentId);
    setMedicineInput('');
    setShowPrescriptionDialog(true);
  };

  const filteredAppointments = getFilteredAppointments();

  // Filter virtual consultations - show all, not just future
  const virtualConsultations = appointments.filter(app => 
    app.consultationType === 'virtual'
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* If you have a fixed Navbar, it should be above this main block */}
      <main className="flex-grow pt-24"> {/* pt-24 = padding-top: 6rem, ensures nothing overlaps */}
        <div className="container-custom py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sociodent-700 mb-2">
                Welcome Dr. {doctorName}
              </h1>
              <h2 className="text-3xl font-bold text-gray-900">Doctor Portal</h2>
              <p className="text-gray-600">Manage your appointments, patients, and consultations</p>
            </div>
            <div>
              <NotificationCenter userId={user.uid} userType="doctor" />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "w-full flex items-center px-4 py-3 rounded-lg transition-colors",
                      activeTab === tab.id 
                        ? "bg-sociodent-100 text-sociodent-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
            {/* Main Content */}
            <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
              {activeTab === 'appointments' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold mr-4">Your Appointments</h2>
                      <div className="flex space-x-2">
                        <button 
                          className={`px-3 py-1 text-sm rounded-full ${viewMode === 'today' ? 'bg-sociodent-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          onClick={() => setViewMode('today')}
                        >
                          Today
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm rounded-full ${viewMode === 'upcoming' ? 'bg-sociodent-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          onClick={() => setViewMode('upcoming')}
                        >
                          Upcoming
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm rounded-full ${viewMode === 'all' ? 'bg-sociodent-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          onClick={() => setViewMode('all')}
                        >
                          All
                        </button>
                      </div>
                    </div>
                    <button 
                      className="flex items-center text-sociodent-600 hover:text-sociodent-700"
                      onClick={refreshAppointments}
                      disabled={isLoadingAppointments}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingAppointments ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  
                  {isLoadingAppointments && appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sociodent-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading appointments...</p>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <div className="mb-4">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No appointments found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {viewMode === 'today' 
                          ? "You don't have any appointments scheduled for today." 
                          : viewMode === 'upcoming'
                            ? "You don't have any upcoming appointments."
                            : "You don't have any appointments yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Patient</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAppointments.map((appointment) => {
                            // Always show completed if time is past
                            let status = appointment.status;
                            if (status !== 'completed' && isPastAppointment(appointment.date, appointment.time)) {
                              status = 'completed';
                            }
                            const isCompleted = status === 'completed';
                            return (
                              <tr key={appointment.id} className={`border-b ${isCompleted ? 'bg-green-50' : ''}`}>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-800">{appointment.userName}</div>
                                  <div className="text-gray-500 text-sm">{appointment.userEmail}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-800">{formatDate(appointment.date)}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-800">{appointment.time}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    status === 'confirmed'
                                      ? 'bg-green-100 text-green-800'
                                      : status === 'completed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex space-x-2">
                                    <button 
                                      className="text-sociodent-600 hover:text-sociodent-700"
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setShowAppointmentDetails(true);
                                      }}
                                    >
                                      View
                                    </button>
                                    {/* Complete button (only for confirmed appointments and not past) */}
                                    {status === 'confirmed' && !isPastAppointment(appointment.date, appointment.time) && (
                                      <button 
                                        className="text-blue-600 hover:text-blue-700"
                                        onClick={() => {
                                          setAppointmentToComplete(appointment.id);
                                          setShowCompleteDialog(true);
                                        }}
                                      >
                                        Complete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'patients' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">My Patients</h2>
                  <p className="text-gray-600 mb-4">View and manage your patient list.</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border">Name</th>
                          <th className="px-4 py-2 border">Email</th>
                          <th className="px-4 py-2 border">Phone</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...new Set(appointments.map(a => a.userId))] // Get unique patient IDs
                          .map(patientId => {
                            const patientAppointments = appointments.filter(a => a.userId === patientId);
                            const latestAppointment = patientAppointments[0];
                            return (
                              <tr key={patientId}>
                                <td className="px-4 py-2 border">{latestAppointment.userName}</td>
                                <td className="px-4 py-2 border">{latestAppointment.userEmail || ''}</td>
                                <td className="px-4 py-2 border">{latestAppointment.userPhone || ''}</td>
                                <td className="px-4 py-2 border">
                                  <button
                                    onClick={() => openPrescriptionDialog(
                                      patientId, 
                                      latestAppointment.userName,
                                      latestAppointment.id
                                    )}
                                    className="text-sociodent-600 hover:text-sociodent-700 flex items-center"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Prescription
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'consultations' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Virtual Consultations</h2>
                    <button 
                      className="flex items-center text-sociodent-600 hover:text-sociodent-700"
                      onClick={refreshAppointments}
                      disabled={isLoadingAppointments}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingAppointments ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-6">Manage your upcoming and past virtual appointments.</p>
                  
                  {isLoadingAppointments && appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sociodent-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading consultations...</p>
                    </div>
                  ) : virtualConsultations.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <div className="mb-4">
                        <Video className="w-12 h-12 text-gray-400 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No virtual consultations</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        You don't have any virtual consultations scheduled.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {virtualConsultations.map((consultation) => {
                        // Determine status
                        let status = consultation.status;
                        if (status !== 'completed' && isPastAppointment(consultation.date, consultation.time)) {
                          status = 'completed';
                        }
                        return (
                          <div key={consultation.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-medium">{consultation.userName}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span>{formatDate(consultation.date)} at {consultation.time}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {status}
                              </span>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-700 mb-1">Symptoms:</h4>
                              <p className="text-gray-600">{consultation.symptoms}</p>
                            </div>
                            
                            {consultation.meetingLink ? (
                              <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-700 mb-2">Meeting Link:</h4>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                  <div className="flex items-center">
                                    <Video className="w-5 h-5 text-sociodent-600 mr-2" />
                                    <a 
                                      href={consultation.meetingLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sociodent-600 hover:underline break-all"
                                    >
                                      {consultation.meetingLink}
                                    </a>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => copyMeetingLink(consultation.meetingLink!)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Copy link"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setEditingMeetingLink(consultation.id);
                                        setMeetingLinkInput(consultation.meetingLink || '');
                                      }}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Edit link"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                </div>
                                
                                {isMeetingActive(consultation.date, consultation.time) ? (
                                  <div className="mt-3">
                                    <a
                                      href={consultation.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-4 py-2 bg-sociodent-600 text-white rounded-lg hover:bg-sociodent-700"
                                    >
                                      <Video className="w-5 h-5 mr-2" />
                                      Join Meeting Now
                                    </a>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Meeting is active (available 15 minutes before scheduled time)
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 mt-2">
                                    Meeting will be active 15 minutes before scheduled time.
                                  </p>
                                )}
                              </div>
                            ) : editingMeetingLink === consultation.id ? (
                              <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-700 mb-2">Add Meeting Link:</h4>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={meetingLinkInput}
                                    onChange={(e) => setMeetingLinkInput(e.target.value)}
                                    placeholder="Enter Google Meet or other video call link"
                                    className="flex-1 border rounded-lg px-3 py-2"
                                  />
                                  <button
                                    onClick={() => updateMeetingLink(consultation.id)}
                                    className="px-4 py-2 bg-sociodent-600 text-white rounded-lg hover:bg-sociodent-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingMeetingLink(null);
                                                                            setMeetingLinkInput('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                  Paste the Google Meet, Zoom, or other video call link you'll use for this consultation.
                                </p>
                              </div>
                            ) : (
                              <div className="border-t pt-4">
                                <button
                                  onClick={() => {
                                    setEditingMeetingLink(consultation.id);
                                    setMeetingLinkInput('');
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-sociodent-600 text-white rounded-lg hover:bg-sociodent-700"
                                >
                                  <Video className="w-5 h-5 mr-2" />
                                  Add Meeting Link
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                  Add a Google Meet or other video call link for this consultation.
                                </p>
                              </div>
                            )}
                            
                            <div className="mt-4 flex justify-between items-center border-t pt-4">
                              <div className="flex space-x-3">
                                {consultation.userEmail && (
                                  <a 
                                    href={`mailto:${consultation.userEmail}`}
                                    className="flex items-center text-gray-600 hover:text-gray-800"
                                  >
                                    <Mail className="w-4 h-4 mr-1" />
                                    <span>Email</span>
                                  </a>
                                )}
                                {consultation.userPhone && (
                                  <a 
                                    href={`tel:${consultation.userPhone}`}
                                    className="flex items-center text-gray-600 hover:text-gray-800"
                                  >
                                    <Phone className="w-4 h-4 mr-1" />
                                    <span>Call</span>
                                  </a>
                                )}
                              </div>
                              <div>
                                {status === 'confirmed' && !isPastAppointment(consultation.date, consultation.time) && (
                                  <button
                                    onClick={() => handleCompleteAppointment(consultation.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                  >
                                    Complete Consultation
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'prescriptions' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Prescriptions</h2>
                  <p className="text-gray-600 mb-4">View and manage patient prescriptions.</p>
                  
                  {Object.keys(prescriptions).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <div className="mb-4">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No prescriptions created</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        You haven't created any prescriptions yet. Add prescriptions for your patients.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(prescriptions).map(([patientId, patientPrescriptions]) => {
                        const patientAppointments = appointments.filter(a => a.userId === patientId);
                        const patientName = patientAppointments[0]?.userName || 'Patient';
                        
                        return (
                          <div key={patientId} className="border rounded-lg p-4">
                            <h3 className="text-lg font-medium mb-3">{patientName}'s Prescriptions</h3>
                            
                            <div className="space-y-4">
                              {patientPrescriptions.map((prescription, idx) => {
                                const appointment = appointments.find(a => a.id === prescription.appointmentId);
                                const appointmentDate = appointment 
                                  ? `${formatDate(appointment.date)} at ${appointment.time}`
                                  : 'No appointment date';
                                
                                return (
                                  <div key={idx} className="border-b pb-4 last:border-b-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">{prescription.medicine}</p>
                                        <p className="text-sm text-gray-600">Prescribed by {prescription.doctorName}</p>
                                        <p className="text-sm text-gray-500">{appointmentDate}</p>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {new Date(prescription.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={() => {
                                const latestAppointment = patientAppointments[0];
                                openPrescriptionDialog(
                                  patientId,
                                  patientName,
                                  latestAppointment?.id || ''
                                );
                              }}
                              className="mt-4 flex items-center text-sociodent-600 hover:text-sociodent-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Prescription
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
{activeTab === 'records' && (
  <div>
    <h2 className="text-xl font-semibold mb-6">Patient Records</h2>
    <p className="text-gray-600 mb-4">View comprehensive patient information and history.</p>
    
    {[...new Set(appointments.map(a => a.userId))].length === 0 ? (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <div className="mb-4">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No patient records</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          You don't have any patient records yet.
        </p>
      </div>
    ) : (
      <div className="space-y-6">
        {[...new Set(appointments.map(a => a.userId))].map(patientId => {
          const patientAppointments = appointments.filter(a => a.userId === patientId);
          const latestAppointment = patientAppointments[0];
          const patientPrescriptions = prescriptions[patientId] || [];
          
          // Get user profile details for this patient (from userDetails state, fetched during appointments load)
          const userProfile = userDetails && userDetails[patientId] ? userDetails[patientId] : {};
          // Collect possible uploaded files from user profile
          let profileFiles = [];
          // Support for new medicalRecords array/object
          if (userProfile.medicalRecords && Array.isArray(userProfile.medicalRecords)) {
            profileFiles = userProfile.medicalRecords.map((rec: any) => ({
              label: rec.name || 'Medical Record',
              url: rec.url,
              uploadedAt: rec.uploadedAt
            }));
          } else if (userProfile.medicalRecords && typeof userProfile.medicalRecords === 'object') {
            profileFiles = Object.values(userProfile.medicalRecords).map((rec: any) => ({
              label: rec.name || 'Medical Record',
              url: rec.url,
              uploadedAt: rec.uploadedAt
            }));
          } else {
            if (userProfile.prescriptionsUrl) profileFiles.push({ label: 'Prescription', url: userProfile.prescriptionsUrl });
            if (userProfile.xraysUrl) profileFiles.push({ label: 'Dental X-ray', url: userProfile.xraysUrl });
            if (userProfile.profilePhotoUrl) profileFiles.push({ label: 'Profile Photo', url: userProfile.profilePhotoUrl });
          }

          return (
            <div key={patientId} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{latestAppointment.userName}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {latestAppointment.userEmail && (
                      <p>Email: {latestAppointment.userEmail}</p>
                    )}
                    {latestAppointment.userPhone && (
                      <p>Phone: {latestAppointment.userPhone}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {patientAppointments.length} appointment{patientAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Recent Appointments</h4>
                  <div className="space-y-2">
                    {patientAppointments.slice(0, 3).map(appointment => (
                      <div key={appointment.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span>{formatDate(appointment.date)} at {appointment.time}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                    {patientAppointments.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{patientAppointments.length - 3} more appointments
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Prescriptions</h4>
                  {patientPrescriptions.length === 0 ? (
                    <p className="text-sm text-gray-500">No prescriptions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {patientPrescriptions.slice(0, 3).map((prescription, idx) => (
                        <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                          <p className="font-medium">{prescription.medicine}</p>
                          <p className="text-xs text-gray-500">
                            Prescribed by {prescription.doctorName} on {new Date(prescription.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      {patientPrescriptions.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{patientPrescriptions.length - 3} more prescriptions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Medical Records Section */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Profile Medical Records</h4>
                {profileFiles.length === 0 ? (
                  <p className="text-sm text-gray-500">No medical records uploaded from profile.</p>
                ) : (
                  <ul className="space-y-2">
                    {profileFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-sociodent-600" />
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sociodent-600 hover:underline break-all"
                        >
                          {file.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Patient Uploads Section */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Patient Uploads</h4>
                {patientAppointments.filter(a => a.hasReport && a.reportUrl).length === 0 ? (
                  <p className="text-sm text-gray-500">No files or uploads from patient.</p>
                ) : (
                  <ul className="space-y-2">
                    {patientAppointments.filter(a => a.hasReport && a.reportUrl).map((a, idx) => (
                      <li key={a.id || idx} className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-sociodent-600" />
                        <a
                          href={a.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sociodent-600 hover:underline break-all"
                        >
                          {a.reportUrl.split('/').pop() || 'View File'}
                        </a>
                        <span className="text-xs text-gray-500">{a.date} {a.time}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <button
                  onClick={() => openPrescriptionDialog(
                    patientId,
                    latestAppointment.userName,
                    latestAppointment.id
                  )}
                  className="flex items-center text-sociodent-600 hover:text-sociodent-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Prescription
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                  <p className="text-gray-600">Update your professional profile and account settings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Details Sheet */}
      <Sheet open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
            <SheetDescription>
              {selectedAppointment?.userName}'s appointment on {selectedAppointment?.date} at {selectedAppointment?.time}
            </SheetDescription>
          </SheetHeader>
          
          {selectedAppointment && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Patient Information</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="text-gray-600">Name:</span> {selectedAppointment.userName}</p>
                    {selectedAppointment.userEmail && (
                      <p><span className="text-gray-600">Email:</span> {selectedAppointment.userEmail}</p>
                    )}
                    {selectedAppointment.userPhone && (
                      <p><span className="text-gray-600">Phone:</span> {selectedAppointment.userPhone}</p>
                    )}
                    {userDetails?.address && (
                      <p><span className="text-gray-600">Address:</span> {userDetails.address}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Appointment Details</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="text-gray-600">Date:</span> {formatDate(selectedAppointment.date)}</p>
                    <p><span className="text-gray-600">Time:</span> {selectedAppointment.time}</p>
                    <p>
                      <span className="text-gray-600">Type:</span> 
                      <span className="capitalize"> {selectedAppointment.consultationType}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Status:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        selectedAppointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedAppointment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedAppointment.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedAppointment.status}
                      </span>
                    </p>
                    {selectedAppointment.paymentMethod && (
                      <p><span className="text-gray-600">Payment:</span> {selectedAppointment.paymentMethod}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Symptoms & Notes</h3>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p>{selectedAppointment.symptoms || "No symptoms provided"}</p>
                </div>
              </div>
              
              {selectedAppointment.consultationType === 'virtual' && selectedAppointment.meetingLink && (
                <div>
                  <h3 className="font-medium text-gray-700">Virtual Consultation</h3>
                  <div className="mt-2 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Video className="w-5 h-5 text-sociodent-600 mr-2" />
                      <a 
                        href={selectedAppointment.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sociodent-600 hover:underline break-all"
                      >
                        {selectedAppointment.meetingLink}
                      </a>
                    </div>
                    <button 
                      onClick={() => copyMeetingLink(selectedAppointment.meetingLink!)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {isMeetingActive(selectedAppointment.date, selectedAppointment.time) && (
                    <div className="mt-3">
                      <a
                        href={selectedAppointment.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-sociodent-600 text-white rounded-lg hover:bg-sociodent-700"
                      >
                        <Video className="w-5 h-5 mr-2" />
                        Join Meeting Now
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {selectedAppointment.consultationType === 'home' && selectedAppointment.address && (
                <div>
                  <h3 className="font-medium text-gray-700">Home Visit Address</h3>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p>{selectedAppointment.address}</p>
                  </div>
                </div>
              )}
              
              {selectedAppointment.hasReport && selectedAppointment.reportUrl && (
                <div>
                  <h3 className="font-medium text-gray-700">Medical Report</h3>
                  <div className="mt-2">
                    <a 
                      href={selectedAppointment.reportUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sociodent-600 hover:underline"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      View Patient Report
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {selectedAppointment.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      setAppointmentToComplete(selectedAppointment.id);
                      setShowCompleteDialog(true);
                      setShowAppointmentDetails(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as Completed
                  </button>
                )}
                <SheetClose asChild>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Close
                  </button>
                </SheetClose>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Complete Appointment Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the appointment as completed. You won't be able to undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCompleteAppointment}
              className="bg-sociodent-600 hover:bg-sociodent-700"
            >
              Complete Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prescription Dialog */}
      <AlertDialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Prescription</AlertDialogTitle>
            <AlertDialogDescription>
              Add medicine for {selectedPatientName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name
              </label>
              <input
                type="text"
                value={medicineInput}
                onChange={(e) => setMedicineInput(e.target.value)}
                placeholder="Enter medicine name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={addPrescription}
              className="bg-sociodent-600 hover:bg-sociodent-700"
            >
              Add Prescription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorPortal;