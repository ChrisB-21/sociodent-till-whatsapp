import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MessageSquare, FileText, Settings,
ClipboardList, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ref, get, query, orderByChild, equalTo, update } from
'firebase/database';
import { db } from '@/firebase';
import NotificationCenter from '@/components/NotificationCenter';
import DoctorPendingApproval from '@/components/DoctorPendingApproval';
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
}

interface UserDetails {
  name: string;
  email: string;
  phone?: string;
  address?: string;
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
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<string | null>(null);

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
  }, [isLoading, user?.uid, refreshUserData]); // Added user.uid to dependency to ensure it runs when user changes

  // Check if doctor is approved - if not, show pending approval screen
  if (!isLoading && user && user.role === 'doctor' && user.status !== 'approved') {
    console.log('DoctorPortal: Doctor status check:', {
      isLoading,
      user: user ? { uid: user.uid, role: user.role, status: user.status, name: user.name } : null,
      showingPendingScreen: true
    });
    return <DoctorPendingApproval />;
  }

  // Load doctor's appointments when component mounts or when the user changes
  useEffect(() => {
    const fetchDoctorAppointments = async () => {
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
          return;
        }
        
        // Process appointments data and fetch user details
        const appointmentsData: Appointment[] = [];
        const userPromises: Promise<void>[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const appointment = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          } as Appointment;
          appointmentsData.push(appointment);
        });
        
        // Fetch user details for each appointment
        for (const appointment of appointmentsData) {
          if (appointment.userId) {
            const userPromise = get(ref(db, `users/${appointment.userId}`)).then((userSnapshot) => {
              if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                appointment.userEmail = userData.email;
                appointment.userPhone = userData.phone;
              }
            }).catch((error) => {
              console.error(`Error fetching user details for ${appointment.userId}:`, error);
            });
            userPromises.push(userPromise);
          }
        }
        
        // Wait for all user details to be fetched
        await Promise.all(userPromises);
        
        // Sort appointments by date and time
        appointmentsData.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching doctor appointments:', error);
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
  
  // Filter appointments based on view mode
  const getFilteredAppointments = () => {
    if (!appointments.length) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (viewMode) {
      case 'today':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        });
      case 'upcoming':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() >= today.getTime();
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

  const filteredAppointments = getFilteredAppointments();

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
                      <span>{isLoadingAppointments ? 'Refreshing...' : 'Refresh'}</span>
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
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Contact</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAppointments.map((appointment) => (
                            <tr key={appointment.id} className="border-b">
                              <td className="px-4 py-4 font-medium">{appointment.userName}</td>
                              <td className="px-4 py-4">
                                <div className="text-xs">
                                  {appointment.userPhone && (
                                    <div className="text-gray-600">📞 {appointment.userPhone}</div>
                                  )}
                                  {appointment.userEmail && (
                                    <div className="text-gray-600">✉️ {appointment.userEmail}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">{formatDate(appointment.date)}</td>
                              <td className="px-4 py-4">{appointment.time}</td>
                              <td className="px-4 py-4">
                                <span className="capitalize">{appointment.consultationType}</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  appointment.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : appointment.status === 'completed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : appointment.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex space-x-2">
                                  {/* View details button */}
                                  <button 
                                    className="text-sociodent-600 hover:text-sociodent-700"
                                    onClick={() => {
                                      // Navigate to appointment details or show modal
                                      setSelectedAppointment(appointment);
                                      setShowAppointmentDetails(true);
                                    }}
                                  >
                                    View
                                  </button>
                                  
                                  {/* Complete button (only for confirmed appointments) */}
                                  {appointment.status === 'confirmed' && (
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'patients' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">My Patients</h2>
                  <p className="text-gray-600">View and manage your patient list.</p>
                </div>
              )}
              {activeTab === 'consultations' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Virtual Consultations</h2>
                  <p className="text-gray-600">Manage your upcoming virtual appointments.</p>
                </div>
              )}
              {activeTab === 'prescriptions' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Prescriptions</h2>
                  <p className="text-gray-600">Create and manage patient prescriptions.</p>
                </div>
              )}
              {activeTab === 'records' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Patient Records</h2>
                  <p className="text-gray-600">Access and update patient medical records.</p>
                </div>
              )}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                  <p className="text-gray-600">Update your profile information and preferences.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Appointment Details Sheet */}
      {showAppointmentDetails && selectedAppointment && (
        <Sheet open={showAppointmentDetails} onOpenChange={() => setShowAppointmentDetails(false)}>
          <SheetContent className="max-w-lg">
            <SheetHeader>
              <SheetTitle>Appointment Details</SheetTitle>
              <SheetDescription>
                Details for the appointment with {selectedAppointment.userName}
              </SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Patient Name:</strong>
                </div>
                <div>
                  {selectedAppointment.userName}
                </div>
                <div>
                  <strong>Email:</strong>
                </div>
                <div>
                  {selectedAppointment.userEmail}
                </div>
                <div>
                  <strong>Phone:</strong>
                </div>
                <div>
                  {selectedAppointment.userPhone}
                </div>
                <div>
                  <strong>Consultation Type:</strong>
                </div>
                <div>
                  {selectedAppointment.consultationType}
                </div>
                <div>
                  <strong>Date:</strong>
                </div>
                <div>
                  {formatDate(selectedAppointment.date)}
                </div>
                <div>
                  <strong>Time:</strong>
                </div>
                <div>
                  {selectedAppointment.time}
                </div>
                <div>
                  <strong>Status:</strong>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
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
                </div>
              </div>
              
              <div className="mt-4">
                <strong>Symptoms:</strong>
                <p className="text-gray-700">{selectedAppointment.symptoms}</p>
              </div>
              
              {selectedAppointment.hasReport && selectedAppointment.reportUrl && (
                <div className="mt-4">
                  <a 
                    href={selectedAppointment.reportUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sociodent-600 hover:underline"
                  >
                    View Full Report
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4">
              <button 
                className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowAppointmentDetails(false)}
              >
                Close
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Complete Appointment Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this appointment as completed? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowCompleteDialog(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (appointmentToComplete) {
                  markAppointmentComplete(appointmentToComplete);
                  setShowCompleteDialog(false);
                }
              }}
              className="bg-sociodent-600 text-white hover:bg-sociodent-700"
            >
              Complete Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorPortal;
