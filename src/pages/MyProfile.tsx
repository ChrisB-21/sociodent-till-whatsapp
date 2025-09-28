import React, { useEffect, useState } from "react";
import { getStates, getDistricts, getCities, getLocalities, getAreas } from "@/utils/locationUtils";
import {
  FaUser,
  FaCalendarAlt,
  FaHistory,
  FaFileMedical,
  FaPills,
  FaCog,
  FaEdit,
  FaLock,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaFilePdf,
  FaFileImage,
  FaShoppingCart,
} from "react-icons/fa";
import { Package, Calendar, DollarSign, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "@/firebase";
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { ref, update, get } from "firebase/database";
import { ref as storageRef, getDownloadURL, listAll, uploadBytes, deleteObject, getMetadata } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { sendAppointmentCancellationEmails } from "@/services/emailService";
import { cancelOrder } from "@/services/productOrderService";


// Sidebar item component
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}
const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer mb-1 transition ${
      active
        ? "bg-[#e6f0fa] text-[#1164A8] font-semibold"
        : "hover:bg-gray-100 text-gray-700"
    }`}
  >
    <span className={`text-lg ${active ? "text-[#1164A8]" : ""}`}>{icon}</span>
    <span>{label}</span>
  </div>
);

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  doctorId: string;
  specialization: string;
  consultationType: string;
  date: string;
  time: string;
  status: string;
  symptoms?: string;
  paymentAmount?: number;
  meetingLink?: string;
  createdAt?: number;
  updatedAt?: number;
  cancellationDate?: string;
  doctorName?: string;
}
interface OrderItem {
  id: string;
  orderId: string;
  createdAt: number;
  items: any[];
  userEmail: string;
  userAuthEmail?: string;
  userId?: string;
  [key: string]: any;
}
const initialProfile = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  city: "",
  state: "",
  district: "",
  locality: "",
  area: "",
  pincode: "",
  age: "",
  disabilityType: "",
  category: "",
  medicalConditions: "",
  medications: "",
  modeOfCare: "",
};

interface Prescription {
  medicine: string;
  doctorName: string;
  doctorId: string;
  createdAt: number;
  appointmentId?: string;
}

const MyProfile = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<typeof initialProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState("appointments");
  const [userRole, setUserRole] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [showCancelEditDialog, setShowCancelEditDialog] = useState(false);
  const [showCancelPasswordDialog, setShowCancelPasswordDialog] = useState(false);
  const [showOrderCancelDialog, setShowOrderCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderItem | null>(null);
  const [orderCancellationReason, setOrderCancellationReason] = useState("");
  const [medicalRecords, setMedicalRecords] = useState<{
    name: string, 
    url: string,
    type?: string,
    category?: string,
    uploadDate?: string
  }[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Record<string, any>>({});
  const [selectedDoctor, setSelectedDoctor] = useState<{
    name: string;
    phone: string;
    email: string;
  } | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch medical records from Firebase Storage
  const fetchMedicalRecords = async (userId: string) => {
    try {
      const recordsRef = storageRef(storage, `users/${userId}/medicalRecords`);
      const result = await listAll(recordsRef);
      
      const records = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          return {
            name: itemRef.name,
            url,
            type: metadata.contentType,
            category: 'document',
            uploadDate: new Date(metadata.timeCreated).toLocaleDateString()
          };
        })
      );
      
      setMedicalRecords(records);
    } catch (error) {
      console.error("Error fetching medical records:", error);
    }
  };

  // Fetch prescriptions for the user
  const fetchPrescriptions = async (userId: string) => {
    try {
      console.log('Fetching prescriptions for userId:', userId);
      const presRef = ref(db, `prescriptions/${userId}`);
      const snapshot = await get(presRef);
      
      console.log('Prescription snapshot exists:', snapshot.exists());
      if (snapshot.exists()) {
        const prescriptionsData = snapshot.val();
        console.log('Raw prescriptions data:', prescriptionsData);
        const prescriptionsList: Prescription[] = Object.values(prescriptionsData);
        console.log('Processed prescriptions list:', prescriptionsList);
        setPrescriptions(prescriptionsList);
        
        // Fetch doctor details for each prescription
        const doctorIds = Array.from(new Set(prescriptionsList.map(p => p.doctorId)));
        console.log('Doctor IDs found in prescriptions:', doctorIds);
        const doctorsData: Record<string, any> = {};
        
        for (const doctorId of doctorIds) {
          const doctorRef = ref(db, `users/${doctorId}`);
          const doctorSnapshot = await get(doctorRef);
          if (doctorSnapshot.exists()) {
            doctorsData[doctorId] = doctorSnapshot.val();
          }
        }
        
        console.log('Doctors data fetched:', doctorsData);
        setDoctors(doctorsData);
      } else {
        console.log('No prescriptions found for user:', userId);
        setPrescriptions([]);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setPrescriptions([]);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async (userId: string, userEmail: string | null) => {
    try {
      console.log('Fetching orders for user:', userId, userEmail);
      const ordersRef = ref(db, 'orders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const allOrders = Object.values(ordersData) as any[];
        
        // Filter orders for the current user - show all orders with their statuses
        const userOrders = allOrders.filter(order => 
          (order.userEmail === userEmail || 
           order.userAuthEmail === userEmail ||
           order.userId === userId)
        );
        
        // Sort by creation date (newest first)
        userOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        console.log('Found orders for user:', userOrders.length);
  setOrders(userOrders as OrderItem[]);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setOrders([]);
    }
  };

  // Handle order cancellation
  const handleOrderCancellation = async () => {
    if (!orderToCancel || !orderCancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await cancelOrder(orderToCancel.id, userId, orderCancellationReason.trim());
      
      if (result.success) {
        toast({
          title: "Order Cancelled",
          description: `Your order ${orderToCancel.orderId} has been cancelled successfully.`,
        });
        
        // Remove from local state
        setOrders(prev => prev.filter(order => order.id !== orderToCancel.id));
        
        // Reset dialog state
        setShowOrderCancelDialog(false);
        setOrderToCancel(null);
        setOrderCancellationReason("");
      } else {
  throw new Error(result && result.error ? String(result.error) : 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.uid);
        
        // First, try to get user info from database
        const userRef = ref(db, `users/${user.uid}`);
        
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            // Found user data
            const userData = snapshot.val();
            setUserRole(userData.role || "user");
            
            // Update profile with user data
            setProfile({
              ...initialProfile,
              fullName: userData.fullName || "",
              email: userData.email || user.email || "",
              phone: userData.phone || "",
              gender: userData.gender || "",
              city: userData.city || "",
              state: userData.state || "",
              district: userData.district || "",
              locality: userData.locality || "",
              area: userData.area || "",
              pincode: userData.pincode || "",
              age: userData.age || "",
              disabilityType: userData.disabilityType || "",
              category: userData.category || "",
              medicalConditions: userData.medicalConditions || "",
              medications: userData.medications || "",
              modeOfCare: userData.modeOfCare || "",
            });
            
            console.log("User profile loaded from database", userData);
          } else {
            console.log("No user data in database, creating initial profile");
            // No user data, create initial profile with auth data
            setUserRole("user");
            setProfile({
              ...initialProfile,
              fullName: user.displayName || "",
              email: user.email || "",
            });
            
            // Store initial profile in database
            update(userRef, {
              fullName: user.displayName || "",
              email: user.email || "",
              role: "user",
              registeredAt: new Date().toISOString(),
            });
          }
          
          setLoading(false);
        }).catch((error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
          
          // Use auth data as fallback
          setUserRole("user");
          setProfile({
            ...initialProfile,
            fullName: user.displayName || "",
            email: user.email || "",
          });
        });
        
        // Fetch user's appointments from the main appointments collection
        const appointmentsRef = ref(db, 'appointments');
        get(appointmentsRef).then((snapshot) => {
          if (snapshot.exists()) {
            const allAppointments = snapshot.val();
            // Filter appointments that belong to this user using multiple criteria
            const userAppointments = Object.entries(allAppointments)
              .filter(([_, appointment]: [string, any]) => {
                const appt = appointment;
                // Check multiple possible ways the appointment could be linked to this user
                return (
                  appt.userId === user.uid || 
                  appt.patientId === user.uid ||
                  appt.userEmail === user.email
                );
              })
              .map(([id, appointment]: [string, any]) => ({
                id,
                userId: appointment.userId,
                userName: appointment.userName,
                userEmail: appointment.userEmail,
                doctorId: appointment.doctorId,
                doctorName: appointment.doctorName,
                specialization: appointment.specialization,
                consultationType: appointment.consultationType,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status,
                symptoms: appointment.symptoms,
                paymentAmount: appointment.paymentAmount,
                meetingLink: appointment.meetingLink,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt
              }));
            
            console.log(`Found ${userAppointments.length} appointments for user ${user.uid}`);
            setAppointments(userAppointments);
          } else {
            setAppointments([]);
          }
        }).catch(err => {
          console.error("Error fetching appointments:", err);
          setAppointments([]);
        });
        
        // Fetch medical records
        fetchMedicalRecords(user.uid);
        
        // Fetch prescriptions
        fetchPrescriptions(user.uid);
        
        // Fetch orders
        fetchUserOrders(user.uid, user.email);
        
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        navigate("/auth?mode=login", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle profile change
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Save profile changes to Firebase
  const saveProfileChanges = async () => {
    setProfileError("");
    setSuccessMessage("");

    // Basic validation
    if (!profile.fullName || !profile.email || !profile.phone) {
      setProfileError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Update in Firebase
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        ...profile,
        updatedAt: new Date().toISOString()
      });
      
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError("Failed to update profile. Please try again.");
      
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError("");
    setSuccessMessage("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      // Reauthenticate first
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User not found");
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Then update password
      await updatePassword(user, newPassword);
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      toast({
        title: "Success",
        description: "Password changed successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      const err = error as any;
      if (err.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else {
        setPasswordError("Failed to change password. Please try again.");
      }
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure the viewDoctorDetails function is defined
  const viewDoctorDetails = (doctorId: string) => {
    const doctor = doctors[doctorId];
    if (doctor) {
      setSelectedDoctor({
        name: doctor.fullName,
        phone: doctor.phone,
        email: doctor.email,
      });
    } else {
      setSelectedDoctor(null);
    }
  };

  // Updated filtering logic for upcoming and history tabs
  const updatedAppointments = appointments.map(a => {
    const appointmentDateTime = new Date(`${a.date} ${a.time}`);
    const currentDateTime = new Date();
    const updatedStatus = currentDateTime > appointmentDateTime ? 'completed' : a.status;
    return { ...a, status: updatedStatus };
  });

  const upcomingAppointments = updatedAppointments.filter(a => new Date(`${a.date} ${a.time}`) > new Date());
  const historyAppointments = updatedAppointments.filter(a => new Date(`${a.date} ${a.time}`) <= new Date());

  // Update summary statistics to use filtered arrays
  const completedCount = historyAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = historyAppointments.filter(a => a.status === 'cancelled').length;
  const totalCount = historyAppointments.length;

  // Check if appointment can be cancelled (at least 24 hours before appointment)
  const canCancelAppointment = (appointment: any) => {
    try {
      // Parse appointment date and time
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
      const currentDateTime = new Date();
      
      // Calculate time difference in milliseconds
      const timeDifference = appointmentDateTime.getTime() - currentDateTime.getTime();
      
      // Convert to hours (24 hours = 24 * 60 * 60 * 1000 milliseconds)
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      // Allow cancellation only if appointment is at least 24 hours away
      return hoursDifference >= 24;
    } catch (error) {
      console.error('Error calculating cancellation eligibility:', error);
      return false; // Default to not allowing cancellation if there's an error
    }
  };

  // Get remaining time until cancellation deadline
  const getCancellationDeadlineInfo = (appointment: any) => {
    try {
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
      const currentDateTime = new Date();
      const timeDifference = appointmentDateTime.getTime() - currentDateTime.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      if (hoursDifference < 0) {
        return 'Appointment has passed';
      } else if (hoursDifference < 24) {
        const hoursRemaining = Math.floor(hoursDifference);
        const minutesRemaining = Math.floor((hoursDifference - hoursRemaining) * 60);
        return `Cannot cancel - only ${hoursRemaining}h ${minutesRemaining}m remaining (must cancel at least 24h before)`;
      } else {
        const deadlineDateTime = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
        return `Can cancel until: ${deadlineDateTime.toLocaleDateString()} at ${deadlineDateTime.toLocaleTimeString()}`;
      }
    } catch (error) {
      return 'Unable to determine cancellation deadline';
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    // Double-check cancellation eligibility
    if (!canCancelAppointment(appointmentToCancel)) {
      toast({
        title: "Cancellation Not Allowed",
        description: "This appointment cannot be cancelled as it's less than 24 hours away.",
        variant: "destructive"
      });
      setAppointmentToCancel(null);
      setShowCancelDialog(false);
      return;
    }

    setLoading(true);
    try {
      // Update appointment status in database
  if (!appointmentToCancel) return;
  const appointmentRef = ref(db, `appointments/${appointmentToCancel.id}`);
      await update(appointmentRef, {
        status: 'cancelled',
        cancellationDate: new Date().toISOString(),
        cancelledBy: 'patient'
      });

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentToCancel!.id 
            ? { ...apt, status: 'cancelled', cancellationDate: new Date().toISOString() }
            : apt
        )
      );

      // Get doctor information for email notification
      let doctorEmail = null;
  if (appointmentToCancel && appointmentToCancel.doctorId) {
        try {
          const doctorRef = ref(db, `users/${appointmentToCancel.doctorId}`);
          const doctorSnapshot = await get(doctorRef);
          if (doctorSnapshot.exists()) {
            doctorEmail = doctorSnapshot.val().email;
          }
        } catch (error) {
          console.error('Error fetching doctor details:', error);
        }
      }

      // Send email notifications
      try {
        await sendAppointmentCancellationEmails({
          patientName: profile.fullName || 'Patient',
          patientEmail: profile.email,
          doctorEmail: doctorEmail,
          date: appointmentToCancel!.date,
          time: appointmentToCancel!.time,
          appointmentId: appointmentToCancel!.id,
          doctorName: appointmentToCancel!.doctorName,
          consultationType: appointmentToCancel!.consultationType,
          cancellationReason: 'Cancelled by patient'
        });
      } catch (emailError) {
        console.error('Error sending cancellation emails:', emailError);
        // Don't fail the cancellation if email fails
      }

      setShowCancelDialog(false);
      setAppointmentToCancel(null);

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully cancelled. Notifications have been sent to the doctor and admin.",
        variant: "default",
      });

    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateCancelAppointment = (appointment: Appointment) => {
  setAppointmentToCancel(appointment);
    setShowCancelDialog(true);
  };

  // Handle cancel profile editing with confirmation
  const handleCancelEdit = () => {
    setShowCancelEditDialog(true);
  };

  const confirmCancelEdit = () => {
    setIsEditing(false);
    setShowCancelEditDialog(false);
    setProfileError("");
    // Reset profile to original state (optional - you might want to reload from database)
  };

  // Handle cancel password change with confirmation
  const handleCancelPasswordChange = () => {
    setShowCancelPasswordDialog(true);
  };

  const confirmCancelPasswordChange = () => {
    setShowChangePassword(false);
    setShowCancelPasswordDialog(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7fafd] pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1164A8]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7fafd] pt-24">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm p-6 flex flex-col mb-8 md:mb-0">
          <div className="mb-6 text-xl font-bold flex items-center gap-2 text-[#1164A8]">
            <FaUser className="text-[#1164A8]" />
            Dashboard
          </div>
          <SidebarItem
            icon={<FaCalendarAlt />}
            label="Appointments"
            active={activeTab === "appointments"}
            onClick={() => setActiveTab("appointments")}
          />
          <SidebarItem
            icon={<FaHistory />}
            label="History"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
          <SidebarItem
            icon={<FaShoppingCart />}
            label="My Orders"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <SidebarItem
            icon={<FaFileMedical />}
            label="Medical Records"
            active={activeTab === "medical"}
            onClick={() => setActiveTab("medical")}
          />
          <SidebarItem
            icon={<FaPills />}
            label="Prescriptions"
            active={activeTab === "prescriptions"}
            onClick={() => setActiveTab("prescriptions")}
          />
          <SidebarItem
            icon={<FaCog />}
            label="Profile Settings"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col gap-8">
          {/* Welcome Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-5">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-[#1164A8]">
                Welcome, {profile.fullName || "User"}
              </h1>
              <div className="text-gray-600">{profile.email}</div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {activeTab === "appointments" && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">
                    Upcoming Appointments
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Doctor
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingAppointments.map(a => (
                          <tr key={a.id} className="border-b">
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {a.doctorName || "Doctor Assignment Pending"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {a.specialization || a.consultationType || "General Consultation"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium">{a.date}</div>
                              <div className="text-sm text-gray-500">{a.time}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="capitalize">{a.consultationType || "Virtual"}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[a.status] || "bg-gray-100 text-gray-700"}`}>{a.status}</span>
                            </td>
                            <td className="px-4 py-4">{a.paymentAmount ? `₹${a.paymentAmount}` : "N/A"}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <button 
                                  className="text-[#1164A8] hover:underline text-sm"
                                  onClick={() => viewDoctorDetails(a.doctorId)}
                                >
                                  View
                                </button>
                                {(a.status === 'confirmed' || a.status === 'pending') && (
                                  <>
                                    {canCancelAppointment(a) ? (
                                      <button 
                                        className="text-red-600 hover:underline text-sm"
                                        onClick={() => initiateCancelAppointment(a)}
                                        title={getCancellationDeadlineInfo(a)}
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      <span 
                                        className="text-gray-400 text-sm cursor-not-allowed"
                                        title={getCancellationDeadlineInfo(a)}
                                      >
                                        Cannot Cancel
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {upcomingAppointments.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-4 text-center text-gray-500"
                            >
                              No upcoming appointments found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Meetings Section */}
                <div className="mt-10">
                  <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">Meetings</h2>
                  {upcomingAppointments.filter(a => a.meetingLink).length > 0 ? (
                    <div className="grid gap-4">
                      {upcomingAppointments.filter(a => a.meetingLink).map(a => (
                        <div key={a.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <div className="font-medium text-gray-900">{a.doctorName || "Doctor Assignment Pending"}</div>
                            <div className="text-sm text-gray-500 mb-1">{a.date} {a.time}</div>
                          </div>
                          <a
                            href={a.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1164A8] text-white rounded hover:bg-[#0e5395] text-sm font-medium text-center"
                          >
                            Join Meeting
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">No meetings scheduled yet.</div>
                  )}
                </div>
              </>
            )}

            {activeTab === "orders" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-[#1164A8] flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  My Orders
                </h2>
                <p className="text-gray-600 mb-6">
                  View and manage all your product orders. You can cancel orders that are still pending or confirmed.
                </p>

                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Order Information</h4>
                      <p className="text-blue-800 text-sm">
                        All your orders are shown here with their current status. You can cancel orders while they are in pending or confirmed status.
                      </p>
                    </div>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Found</h3>
                    <p className="text-gray-500">You don't have any orders at the moment.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg shadow-md border p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Order #{order.orderId}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button
                                onClick={() => {
                                  setOrderToCancel(order);
                                  setShowOrderCancelDialog(true);
                                }}
                                className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg border border-red-200 transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
                              >
                                <X className="h-4 w-4" />
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800">Items Ordered</h4>
                            {order.items.map((item, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                {item.name} (Qty: {item.quantity}) - ₹{item.price}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800">Payment Details</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              Total: ₹{order.totalAmount}
                            </p>
                            <p className="text-sm text-gray-600">
                              Method: {order.paymentMethod.toUpperCase()}
                            </p>
                            {order.paymentId && (
                              <p className="text-sm text-gray-600">
                                Payment ID: {order.paymentId}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-800">Delivery Address</h4>
                            <div className="text-sm text-gray-600">
                              <p>{order.userAddress.street}</p>
                              {order.userAddress.line2 && <p>{order.userAddress.line2}</p>}
                              <p>{order.userAddress.city}, {order.userAddress.state}</p>
                              <p>{order.userAddress.pincode}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "medical" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">
                  Medical Records
                </h2>
                
                <div className="mb-4">
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="px-4 py-2 bg-[#1164A8] text-white rounded hover:bg-[#0e5395] mb-4"
                  >
                    Upload New Document
                  </button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        try {
                          const file = e.target.files[0];
                          const fileRefMedical = storageRef(storage, `users/${userId}/medicalRecords/${file.name}`);
                          const fileRefReport = storageRef(storage, `users/${userId}/reports/${file.name}`);

                          // Upload to medicalRecords
                          await uploadBytes(fileRefMedical, file);
                          // Upload to reports with metadata
                          await uploadBytes(fileRefReport, file, {
                            customMetadata: {
                              userName: profile.fullName || '',
                              userEmail: profile.email || '',
                              category: 'document',
                              originalName: file.name
                            }
                          });

                          // Get the download URL (from medicalRecords for patient view)
                          const url = await getDownloadURL(fileRefMedical);
                          
                          // Update state with the new record
                          setMedicalRecords([...medicalRecords, {
                            name: file.name,
                            url,
                            type: file.type,
                            category: 'document',
                            uploadDate: new Date().toLocaleDateString()
                          }]);

                          toast({
                            title: "Success",
                            description: "Document uploaded successfully!",
                            variant: "default",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to upload document",
                            variant: "destructive",
                          });
                          console.error("Upload error:", error);
                        }
                      }
                    }}
                  />
                </div>
                
                {medicalRecords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {medicalRecords.map((record, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          {record.type?.includes('pdf') || record.name.endsWith('.pdf') ? (
                            <FaFilePdf className="text-red-500 text-xl" />
                          ) : (
                                                        <FaFileImage className="text-blue-500 text-xl" />
                          )}
                          <div>
                            <div className="font-medium truncate">{record.name}</div>
                            {record.uploadDate && (
                              <div className="text-xs text-gray-500">Uploaded: {record.uploadDate}</div>
                            )}
                          </div>
                        </div>
                        
                        {record.category && (
                          <div className="mb-2">
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                              {record.category.charAt(0).toUpperCase() + record.category.slice(1)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <a 
                            href={record.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#1164A8] hover:underline text-sm"
                          >
                            View
                          </a>
                          <button 
                            onClick={async () => {
                              try {
                                // Delete from Firebase Storage
                                const fileRef = storageRef(storage, `users/${userId}/medicalRecords/${record.name}`);
                                await deleteObject(fileRef);
                                
                                // Update state
                                setMedicalRecords(medicalRecords.filter((_, i) => i !== index));

                                toast({
                                  title: "Success",
                                  description: "Document deleted successfully!",
                                  variant: "default",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete document",
                                  variant: "destructive",
                                });
                                console.error("Delete error:", error);
                              }
                            }}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    No medical records found.
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#1164A8]">
                    Profile Information
                  </h2>
                  {!isEditing && !showChangePassword && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-[#1164A8] text-white rounded hover:bg-[#0e5395]"
                      >
                        <FaEdit /> Edit Profile
                      </button>
                      <button
                        onClick={() => setShowChangePassword(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        <FaLock /> Change Password
                      </button>
                    </div>
                  )}
                </div>

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                    {successMessage}
                  </div>
                )}

                {!isEditing && !showChangePassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <b>Full Name:</b> {profile.fullName}
                    </div>
                    <div>
                      <b>Email:</b> {profile.email}
                    </div>
                    <div>
                      <b>Phone:</b> {profile.phone}
                    </div>
                    <div>
                      <b>Gender:</b> {profile.gender}
                    </div>
                    <div>
                      <b>State:</b> {profile.state}
                    </div>
                    <div>
                      <b>District:</b> {profile.district}
                    </div>
                    <div>
                      <b>City:</b> {profile.city}
                    </div>
                    <div>
                      <b>Locality:</b> {profile.locality}
                    </div>
                    <div>
                      <b>Area:</b> {profile.area}
                    </div>
                    <div>
                      <b>Pincode:</b> {profile.pincode}
                    </div>
                    <div>
                      <b>Age:</b> {profile.age}
                    </div>
                    <div>
                      <b>Disability Type:</b> {profile.disabilityType}
                    </div>
                    <div>
                      <b>Category:</b> {profile.category}
                    </div>
                    <div>
                      <b>Medical Conditions:</b> {profile.medicalConditions}
                    </div>
                    <div>
                      <b>Mode Of Care:</b> {profile.modeOfCare}
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div>
                    {profileError && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {profileError}
                      </div>
                    )}
                    <form>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1 font-medium">
                            Full Name*
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={profile.fullName}
                            onChange={e => handleProfileChange(e as React.ChangeEvent<HTMLInputElement>)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">
                            Email*
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={e => handleProfileChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">
                            Phone*
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={profile.phone}
                            onChange={e => handleProfileChange(e as React.ChangeEvent<HTMLInputElement>)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={profile.gender}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">State</label>
                          <select
                            name="state"
                            value={profile.state}
                            onChange={e => {
                              handleProfileChange(e);
                              setProfile(p => ({ ...p, district: '', city: '', locality: '', area: '' }));
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="">Select State</option>
                            {getStates().map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">District</label>
                          <select
                            name="district"
                            value={profile.district || ''}
                            onChange={e => {
                              handleProfileChange(e);
                              setProfile(p => ({ ...p, city: '', locality: '', area: '' }));
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            disabled={!profile.state}
                          >
                            <option value="">Select District</option>
                            {getDistricts(profile.state).map(district => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">City</label>
                          <select
                            name="city"
                            value={profile.city}
                            onChange={e => {
                              handleProfileChange(e);
                              setProfile(p => ({ ...p, locality: '', area: '' }));
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            disabled={!profile.district}
                          >
                            <option value="">Select City</option>
                            {getCities(profile.state, profile.district || '').map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Locality</label>
                          <select
                            name="locality"
                            value={profile.locality || ''}
                            onChange={e => {
                              handleProfileChange(e);
                              setProfile(p => ({ ...p, area: '' }));
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            disabled={!profile.city}
                          >
                            <option value="">Select Locality</option>
                            {getLocalities(profile.state, profile.district || '', profile.city).map(locality => (
                              <option key={locality} value={locality}>{locality}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Area</label>
                          <select
                            name="area"
                            value={profile.area}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            disabled={!profile.locality}
                          >
                            <option value="">Select Area</option>
                            {getAreas(profile.state, profile.district || '', profile.city, profile.locality || '').map(area => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">
                            Pincode
                          </label>
                          <input
                            type="text"
                            name="pincode"
                            value={profile.pincode}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Age</label>
                          <input
                            type="number"
                            name="age"
                            value={profile.age}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">
                            Disability Type
                          </label>
                          <input
                            type="text"
                            name="disabilityType"
                            value={profile.disabilityType}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">
                            Category
                          </label>
                          <input
                            type="text"
                            name="category"
                            value={profile.category}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-1 font-medium">
                            Medical Conditions
                          </label>
                          <textarea
                            name="medicalConditions"
                            value={profile.medicalConditions}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-1 font-medium">
                            Mode Of Care
                          </label>
                          <input
                            type="text"
                            name="modeOfCare"
                            value={profile.modeOfCare}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                        >
                          <FaTimes /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveProfileChanges}
                          className="px-4 py-2 bg-[#1164A8] text-white rounded hover:bg-[#0e5395] flex items-center gap-2"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                          ) : (
                            <FaCheck />
                          )}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {showChangePassword && (
                  <div>
                    {passwordError && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {passwordError}
                      </div>
                    )}
                    <form className="max-w-md">
                      <div className="mb-4">
                        <label className="block mb-1 font-medium">
                          Current Password*
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium">
                          New Password*
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          required
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Must be at least 6 characters
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium">
                          Confirm New Password*
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelPasswordChange}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                        >
                          <FaTimes /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePasswordChange}
                          className="px-4 py-2 bg-[#1164A8] text-white rounded hover:bg-[#0e5395] flex items-center gap-2"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                          ) : (
                            <FaCheck />
                          )}
                          Change Password
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">
                  Appointment History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Doctor
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Date & Time
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyAppointments.map(a => (
                        <tr key={a.id} className="border-b">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {a.doctorName || "Doctor Assignment Pending"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {a.specialization || a.consultationType || "General Consultation"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium">{a.date}</div>
                            <div className="text-sm text-gray-500">{a.time}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="capitalize">{a.consultationType || "Virtual"}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[a.status] || "bg-gray-100 text-gray-700"}`}>{a.status}</span>
                          </td>
                          <td className="px-4 py-4">{a.paymentAmount ? `₹${a.paymentAmount}` : "N/A"}</td>
                        </tr>
                      ))}
                      {historyAppointments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                            No appointment history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-green-800 font-semibold">
                      Completed Appointments
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {completedCount}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-red-800 font-semibold">
                      Cancelled Appointments
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {cancelledCount}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-blue-800 font-semibold">
                      Total Appointments
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalCount}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "prescriptions" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">Prescriptions</h2>
                {prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {prescriptions.map((prescription, index) => {
                      const doctor = doctors[prescription.doctorId] || {};
                      const appointment = appointments.find(a => a.id === prescription.appointmentId);
                      
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{prescription.medicine}</h3>
                              {(prescription.doctorName || doctor.fullName) && (
                                <p className="text-sm text-gray-600">
                                  Prescribed by {prescription.doctorName || doctor.fullName}
                                  {doctor.specialization && ` (${doctor.specialization})`}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(prescription.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {appointment && (
                            <div className="text-sm text-gray-500">
                              <p>From appointment on {appointment.date} at {appointment.time}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <div className="mb-4">
                      <FaPills className="w-12 h-12 text-gray-400 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No prescriptions yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Your prescriptions from doctors will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">Doctor Details</h2>
            <p><strong>Name:</strong> {selectedDoctor.name}</p>
            <p><strong>Phone:</strong> {selectedDoctor.phone}</p>
            <p><strong>Email:</strong> {selectedDoctor.email}</p>
            <button
              className="mt-4 px-4 py-2 bg-[#1164A8] text-white rounded hover:bg-[#0e5395]"
              onClick={() => setSelectedDoctor(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel Appointment Confirmation Dialog */}
  {showCancelDialog && appointmentToCancel && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-red-600">
              Cancel Appointment
            </h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel the appointment with Dr. {appointmentToCancel!.doctorName} on {appointmentToCancel!.date} at {appointmentToCancel!.time}?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-blue-800 text-sm">
                <strong>Cancellation Policy:</strong> {getCancellationDeadlineInfo(appointmentToCancel!)}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> If you have made a payment, the refund will be processed within 3-5 business days. The doctor and admin will be notified of this cancellation.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
              >
                <FaTimes /> No, go back
              </button>
              <button
                onClick={handleCancelAppointment}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                ) : (
                  <FaCheck />
                )}
                Yes, cancel it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Profile Edit Confirmation Dialog */}
      {showCancelEditDialog && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-orange-600">
              Cancel Profile Editing
            </h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel editing your profile? Any unsaved changes will be lost.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-orange-800 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                <strong>Warning:</strong> All your changes will be discarded and cannot be recovered.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelEditDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
              >
                <FaTimes /> Keep Editing
              </button>
              <button
                onClick={confirmCancelEdit}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2"
              >
                <FaCheck /> Yes, discard changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Password Change Confirmation Dialog */}
      {showCancelPasswordDialog && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-orange-600">
              Cancel Password Change
            </h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel changing your password? Any entered information will be lost.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-orange-800 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                <strong>Note:</strong> You will need to re-enter your password information if you want to change it later.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelPasswordDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
              >
                <FaTimes /> Keep Changing
              </button>
              <button
                onClick={confirmCancelPasswordChange}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2"
              >
                <FaCheck /> Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Dialog */}
  {showOrderCancelDialog && orderToCancel && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cancel Order
            </h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel order #{orderToCancel!.orderId}?
            </p>
            
            {/* Order details summary */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Order Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Items:</strong> {orderToCancel!.items.map((item: any) => item.name).join(', ')}</p>
                <p><strong>Total Amount:</strong> ₹{orderToCancel!.totalAmount}</p>
                <p><strong>Payment Method:</strong> {orderToCancel!.paymentMethod.toUpperCase()}</p>
                <p><strong>Order Date:</strong> {new Date(orderToCancel!.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Cancellation reason input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={orderCancellationReason}
                onChange={(e) => setOrderCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {orderCancellationReason.length}/500 characters
              </div>
            </div>

            {/* Warning notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                <strong>Note:</strong> This action cannot be undone. 
                {orderToCancel!.paymentMethod === 'online' ? 
                  ' If payment was made online, refund will be processed within 3-5 business days.' :
                  ' Since this is a COD order, no payment refund is required.'
                }
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOrderCancelDialog(false);
                  setOrderToCancel(null);
                  setOrderCancellationReason("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2 transition-colors"
              >
                <FaTimes className="h-4 w-4" /> Keep Order
              </button>
              <button
                onClick={handleOrderCancellation}
                disabled={!orderCancellationReason.trim() || loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <FaCheck className="h-4 w-4" />
                    Cancel Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;