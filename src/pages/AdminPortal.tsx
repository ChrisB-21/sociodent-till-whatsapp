import { useEffect, useState } from 'react';
import { FaUserMd } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart, Settings, FileText, Check, X,
Search, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Building, Package } from
'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, onValue, update, remove, get } from 'firebase/database';
import { db } from '@/firebase';
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
import UserReportsManager from '@/components/UserReportsManager'; // Import the UserReportsManager component
import { getAvailableDoctors } from '@/services/appointmentSchedulingService';
type User = {
address: any;
area: any;
id: string;
name: string;
email: string;
role: string;
joinDate: string;
status?: string;
age?: string;
gender?: string;
phone?: string;
state?: string;
city?: string;
pincode?: string;
locality?: string;
category?: string;
disabilityType?: string;
disabilityOther?: string;
medicalConditions?: string[];
medicalOther?: string;
medications?: string;
allergies?: string;
modeOfCare?: string;
dentalHistory?: string;
behavioralChallenges?: string;
licenseNumber?: string;
specialization?: string;
createdAt?: number;
  clinicName?: string;
  clinicArea?: string;
  clinicLocation?: string;
  clinicAddress?: string;
};
type DoctorVerification = {
id: string;
name: string;
email: string;
specialization: string;
licenseNumber: string;
submittedDate: string;
status: string;
};
type Appointment = {
pincode: any;
area: string | undefined;
userAddress: any;
state: any;
id: string;
userId: string;
userName: string;
userEmail: string;
doctorId: string;
doctorName: string;
specialization: string;
consultationType?: 'virtual' | 'home' | 'clinic';
date: string;
time: string;
status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
reason?: string;
notes?: string;
createdAt: number;
city?: string;
locality?: string;
};
type OrganizationBooking = {
  id: string;
  contactPersonName: string;
  organizationName: string;
  organizationType: string;
  designation: string;
  contactPhone: string;
  contactEmail: string;
  state: string;
  city: string;
  numberOfBeneficiaries: string;
  preferredDate: string;
  preferredTime: string;
  requirement: string;
  additionalNotes: string;
  submittedAt: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  adminNotes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  assignedDoctor?: string;
  autoCompletedAt?: number;
  autoCompletedReason?: string;
  autoCompletedDate?: string;
};

type Order = {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string; // Add this field
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  totalAmount: number;
  paymentMethod: 'cod' | 'online';
  razorpayPaymentId?: string;
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
  createdAt: number;
  orderDate: string;
  adminNotes?: string;
};

// Function to check and auto-update expired organization bookings
const checkAndUpdateExpiredOrganizationBookings = async (bookings: OrganizationBooking[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison
  
  for (const booking of bookings) {
    // Skip if status is already completed or cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      continue;
    }
    
    // Check both scheduled date (priority) and preferred date
    let dateToCheck = '';
    let dateType = '';
    
    if (booking.scheduledDate && booking.scheduledDate !== "N/A") {
      dateToCheck = booking.scheduledDate;
      dateType = 'scheduled';
    } else if (booking.preferredDate && booking.preferredDate !== "N/A") {
      dateToCheck = booking.preferredDate;
      dateType = 'preferred';
    }
    
    if (dateToCheck) {
      try {
        // Parse the date (assuming format like DD/MM/YYYY or YYYY-MM-DD)
        let checkDate: Date;
        
        if (dateToCheck.includes('/')) {
          // Handle DD/MM/YYYY format
          const [day, month, year] = dateToCheck.split('/');
          checkDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (dateToCheck.includes('-')) {
          // Handle YYYY-MM-DD format
          checkDate = new Date(dateToCheck);
        } else {
          // Try parsing as is
          checkDate = new Date(dateToCheck);
        }
        
        // Check if the date is valid and has passed
        if (!isNaN(checkDate.getTime()) && checkDate < today) {
          console.log(`Auto-updating organization booking ${booking.id} to completed - ${dateType} date ${dateToCheck} has passed`);
          
          // Update the status in Firebase
          const { update, ref } = await import('firebase/database');
          
          const bookingRef = ref(db, `organizationBookings/${booking.id}`);
          await update(bookingRef, {
            status: 'completed',
            autoCompletedAt: Date.now(),
            autoCompletedReason: `${dateType.charAt(0).toUpperCase() + dateType.slice(1)} date exceeded`,
            autoCompletedDate: dateToCheck
          });
        }
      } catch (error) {
        console.error(`Error parsing date for booking ${booking.id}:`, error);
      }
    }
  }
};

// Utility function to convert 12-hour format to 24-hour format
const convertTo24HourFormat = (timeStr: string): string => {
  console.log('Converting time:', timeStr);
  
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error(`Invalid time input: ${timeStr}`);
  }
  
  const cleanTime = timeStr.trim();
  
  // Check if already in 24-hour format (HH:MM or H:MM)
  const twentyFourHourRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (twentyFourHourRegex.test(cleanTime)) {
    // Pad single digit hours with leading zero
    const [hours, minutes] = cleanTime.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Handle 12-hour format (H:MM AM/PM or HH:MM AM/PM)
  const twelveHourRegex = /^(1[0-2]|[1-9]):([0-5][0-9])\s*(AM|PM)$/i;
  const match = cleanTime.match(twelveHourRegex);
  
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM or H:MM AM/PM format`);
  }
  
  let [, hours, minutes, period] = match;
  let hourNum = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hourNum !== 12) {
    hourNum += 12;
  } else if (period.toUpperCase() === 'AM' && hourNum === 12) {
    hourNum = 0;
  }
  
  return `${hourNum.toString().padStart(2, '0')}:${minutes}`;
};

const AdminPortal = () => {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [userRole, setUserRole] = useState('');
type TabType = 'dashboard' | 'users' | 'doctors' | 'appointments' | 'orders' | 'organizations' | 'verifications' | 'reports' | 'settings';
const [activeTab, setActiveTab] = useState<TabType>('dashboard');
const [users, setUsers] = useState<User[]>([]);
const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
const [verificationRequests, setVerificationRequests] = useState<DoctorVerification[]>([]);
const [appointments, setAppointments] = useState<Appointment[]>([]);
const [orders, setOrders] = useState<Order[]>([]);
const [organizationBookings, setOrganizationBookings] = useState<OrganizationBooking[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' |
'descending' } | null>(null);
const [loading, setLoading] = useState(true);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
const [showApproveDialog, setShowApproveDialog] = useState(false);
const [showRejectDialog, setShowRejectDialog] = useState(false);
const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
const [completeConfirm, setCompleteConfirm] = useState<{ show: boolean, appointmentId: string } | null>(null);
const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, userId: string, userName: string, userEmail: string } | null>(null);
const [doctorCityFilter, setDoctorCityFilter] = useState<string>("all");
const [doctorLocalityFilter, setDoctorLocalityFilter] = useState<string>("all");
const navigate = useNavigate();
const { toast } = useToast();
// Check authentication and role
useEffect(() => {
const authStatus = localStorage.getItem('isAuthenticated') === 'true';
const role = localStorage.getItem('userRole') || '';
setIsAuthenticated(authStatus);
setUserRole(role);
if (!authStatus || role !== 'admin') {
toast({
title: "Access Denied"
,
description: "You must be logged in as an admin to access this page"
,
variant: "destructive"
});
navigate('/auth?mode=login&role=admin'
, { replace: true });
}
}, [navigate, toast]);
// Fetch users from Firebase
useEffect(() => {
if (isAuthenticated && userRole === 'admin') {
const usersRef = dbRef(db,
'users');
const appointmentsRef = dbRef(db,
'appointments');

onValue(usersRef, (snapshot) => {
const data = snapshot.val();
if (data) {
const usersArray = Object.keys(data).map(key => {
const user = data[key];
return {
id: key,
name: user.fullName ?? "N/A"
,
email: user.email ?? "N/A"
,
role: user.role ?? "user"
,
joinDate: user.createdAt
? new Date(user.createdAt).toLocaleDateString()
: "N/A"
,
status: user.status ?? "active"
,
age: user.age,
gender: user.gender,
phone: user.phone,
state: user.state,
city: user.city,
pincode: user.pincode,
locality: user.locality,
category: user.category,
disabilityType: user.disabilityType,
disabilityOther: user.disabilityOther,
medicalConditions: user.medicalConditions ?? [],
medicalOther: user.medicalOther,
medications: user.medications,
allergies: user.allergies,
modeOfCare: user.modeOfCare,
dentalHistory: user.dentalHistory,
behavioralChallenges: user.behavioralChallenges,
licenseNumber: user.licenseNumber,
specialization: user.specialization,
createdAt: user.createdAt,
...user,
};
});
setUsers(usersArray);
setFilteredUsers(usersArray);
// Set verification requests (pending doctors)
const pendingDoctors = usersArray
.filter(user => user.role === 'doctor' && user.status === 'pending')
.map(user => ({
id: user.id,
name: user.name,
email: user.email,
specialization: user.specialization ?? "N/A"
,
licenseNumber: user.licenseNumber ?? "N/A"
,
submittedDate: user.joinDate,
status: user.status ?? "pending"
}));
setVerificationRequests(pendingDoctors);
setLoading(false);
} else {
setUsers([]);
setFilteredUsers([]);
setVerificationRequests([]);
setLoading(false);
}
});
// Fetch appointments
onValue(appointmentsRef, (snapshot) => {
const data = snapshot.val();
if (data) {
const appointmentsArray = Object.keys(data).map(key => {
const appointment = data[key];
return {
id: key,
userId: appointment.userId,
userName: appointment.userName ?? "N/A"
,
userEmail: appointment.userEmail ?? "N/A"
,
doctorId: appointment.doctorId,
doctorName: appointment.doctorName ?? "N/A"
,
specialization: appointment.specialization ?? "N/A"
,
consultationType: appointment.consultationType ?? 'clinic', // Add consultation type here
date: appointment.date ?? "N/A"
,
time: appointment.time ?? "N/A"
,
status: appointment.status ?? "pending"
,
reason: appointment.reason,
notes: appointment.notes,
createdAt: appointment.createdAt ?? Date.now(),
state: appointment.state ?? '',
city: appointment.city ?? '',
locality: appointment.locality ?? '',
area: appointment.area ?? '', // <-- add area property to match Appointment type
userAddress: appointment.userAddress ?? {},
pincode: appointment.pincode ?? '', // <-- add pincode property to match Appointment type
};
});
setAppointments(appointmentsArray);
} else {
setAppointments([]);
}
});

// Fetch orders
const ordersRef = dbRef(db, 'orders');
onValue(ordersRef, async (snapshot) => {
const data = snapshot.val();
if (data) {
const ordersArray = await Promise.all(Object.keys(data).map(async (key) => {
const order = data[key];
// Look up user name
let userName = "N/A";
if (order.userId) {
try {
const userRef = dbRef(db, `users/${order.userId}`);
const userSnapshot = await get(userRef);
if (userSnapshot.exists()) {
const userData = userSnapshot.val();
userName = userData.fullName || userData.name || "N/A";
}
} catch (error) {
console.error("Error fetching user data for order:", error);
}
}
return {
id: key,
userId: order.userId ?? "N/A",
userEmail: order.userEmail ?? "N/A",
userName: userName,
customerDetails: order.customerDetails ?? {},
items: order.items ?? [],
totalAmount: order.totalAmount ?? 0,
paymentMethod: order.paymentMethod ?? 'cod',
razorpayPaymentId: order.razorpayPaymentId,
status: order.status ?? 'pending',
createdAt: order.createdAt ?? Date.now(),
orderDate: order.orderDate ?? new Date().toISOString(),
adminNotes: order.adminNotes
};
}));
setOrders(ordersArray);
} else {
setOrders([]);
}
});

// Fetch organization bookings
const organizationBookingsRef = dbRef(db, 'organizationBookings');
onValue(organizationBookingsRef, async (snapshot) => {
const data = snapshot.val();
if (data) {
const organizationBookingsArray = Object.keys(data).map(key => {
const booking = data[key];
return {
id: key,
contactPersonName: booking.contactPersonName ?? "N/A",
organizationName: booking.organizationName ?? "N/A", 
organizationType: booking.organizationType ?? "N/A",
designation: booking.designation ?? "N/A",
contactPhone: booking.contactPhone ?? "N/A",
contactEmail: booking.contactEmail ?? "N/A",
state: booking.state ?? "N/A",
city: booking.city ?? "N/A",
numberOfBeneficiaries: booking.numberOfBeneficiaries ?? "N/A",
preferredDate: booking.preferredDate ?? "N/A",
preferredTime: booking.preferredTime ?? "N/A",
requirement: booking.requirement ?? "N/A",
additionalNotes: booking.additionalNotes ?? "",
submittedAt: booking.submittedAt ?? "N/A",
status: booking.status ?? "pending",
adminNotes: booking.adminNotes,
scheduledDate: booking.scheduledDate,
scheduledTime: booking.scheduledTime,
assignedDoctor: booking.assignedDoctor,
autoCompletedAt: booking.autoCompletedAt,
autoCompletedReason: booking.autoCompletedReason,
autoCompletedDate: booking.autoCompletedDate
};
});

// Check and auto-update expired organization bookings
await checkAndUpdateExpiredOrganizationBookings(organizationBookingsArray);

setOrganizationBookings(organizationBookingsArray);
} else {
setOrganizationBookings([]);
}
});
}
}, [isAuthenticated, userRole]);

// Periodic check for expired organization bookings (every 5 minutes)
useEffect(() => {
  if (isAuthenticated && userRole === 'admin') {
    const interval = setInterval(async () => {
      console.log('Running periodic check for expired organization bookings...');
      await checkAndUpdateExpiredOrganizationBookings(organizationBookings);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }
}, [isAuthenticated, userRole, organizationBookings]);

// Filter users based on search term
useEffect(() => {
if (searchTerm.trim() === '') {
setFilteredUsers(users);
} else {
const filtered = users.filter(user =>
user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
user.state?.toLowerCase().includes(searchTerm.toLowerCase())
);
setFilteredUsers(filtered);
}
}, [searchTerm, users]);
// Sort users
// Sort users
const requestSort = (key: keyof User) => {
  let direction: 'ascending' | 'descending' = 'ascending';
  if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
	direction = 'descending';
  }
  setSortConfig({ key, direction });
  const sortedUsers = [...filteredUsers].sort((a, b) => {
  const aValue = a[key] ?? '';
  const bValue = b[key] ?? '';
  if (aValue < bValue) {
    return direction === 'ascending' ? -1 : 1;
  }
  if (aValue > bValue) {
    return direction === 'ascending' ? 1 : -1;
  }
  return 0;
  });
  setFilteredUsers(sortedUsers);
};
const getSortIndicator = (key: keyof User) => {
if (!sortConfig || sortConfig.key !== key) return null;
return sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown
size={14} />;
};
// Update user status
const updateUserStatus = async (userId: string, newStatus: string) => {
  try {
    const userRef = dbRef(db, `users/${userId}`);
    
    // Get user data first to send email
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();
    
    await update(userRef, {
      status: newStatus,
      updatedAt: Date.now()
    });
    
    // Send email notification for doctor approval/rejection
    if (userData && userData.role === 'doctor' && (newStatus === 'approved' || newStatus === 'rejected')) {
      try {
        const { sendDoctorApprovalStatusEmail } = await import('../services/emailService');
        const emailSent = await sendDoctorApprovalStatusEmail({
          email: userData.email,
          name: userData.fullName || userData.name,
          approved: newStatus === 'approved',
          rejectionReason: newStatus === 'rejected' ? 'Please ensure all required documents are properly submitted and meet our standards.' : undefined
        });
        
        if (emailSent) {
          console.log(`Doctor ${newStatus} email sent successfully to ${userData.email}`);
        } else {
          console.error(`Failed to send doctor ${newStatus} email to ${userData.email}`);
          toast({
            title: "Email Notification Failed",
            description: `Doctor status updated but email notification failed. Please contact ${userData.email} manually.`,
            variant: "destructive"
          });
        }
      } catch (emailError) {
        console.error(`Error sending doctor ${newStatus} email:`, emailError);
        toast({
          title: "Email System Error",
          description: `Doctor status updated but email system is unavailable. Please contact ${userData.email} manually.`,
          variant: "destructive"
        });
      }
    }
    
    // Also update local state to reflect changes immediately
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      )
    );
    
    toast({
      title: "Status Updated",
      description: `Doctor status has been updated to ${newStatus}. ${userData?.role === 'doctor' ? 'Email notification has been sent to the doctor.' : 'The user will see the changes on their next login.'}`,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    toast({
      title: "Error",
      description: "Failed to update user status",
      variant: "destructive"
    });
  }
};

// Delete user permanently
const deleteUserPermanently = async (userId: string) => {
  try {
    // Get user data first for confirmation
    const userRef = dbRef(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();
    
    // Delete user from database
    await remove(userRef);
    
    // Also delete any related data (appointments, schedules, etc.)
    const appointmentsRef = dbRef(db, 'appointments');
    const appointmentsSnapshot = await get(appointmentsRef);
    if (appointmentsSnapshot.exists()) {
      const appointments = appointmentsSnapshot.val();
      Object.keys(appointments).forEach(async (appointmentId) => {
        const appointment = appointments[appointmentId];
        if (appointment.userId === userId || appointment.doctorId === userId) {
          await remove(dbRef(db, `appointments/${appointmentId}`));
        }
      });
    }
    
    // Delete doctor schedules if user is a doctor
    if (userData?.role === 'doctor') {
      const schedulesRef = dbRef(db, 'doctorSchedules');
      const schedulesSnapshot = await get(schedulesRef);
      if (schedulesSnapshot.exists()) {
        const schedules = schedulesSnapshot.val();
        Object.keys(schedules).forEach(async (scheduleId) => {
          const schedule = schedules[scheduleId];
          if (schedule.doctorId === userId) {
            await remove(dbRef(db, `doctorSchedules/${scheduleId}`));
          }
        });
      }
    }
    
    // Update local state to remove the user immediately
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    setFilteredUsers(prevFiltered => prevFiltered.filter(user => user.id !== userId));
    
    // Close confirmation dialog
    setDeleteConfirm(null);
    
    toast({
      title: "User Deleted",
      description: `User account and all associated data have been permanently deleted.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    toast({
      title: "Error",
      description: "Failed to delete user account",
      variant: "destructive"
    });
  }
};

// Handle delete confirmation
const handleDeleteUser = (user: User) => {
  setDeleteConfirm({
    show: true,
    userId: user.id,
    userName: user.name,
    userEmail: user.email
  });
};
// Update appointment status and ensure patient profile reflects changes
const updateAppointmentStatus = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
  try {
    const appointmentRef = dbRef(db, `appointments/${appointmentId}`);    // Fetch the appointment to get doctor info
    const snapshot = await get(appointmentRef);
    if (!snapshot.exists()) throw new Error('Appointment not found');
    
    // Update status and updatedAt
    await update(appointmentRef, {
      status: newStatus,
      updatedAt: Date.now(),
    });
    // Optionally, update patient-specific data if you have a user-appointments node
    // (Assuming appointments are only in 'appointments' node and filtered by userId in patient profile)
    toast({
      title: "Appointment Updated",
      description: `Appointment status has been updated to ${newStatus}`,
    });
    // Optionally, refresh appointments state
    setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: newStatus, updatedAt: Date.now() } : app));  } catch (error) {
    console.error("Error updating appointment status:", error);
    toast({
      title: "Error",
      description: "Failed to update appointment status",
      variant: "destructive"
    });
  }
};

// Update order status
const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled') => {
  try {
    const orderRef = dbRef(db, `orders/${orderId}`);
    await update(orderRef, { 
      status: newStatus,
      updatedAt: Date.now()
    });
    
    toast({
      title: "Success",
      description: `Order status has been updated to ${newStatus}`,
      variant: "default"
    });
    
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
  } catch (error) {
    console.error("Error updating order status:", error);
    toast({
      title: "Error",
      description: "Failed to update order status",
      variant: "destructive"
    });
  }
};

// Handle view user details
const handleViewUserDetails = (user: User) => {
setSelectedUser(user);
setViewMode('details');
};
// Handle back to list view
const handleBackToList = () => {
setViewMode('list');
setSelectedUser(null);
};
// Handle schedule form changes
// Handle select change for doctor
// Submit new schedule
// Edit schedule
// Delete schedule
// Stats data based on actual users
const stats = [
{
title: 'Total Users'
,
value: users.length.toString(),
change: '+12%'
,
changeType: 'positive' as const
},
{
title: 'Admins'
,
value: users.filter(u => u.role === 'admin').length.toString(),
change: '+5%'
,
changeType: 'positive' as const
},
{
title: 'Doctors'
,
value: users.filter(u => u.role === 'doctor').length.toString(),
change: '+8%'
,
changeType: 'positive' as const
},
{
title: 'Approved'
,
value: users.filter(u => u.status === 'approved').length.toString(),
change: '+3%'
,
changeType: 'positive' as const
},
{
title: 'Appointments'
,
value: appointments.length.toString(),
change: '+15%'
,
changeType: 'positive' as const
}
];
const handleApproveDoctor = (id: string) => {
setSelectedDoctorId(id);
setShowApproveDialog(true);
};
const handleRejectDoctor = (id: string) => {
setSelectedDoctorId(id);
setShowRejectDialog(true);
};
const confirmApproveDoctor = async () => {
  if (selectedDoctorId) {
    await updateUserStatus(selectedDoctorId, 'approved');
    
    // Close details view if the approved doctor was being viewed
    if (selectedUser && selectedUser.id === selectedDoctorId) {
      setViewMode('list');
      setSelectedUser(null);
    }
  }
  setShowApproveDialog(false);
  setSelectedDoctorId(null);
};

const confirmRejectDoctor = async () => {
  if (selectedDoctorId) {
    await updateUserStatus(selectedDoctorId, 'rejected');
    
    // Close details view if the rejected doctor was being viewed
    if (selectedUser && selectedUser.id === selectedDoctorId) {
      setViewMode('list');
      setSelectedUser(null);
    }
  }
  setShowRejectDialog(false);
  setSelectedDoctorId(null);
};
const tabs = [
{ id: 'dashboard'
, name: 'Dashboard'
, icon: <BarChart className="w-5 h-5 mr-2" /> },
{ id: 'users'
, name: 'User Management'
, icon: <Users className="w-5 h-5 mr-2" /> },
{ id: 'doctors'
, name: 'Doctors'
, icon: <FaUserMd className="w-5 h-5 mr-2" /> },
{ id: 'appointments'
, name: 'Appointments'
, icon: <Clock className="w-5 h-5 mr-2" /> },
{ id: 'orders'
, name: 'Orders'
, icon: <Package className="w-5 h-5 mr-2" /> },
{ id: 'organizations'
, name: 'Organization Bookings'
, icon: <Building className="w-5 h-5 mr-2" /> },
{ id: 'verifications'
, name: 'Doctor Verifications'
, icon: <FileText className="w-5 h-5 mr-2" /> },
{ id: 'reports'
, name: 'Reports'
, icon: <FileText className="w-5 h-5 mr-2" /> },
{ id: 'settings'
, name: 'Settings'
, icon: <Settings className="w-5 h-5 mr-2" /> }
];
// Get available doctors for scheduling
// State for manual doctor assignment
const [assigningAppointmentId, setAssigningAppointmentId] = useState<string | null>(null);
const [selectedAssignDoctorId, setSelectedAssignDoctorId] = useState<string | null>(null);
const [availableDoctorsForAppointment, setAvailableDoctorsForAppointment] = useState<any[]>([]);
const [checkingAvailability, setCheckingAvailability] = useState(false);

// Handler to check available doctors for an appointment
const checkAvailableDoctorsForAppointment = async (appointment: any) => {
  setCheckingAvailability(true);
  try {
    // Validate appointment data
    if (!appointment || !appointment.date || !appointment.time) {
      throw new Error('Invalid appointment data: missing date or time');
    }

    // Log the appointment data for debugging
    console.log('🔍 Checking availability for appointment:', {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      consultationType: appointment.consultationType,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName
    });
    
    // First, let's check how many doctors we have in the admin portal
    const adminApprovedDoctors = users.filter(user => user.role === 'doctor' && user.status === 'approved');
    console.log(`🩺 Admin Portal shows ${adminApprovedDoctors.length} approved doctors:`);
    adminApprovedDoctors.forEach(doctor => {
      console.log(`   - Dr. ${doctor.name} (${doctor.specialization || 'General'}) - Status: ${doctor.status}`);
    });
    
    const consultationType = appointment.consultationType || 'clinic';
    
    // Map consultation types to our scheduling service format
    const scheduleMode = consultationType === 'virtual' ? 'virtual' : 
                        consultationType === 'home' ? 'home' : 'clinic';
    
    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let formattedDate = appointment.date;
    
    // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (!dateRegex.test(appointment.date) && appointment.date.includes('/')) {
      const [day, month, year] = appointment.date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log(`📅 Converted date from ${appointment.date} to ${formattedDate}`);
    }
    
    // Convert appointment time to 24-hour format using global function
    let formattedTime = appointment.time;
    try {
      formattedTime = convertTo24HourFormat(appointment.time);
      if (formattedTime !== appointment.time) {
        console.log(`⏰ Converted time from ${appointment.time} to ${formattedTime}`);
      }
    } catch (timeError) {
      throw new Error(`Time format error: ${timeError instanceof Error ? timeError.message : 'Unknown error'}`);
    }
    
    // Validate time format (should be HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(formattedTime)) {
      throw new Error(`Invalid time format: ${formattedTime}. Expected HH:MM format.`);
    }
    
    console.log(`🎯 Calling getAvailableDoctors with: date=${formattedDate}, time=${formattedTime}, mode=${scheduleMode}`);
    
    const result = await getAvailableDoctors(formattedDate, formattedTime, scheduleMode);
    
    if (!result || !result.availableDoctors) {
      throw new Error('Invalid response from availability service');
    }
    
    // Filter to only show available doctors and prioritize by location
    const availableDoctors = result.availableDoctors
      .filter(doctor => doctor.isAvailable)
      .map(doctor => {
        // Find the full doctor details from users array
        const doctorDetails = users.find(u => u.id === doctor.doctorId);
        return {
          ...doctor,
          // Add location details from the doctor's profile
          city: doctorDetails?.city || 'Not specified',
          locality: doctorDetails?.locality || 'Not specified'
        };
      })
      .sort((a, b) => {
        // Prioritize doctors in the same city and locality
        const aMatchesCity = a.city.toLowerCase() === (appointment.city || '').toLowerCase();
        const bMatchesCity = b.city.toLowerCase() === (appointment.city || '').toLowerCase();
        const aMatchesLocality = a.locality.toLowerCase() === (appointment.locality || '').toLowerCase();
        const bMatchesLocality = b.locality.toLowerCase() === (appointment.locality || '').toLowerCase();

        if (aMatchesCity && !bMatchesCity) return -1;
        if (!aMatchesCity && bMatchesCity) return 1;
        if (aMatchesLocality && !bMatchesLocality) return -1;
        if (!aMatchesLocality && bMatchesLocality) return 1;
        return 0;
      });

    setAvailableDoctorsForAppointment(availableDoctors);
    
    // Log scheduling analysis
    console.log(`\n✅ Doctor Availability Check Complete for Appointment ${appointment.id}:`);
    console.log(`📅 Date: ${formattedDate}, Time: ${formattedTime} (original: ${appointment.time}), Type: ${scheduleMode.toUpperCase()}`);
    console.log(`📊 Total doctors: ${result.totalDoctors}, Available: ${result.availableCount}, Unavailable: ${result.unavailableCount}`);
    
    if (result.unavailableCount > 0) {
      const unavailableDoctors = result.availableDoctors.filter(doctor => !doctor.isAvailable);
      console.log('\n❌ Unavailable doctors and reasons:');
      unavailableDoctors.forEach(doctor => {
        console.log(`   - Dr. ${doctor.doctorName}: ${doctor.conflictReason}`);
      });
    }
    
    if (availableDoctors.length > 0) {
      console.log('\n✅ Available doctors:');
      availableDoctors.forEach(doctor => {
        console.log(`   - Dr. ${doctor.doctorName} (${doctor.specialization})`);
      });
    }
    
    toast({
      title: 'Availability Check Complete',
      description: `${availableDoctors.length} doctors available for this appointment slot`,
    });
    
  } catch (error) {
    console.error('❌ Error checking doctor availability:', error);
    
    // More detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    toast({
      title: 'Availability Check Failed',
      description: `Error: ${errorMessage}`,
      variant: 'destructive',
    });
    setAvailableDoctorsForAppointment([]);
  } finally {
    setCheckingAvailability(false);
  }
};

// Handler to assign doctor to appointment
const handleAssignDoctor = async (appointmentId: string, doctorId: string) => {
  const doctor = users.find(u => u.id === doctorId);
  if (!doctor) {
    toast({
      title: 'Error',
      description: 'Selected doctor not found',
      variant: 'destructive',
    });
    return;
  }
  
  try {
    // Get appointment details first
    const appointmentRef = dbRef(db, `appointments/${appointmentId}`);
    const appointmentSnapshot = await get(appointmentRef);
    
    if (!appointmentSnapshot.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointmentData = appointmentSnapshot.val();
    
    console.log('🔄 Assigning doctor to appointment:', {
      appointmentId,
      doctorId,
      doctorName: doctor.name,
      appointmentDate: appointmentData.date,
      appointmentTime: appointmentData.time
    });
    
    // Double-check availability before assignment using our scheduling service
    const consultationType = appointmentData.consultationType || 'clinic';
    const scheduleMode = consultationType === 'virtual' ? 'virtual' : 
                        consultationType === 'home' ? 'home' : 'clinic';
    
    // Validate and format date if needed
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let formattedDate = appointmentData.date;
    
    if (!dateRegex.test(appointmentData.date) && appointmentData.date.includes('/')) {
      const [day, month, year] = appointmentData.date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Convert appointment time to 24-hour format for scheduling service
    const formattedTime = convertTo24HourFormat(appointmentData.time);
    console.log('🔄 Converting time for doctor assignment:', {
      originalTime: appointmentData.time,
      convertedTime: formattedTime
    });
    
    const availabilityResult = await getAvailableDoctors(formattedDate, formattedTime, scheduleMode);
    const doctorAvailability = availabilityResult.availableDoctors.find(d => d.doctorId === doctorId);
    
    if (!doctorAvailability || !doctorAvailability.isAvailable) {
      const conflictReason = doctorAvailability?.conflictReason || 'Doctor not available';
      throw new Error(`Cannot assign doctor: ${conflictReason}`);
    }
    
    // Update appointment with doctor assignment
    await update(appointmentRef, {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization || 'General',
      status: 'confirmed',
      updatedAt: Date.now(),
      assignmentType: 'manual',
      assignedBy: 'admin', // You might want to track the actual admin user
      assignedAt: Date.now()
    });
    
    console.log('✅ Doctor assigned successfully');
    
    // Send email notification to the assigned doctor
    try {
      const { sendDoctorAssignmentNotificationToDoctor } = await import('../services/emailService');
      if (doctor.email) {
        await sendDoctorAssignmentNotificationToDoctor(
          doctor.name,
          doctor.email,
          appointmentData.userName,
          appointmentData.userEmail || '',
          appointmentData.date,
          appointmentData.time,
          appointmentData.consultationType || 'consultation',
          appointmentId
        );
        console.log(`📧 Email notification sent to doctor: ${doctor.email}`);
      }
    } catch (emailError) {
      console.error('⚠️ Error sending email notification to doctor:', emailError);
      // Don't fail the assignment if email fails
    }

    // If this is a clinic visit, notify the patient with clinic + doctor details
    try {
      const consultationTypeFinal = appointmentData.consultationType || 'clinic';
      if (consultationTypeFinal === 'clinic') {
        const { sendDoctorAssignmentEmailToPatient } = await import('../services/emailService');
        // Find doctor's user record for phone/clinic info
        const doctorUser = users.find(u => u.id === doctorId) as any;
        const clinicName = doctorUser?.clinicName || doctorUser?.clinicDetails?.name || doctorUser?.clinicAddress || '';
        const clinicAddress = doctorUser?.clinicAddress || doctorUser?.clinicDetails?.address || '';
        const doctorPhone = doctorUser?.phone || doctor.phone || '';

        await sendDoctorAssignmentEmailToPatient({
          patientName: appointmentData.userName || appointmentData.patientName || 'Patient',
          patientEmail: appointmentData.userEmail || appointmentData.patientEmail || '',
          doctorName: doctor.name,
          doctorPhone,
          doctorSpecialization: doctor.specialization || doctorUser?.specialization || '',
          date: appointmentData.date,
          time: appointmentData.time,
          consultationType: consultationTypeFinal,
          appointmentId,
          clinicName: clinicName || undefined,
          clinicAddress: clinicAddress || undefined
        });
        console.log('📧 Patient notified of clinic assignment');
      }
    } catch (patientEmailError) {
      console.error('⚠️ Error sending assignment email to patient:', patientEmailError);
    }
    
    toast({
      title: 'Doctor Assigned Successfully',
      description: `Assigned Dr. ${doctor.name} to appointment with conflict validation`,
    });
    
    // Reset the assignment UI
    setAssigningAppointmentId(null);
    setSelectedAssignDoctorId(null);
    setAvailableDoctorsForAppointment([]);
    
  } catch (error) {
    console.error("❌ Error assigning doctor:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign doctor';
    toast({
      title: 'Assignment Failed',
      description: errorMessage,
      variant: 'destructive',
    });
  }
};
// Define the checkAppointmentStatus function
const checkAppointmentStatus = (appointment: Appointment) => {
  const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
  const currentDateTime = new Date();
  return currentDateTime > appointmentDateTime ? 'completed' : appointment.status;
};
// Render user details view
const renderUserDetails = () => {
if (!selectedUser) return null;
return (
  <div className="bg-white rounded-xl shadow-sm p-6">
	<button
	  onClick={handleBackToList}
	  className="mb-4 flex items-center text-[#1669AE] hover:text-[#135a94]"
	>
	  <ChevronDown className="transform rotate-90 mr-1" size={16} />
	  Back to Users
	</button>
	<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
	  {/* Basic Info */}
	  <div className="bg-gray-50 p-4 rounded-lg">
		<h3 className="font-semibold mb-3 text-lg">Basic Information</h3>
		<div className="space-y-2">
		  <p><span className="font-medium">Name:</span> {selectedUser.name}</p>
		  <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
		  <p><span className="font-medium">Role:</span> {selectedUser.role}</p>
		  <p><span className="font-medium">Join Date:</span> {selectedUser.joinDate}</p>          <p><span className="font-medium">Status:</span>
            <span className={cn(
              "ml-2 px-2 py-1 rounded-full text-xs",
              (() => {
                if (selectedUser.status === 'approved') return "bg-green-100 text-green-800";
                if (selectedUser.status === 'pending') return "bg-yellow-100 text-yellow-800";
                if (selectedUser.status === 'suspended' || selectedUser.status === 'rejected') return "bg-red-100 text-red-800";
                return "bg-gray-100 text-gray-800";
              })()
            )}>
              {selectedUser.status ? selectedUser.status.charAt(0).toUpperCase() +
                selectedUser.status.slice(1) : 'Approved'}
            </span>
          </p>
		  <p><span className="font-medium">Age:</span> {selectedUser.age || 'N/A'}</p>
		  <p><span className="font-medium">Gender:</span> {selectedUser.gender || 'N/A'}</p>
		  <p><span className="font-medium">Phone:</span> {selectedUser.phone || 'N/A'}</p>
		</div>
	  </div>
	  {/* Location Info */}
	  <div className="bg-gray-50 p-4 rounded-lg">
		<h3 className="font-semibold mb-3 text-lg">Location Information</h3>
		<div className="space-y-2">
		  <p><span className="font-medium">State:</span> {selectedUser.state || 'N/A'}</p>
		  <p><span className="font-medium">City:</span> {selectedUser.city || 'N/A'}</p>
		  <p><span className="font-medium">Area/Locality:</span> {selectedUser.area || selectedUser.address?.area || selectedUser.locality || selectedUser.address?.locality || 'N/A'}</p>
		  <p><span className="font-medium">Pincode:</span> {selectedUser.pincode || 'N/A'}</p>
		</div>
	  </div>
	  {/* Medical Info */}
	  <div className="bg-gray-50 p-4 rounded-lg">
		<h3 className="font-semibold mb-3 text-lg">Medical Information</h3>
		<div className="space-y-2">
		  <p><span className="font-medium">Category:</span> {selectedUser.category || 'N/A'}</p>		  <p><span className="font-medium">Disability:</span>
			{(() => {
			  if (!selectedUser.disabilityType) return 'N/A';
			  const otherInfo = selectedUser.disabilityOther ? ` (${selectedUser.disabilityOther})` : '';
			  return selectedUser.disabilityType + otherInfo;
			})()}
		  </p>
		  <p><span className="font-medium">Medical Conditions:</span>
			{selectedUser.medicalConditions && selectedUser.medicalConditions.length > 0
			  ? selectedUser.medicalConditions.join(', ')
			  : 'N/A'}
			{selectedUser.medicalOther && ` (${selectedUser.medicalOther})`}
		  </p>
		  <p><span className="font-medium">Medications:</span> {selectedUser.medications || 'N/A'}</p>
		  <p><span className="font-medium">Allergies:</span> {selectedUser.allergies || 'N/A'}</p>
		  <p><span className="font-medium">Dental History:</span>
			{selectedUser.dentalHistory || 'N/A'}</p>
		  <p><span className="font-medium">Behavioral Challenges:</span>
			{selectedUser.behavioralChallenges || 'N/A'}</p>
		  <p><span className="font-medium">Preferred Mode of Care:</span>
			{selectedUser.modeOfCare || 'N/A'}</p>
		</div>
	  </div>
	  {/* Doctor Specific Info */}
	  {selectedUser.role === 'doctor' && (
		<div className="bg-gray-50 p-4 rounded-lg">
		  <h3 className="font-semibold mb-3 text-lg">Professional Information</h3>
		  <div className="space-y-2">
			<p><span className="font-medium">License Number:</span>
			  {selectedUser.licenseNumber || 'N/A'}</p>
			<p><span className="font-medium">Specialization:</span>
			  {selectedUser.specialization || 'N/A'}</p>
        {/* Clinic details (optional) - show sensible fallbacks for different stored keys */}
        <p><span className="font-medium">Clinic Name:</span> {selectedUser.clinicName || (selectedUser as any).clinic?.name || (selectedUser as any).clinicDetails?.name || (selectedUser as any).clinicAddress || 'N/A'}</p>
        <p><span className="font-medium">Clinic Area:</span> {selectedUser.clinicArea || (selectedUser as any).clinic?.area || (selectedUser as any).clinicDetails?.area || selectedUser.area || selectedUser.locality || 'N/A'}</p>
        <p><span className="font-medium">Clinic Location / Address:</span> {selectedUser.clinicLocation || (selectedUser as any).clinic?.location || (selectedUser as any).clinicAddress || (selectedUser as any).clinicDetails?.address || (selectedUser as any).address?.full || 'N/A'}</p>
		  </div>
		</div>
	  )}
	</div>

	{/* Doctor Approval Actions */}
	{selectedUser.role === 'doctor' && selectedUser.status === 'pending' && (
	  <div className="bg-white border border-gray-200 rounded-lg p-6">
		<h3 className="font-semibold mb-4 text-lg">Doctor Verification Actions</h3>
		<div className="flex gap-4">
		  <button
			onClick={() => handleApproveDoctor(selectedUser.id)}
			className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
		  >
			<CheckCircle size={16} />
			Approve Doctor
		  </button>
		  <button
			onClick={() => handleRejectDoctor(selectedUser.id)}
			className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
		  >
			<XCircle size={16} />
			Reject Doctor
		  </button>
		</div>
	  </div>
	)}
  </div>
);
};
// Render content only if authenticated and correct role
if (!isAuthenticated || userRole !== 'admin') {
return (
<div className="min-h-screen flex items-center justify-center text-gray-500">
Access Denied. Please log in as admin.
</div>
);
}
// Render reports (preserve existing UserReportsManager logic)
const renderReports = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Admin Portal - Reports Management</h2>
        <p className="text-gray-500">View and download all user uploaded reports</p>
      </div>
      <UserReportsManager />
    </div>
  );
};
return (
<div className="min-h-screen flex flex-col">
<main className="flex-grow pt-20 bg-gray-50">
  <div className="container mx-auto px-4 py-8">
	<div className="flex flex-col lg:flex-row gap-8">
	  {/* Sidebar */}
	  <div className="lg:w-64 bg-white rounded-xl shadow-sm p-4">
		<nav className="space-y-1">
		  {tabs.map((tab) => (
			<button
			  key={tab.id}
			  className={cn(
				"w-full flex items-center px-4 py-3 rounded-lg transition-colors",
				activeTab === tab.id
				  ? "bg-[#1669AE] bg-opacity-10 text-[#1669AE]"
				  : "text-gray-700 hover:bg-gray-100"
			  )}
			  onClick={() => {
				setActiveTab(tab.id as typeof activeTab);
				setViewMode('list');
				setSelectedUser(null);
			  }}
			>
			  {tab.icon}
			  <span>{tab.name}</span>
			</button>
		  ))}
		</nav>
	  </div>
	  {/* Main Content */}
	  <div className="flex-1 space-y-8">
		{viewMode === 'details' ? (
		  renderUserDetails()
		) : (
		  <>
			{activeTab === 'dashboard' && (
			  <>
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">				  {stats.map((stat) => (
					<div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
					  <p className="text-gray-500 text-sm">{stat.title}</p>
					  <div className="flex items-end justify-between mt-2">
						<p className="text-2xl font-bold text-gray-900">{stat.value}</p>
						<span className={cn(
						  "text-sm",
						  stat.changeType === 'positive' ? "text-green-600" : "text-red-600"
						)}>
						  {stat.change}
						</span>
					  </div>
					</div>
				  ))}
				</div>
				{/* Recent Users */}
				<div className="bg-white rounded-xl shadow-sm p-6">
				  <div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-semibold">Recent Users</h2>
					<div className="flex items-center gap-2">
					  <div className="relative">
						<Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
						<input
						  type="text"
						  className="pl-8 pr-3 py-2 border rounded-md text-sm"
						  placeholder="Search users..."
						  value={searchTerm}
						  onChange={(e) => setSearchTerm(e.target.value)}
						/>
					  </div>
					  <button
						className="text-[#1669AE] hover:text-[#135a94] text-sm font-medium"
						onClick={() => setActiveTab('users')}
					  >
						View All
					  </button>
					</div>
				  </div>
				  <div className="overflow-x-auto">
					<table className="w-full text-sm">
					  <thead>
						<tr className="bg-gray-50">
						  <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
						  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
						  <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
						  <th className="px-4 py-3 text-left font-medium text-gray-700">Join Date</th>
						  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
						</tr>
					  </thead>
					  <tbody>
						{filteredUsers.slice(0, 5).map((user) => (
						  <tr key={user.id} className="border-b">
							<td className="px-4 py-4">{user.name}</td>
							<td className="px-4 py-4">{user.email}</td>
							<td className="px-4 py-4">
							  <span className={cn(
								"px-2 py-1 rounded-full text-xs",
								(() => {
								  if (user.role === 'doctor') return "bg-[#1669AE] bg-opacity-10 text-[#1669AE]";
								  if (user.role === 'admin') return "bg-purple-100 text-purple-800";
								  return "bg-gray-100 text-gray-800";
								})()
							  )}>
								{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
							  </span>
							</td>							<td className="px-4 py-4">{user.joinDate}</td>
							<td className="px-4 py-4">
							  <span className={cn(
								"px-2 py-1 rounded-full text-xs",
								(() => {
								  if (user.status === 'approved') return "bg-green-100 text-green-800";
								  if (user.status === 'pending') return "bg-yellow-100 text-yellow-800";
								  if (user.status === 'suspended' || user.status === 'rejected') return "bg-red-100 text-red-800";
								  return "bg-gray-100 text-gray-800";
								})()
							  )}>
								{user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Approved'}
							  </span>
							</td>
						  </tr>
						))}
						{filteredUsers.length === 0 && (
						  <tr>
							<td colSpan={5} className="text-center py-6 text-gray-500">
							  No users found.
							</td>
						  </tr>
						)}
					  </tbody>
					</table>
				  </div>
				</div>
			  </>
			)}
{activeTab === 'users' && (
<div className="bg-white rounded-xl shadow-sm p-6">
<div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold">User Management</h2>
<div className="flex items-center gap-2">
<div className="relative">
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2
text-gray-400" size={18} />
<input
type="text"
placeholder="Search users...
"
className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none
focus:ring-2 focus:ring-[#1669AE] focus:border-transparent"
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
/>
</div>
<button
className="ml-2 text-xs px-3 py-1 rounded bg-[#1669AE] bg-opacity-10
text-[#1669AE]"
onClick={() => requestSort('name')}
>
Sort by Name {getSortIndicator('name')}
</button>
<button
className="ml-2 text-xs px-3 py-1 rounded bg-[#1669AE] bg-opacity-10
text-[#1669AE]"
onClick={() => requestSort('email')}
>
Sort by Email {getSortIndicator('email')}
</button>
<button
className="ml-2 text-xs px-3 py-1 rounded bg-[#1669AE] bg-opacity-10
text-[#1669AE]"
onClick={() => requestSort('role')}
>
Sort by Role {getSortIndicator('role')}
</button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-gray-50">
<th
className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
onClick={() => requestSort('name')}
>
<div className="flex items-center">
Name
{getSortIndicator('name')}
</div>
</th>
<th
className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
onClick={() => requestSort('email')}
>
<div className="flex items-center">
Email
{getSortIndicator('email')}
</div>
</th>
<th
className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
onClick={() => requestSort('role')}
>
<div className="flex items-center">
Role
{getSortIndicator('role')}
</div>
</th>
<th
className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
onClick={() => requestSort('joinDate')}
>
<div className="flex items-center">
Join Date
{getSortIndicator('joinDate')}
</div>
</th>
<th
className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
onClick={() => requestSort('status')}
>
<div className="flex items-center">
Status
{getSortIndicator('status')}
</div>
</th>
</tr>
</thead>
<tbody>
{loading ? (
<tr>
<th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
<td colSpan={6} className="text-center py-8 text-gray-500">Loading
users...
</td>
</tr>
) : filteredUsers.length === 0 ? (
<tr>
<td colSpan={6} className="text-center py-8 text-gray-500">No users
found matching your search.
</td>
</tr>
) : (
filteredUsers.map((user) => (
<tr key={user.id} className="border-b hover:bg-gray-50">
<td className="px-4 py-4">{user.name}</td>
<td className="px-4 py-4">{user.email}</td>				<td className="px-4 py-4">
				<span className={cn(
				"px-2 py-1 rounded-full text-xs",
				(() => {
				  if (user.role === 'doctor') return "bg-[#1669AE] bg-opacity-10 text-[#1669AE]";
				  if (user.role === 'admin') return "bg-purple-100 text-purple-800";
				  return "bg-gray-100 text-gray-800";
				})()
				)}>
				{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
				</span>
				</td>
				<td className="px-4 py-4">{user.joinDate}</td>
				<td className="px-4 py-4">
				<span className={cn(
				  "px-2 py-1 rounded-full text-xs",
				  (() => {
					if (user.status === 'approved') return "bg-green-100 text-green-800";
					if (user.status === 'pending') return "bg-yellow-100 text-yellow-800";
					if (user.status === 'suspended' || user.status === 'rejected') return "bg-red-100 text-red-800";
					return "bg-gray-100 text-gray-800";
				  })()
				)}>
				  {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Approved'}
				</span>
				</td>
<td className="px-4 py-4 flex items-center gap-2">
<button
onClick={() => handleViewUserDetails(user)}
className="text-[#1669AE] hover:text-[#135a94] text-sm font-medium"
>
View
</button>
{user.status === 'approved' ? (
<button
onClick={() => updateUserStatus(user.id,
'suspended')}
className="text-orange-600 hover:text-orange-800 text-sm font-medium"
>
Suspend
</button>
) : (
<button
onClick={() => updateUserStatus(user.id,
'approved')}
className="text-green-600 hover:text-green-800 text-sm
font-medium"
>
Approve
</button>
)}
<button
onClick={() => handleDeleteUser(user)}
className="text-red-600 hover:text-red-800 text-sm font-medium"
>
Delete
</button>
</td>
</tr>
))
)}
</tbody>
</table>
</div>
</div>
)}
{activeTab === 'doctors' && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-xl font-semibold mb-6">Doctors List</h2>
    {/* Location Filter UI */}
    <div className="flex gap-4 mb-4">
      <Select onValueChange={value => setDoctorCityFilter(value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          {[...new Set(users.filter(u => u.role === 'doctor' && u.city).map(u => u.city || 'unknown'))].map(city => (
            <SelectItem key={city} value={city}>{city === 'unknown' ? 'Unknown' : city}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={value => setDoctorLocalityFilter(value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by Locality" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Localities</SelectItem>
          {[...new Set(users.filter(u => u.role === 'doctor' && u.locality).map(u => u.locality || 'unknown'))].map(locality => (
            <SelectItem key={locality} value={locality}>{locality === 'unknown' ? 'Unknown' : locality}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Specialization</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">License</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.filter(user => user.role === 'doctor' &&
            (doctorCityFilter === 'all' || user.city === doctorCityFilter) &&
            (doctorLocalityFilter === 'all' || user.locality === doctorLocalityFilter)
          ).map(doctor => (
            <tr key={doctor.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-4">{doctor.name}</td>
              <td className="px-4 py-4">{doctor.email}</td>
              <td className="px-4 py-4">{doctor.specialization || 'General'}</td>
              <td className="px-4 py-4">{doctor.licenseNumber || 'N/A'}</td>
              <td className="px-4 py-4">
                <span className={(() => {
                  if (doctor.status === 'approved') return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs";
                  if (doctor.status === 'pending') return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs";
                  if (doctor.status === 'suspended' || doctor.status === 'rejected') return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs";
                  return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs";
                })()}>
                  {doctor.status ? doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1) : 'Approved'}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewUserDetails(doctor)}
                    className="text-[#1669AE] hover:text-[#135a94] text-sm font-medium"
                  >
                    View
                  </button>
                  {doctor.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveDoctor(doctor.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(doctor.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {doctor.status === 'approved' && (
                    <button
                      onClick={() => updateUserStatus(doctor.id, 'suspended')}
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    >
                      Suspend
                    </button>
                  )}
                  {(doctor.status === 'suspended' || doctor.status === 'rejected') && (
                    <button
                      onClick={() => updateUserStatus(doctor.id, 'approved')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(doctor)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
{activeTab === 'appointments' && (
<div className="bg-white rounded-xl shadow-sm p-6">
<div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold">Appointments</h2>
<div className="text-sm text-gray-500">
{appointments.length} total appointments
</div>
</div>
{appointments.length === 0 ? (
<div className="bg-gray-50 rounded-lg p-8 text-center">
<Clock className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="mt-2 text-sm font-medium text-gray-900">No appointments
found</h3>
<p className="mt-1 text-sm text-gray-500">When users book appointments,
they will appear here</p>
</div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-gray-50">
<th className="px-4 py-3 text-left font-medium text-gray-700">Patient</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Doctor</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Type of Consultation</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
</tr>
</thead>
<tbody>
{appointments.map(appointment => {
            const isUnassigned = !appointment.doctorId || appointment.doctorName === 'N/A';
            const updatedStatus = checkAppointmentStatus(appointment);
            return (
              <tr key={appointment.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="font-medium">{appointment.userName}</div>
                  <div className="text-xs text-gray-500">{appointment.userEmail}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium">{appointment.doctorName}</div>
                  <div className="text-xs text-gray-500">{appointment.specialization}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium capitalize">
                    {appointment.consultationType ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.consultationType === 'virtual' ? 'bg-blue-100 text-blue-800' :
                        appointment.consultationType === 'home' ? 'bg-green-100 text-green-800' :
                        appointment.consultationType === 'clinic' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.consultationType === 'virtual' ? 'Virtual' :
                         appointment.consultationType === 'home' ? 'Home Visit' :
                         appointment.consultationType === 'clinic' ? 'Clinic Visit' :
                         appointment.consultationType}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        Clinic Visit
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">{appointment.date}</td>
                <td className="px-4 py-4">{appointment.time}</td>
                <td className="px-4 py-4">
                  <span className={(() => {
                    if (updatedStatus === 'completed') return 'bg-blue-100 text-blue-800';
                    if (updatedStatus === 'confirmed') return 'bg-green-100 text-green-800';
                    if (updatedStatus === 'cancelled') return 'bg-red-100 text-red-800';
                    return 'bg-yellow-100 text-yellow-800';
                  })()}>
                    {updatedStatus}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    {/* Smart Assign Button & Popup - Hide for completed and cancelled appointments */}
                    {(isUnassigned || appointment.status === 'pending') && 
                     updatedStatus !== 'completed' && 
                     updatedStatus !== 'cancelled' && 
                     appointment.status !== 'cancelled' ? (
                      assigningAppointmentId === appointment.id ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                          <div className="bg-white rounded-lg shadow-lg p-6 relative min-w-[400px] max-w-[600px]">
                            <button
                              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                              onClick={() => {
                                setAssigningAppointmentId(null);
                                setSelectedAssignDoctorId(null);
                                setAvailableDoctorsForAppointment([]);
                              }}
                              aria-label="Close"
                            >
                              ×
                            </button>
                            
                            <h3 className="text-lg font-bold mb-4 text-[#2563eb]">Smart Doctor Assignment</h3>
                            
                            {/* Patient Location Info */}
                            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-2">Patient Location</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">State:</span>
                                  <span className="ml-2 font-medium">
                                    {(() => {
                                      const user = users.find(u => u.id === appointment.userId);
                                      return user?.state || appointment.state || appointment.userAddress?.state || 'Not specified';
                                    })()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">City:</span>
                                  <span className="ml-2 font-medium">
                                    {(() => {
                                      const user = users.find(u => u.id === appointment.userId);
                                      return user?.city || appointment.city || appointment.userAddress?.city || 'Not specified';
                                    })()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Area/Locality:</span>
                                  <span className="ml-2 font-medium">
                                    {(() => {
                                      const user = users.find(u => u.id === appointment.userId);
                                      return user?.area || user?.locality || user?.address?.area || user?.address?.locality || 
                                             appointment.area || appointment.locality || appointment.userAddress?.area || 'Not specified';
                                    })()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Pincode:</span>
                                  <span className="ml-2 font-medium">
                                    {(() => {
                                      const user = users.find(u => u.id === appointment.userId);
                                      return user?.pincode || appointment.pincode || appointment.userAddress?.pincode || 'Not specified';
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Appointment Info */}
                            <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{(appointment as any).consultationType?.toUpperCase() || 'CLINIC'}</span> visit at {appointment.time}
                              </div>
                            </div>

                            {/* Availability Check Button */}
                            <div className="mb-4">
                              <button
                                className={`w-full py-2 px-4 rounded-lg ${
                                  checkingAvailability 
                                    ? 'bg-purple-100 text-purple-800 cursor-not-allowed' 
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                                disabled={checkingAvailability}
                                onClick={() => checkAvailableDoctorsForAppointment(appointment)}
                              >
                                {checkingAvailability ? 'Checking Available Doctors...' : 'Check Available Doctors'}
                              </button>
                            </div>
                            
                            {/* Available Doctors List */}
                            {availableDoctorsForAppointment.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2">Available Doctors</h4>
                                <div className="max-h-60 overflow-y-auto">
                                  {availableDoctorsForAppointment.map(doctor => (
                                    <div 
                                      key={doctor.doctorId}
                                      className={`p-3 mb-2 rounded-lg border cursor-pointer transition-colors ${
                                        selectedAssignDoctorId === doctor.doctorId
                                          ? 'border-blue-500 bg-blue-50'
                                          : 'border-gray-200 hover:border-blue-300'
                                      }`}
                                      onClick={() => setSelectedAssignDoctorId(doctor.doctorId)}
                                    >
                                      <div className="font-medium text-gray-800">Dr. {doctor.doctorName}</div>
                                      <div className="text-sm text-gray-600">{doctor.specialization}</div>
                                      {/* Clinic Info: show clinic name and clinic area if available */}
                                      <div className="text-sm text-gray-500 mt-1">
                                        <div>
                                          <span className="font-medium">🏥 Clinic:</span>
                                          <span className="ml-1">{(() => {
                                            const doctorUser = users.find(u => u.id === doctor.doctorId);
                                            return doctorUser?.clinicName || doctor.clinicName || (doctorUser as any)?.clinicDetails?.name || doctorUser?.clinicAddress || 'Not specified';
                                          })()}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">📌 Clinic Area:</span>
                                          <span className="ml-1">{(() => {
                                            const doctorUser = users.find(u => u.id === doctor.doctorId);
                                            return doctorUser?.clinicArea || doctor.clinicArea || (doctorUser as any)?.clinicDetails?.area || doctorUser?.area || doctor.area || 'Not specified';
                                          })()}</span>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-2 space-y-1.5">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="font-medium">🏛️ State:</span>
                                            <span className="ml-1">
                                              {(() => {
                                                const doctorUser = users.find(u => u.id === doctor.doctorId);
                                                return doctorUser?.state || doctor.state || doctor.address?.state || '-';
                                              })()}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="font-medium">🏢 City:</span>
                                            <span className="ml-1">
                                              {(() => {
                                                const doctorUser = users.find(u => u.id === doctor.doctorId);
                                                return doctorUser?.city || doctor.city || doctor.address?.city || '-';
                                              })()}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="font-medium">📍 Area/Locality:</span>
                                            <span className="ml-1">
                                              {(() => {
                                                const doctorUser = users.find(u => u.id === doctor.doctorId);
                                                return doctorUser?.area || doctorUser?.locality || doctorUser?.address?.area || doctorUser?.address?.locality ||
                                                       doctor.area || doctor.locality || doctor.address?.area || doctor.address?.locality || '-';
                                              })()}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="font-medium">📮 Pincode:</span>
                                            <span className="ml-1">
                                              {(() => {
                                                const doctorUser = users.find(u => u.id === doctor.doctorId);
                                                return doctorUser?.pincode || doctor.pincode || doctor.address?.pincode || '-';
                                              })()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Status Messages */}
                            {availableDoctorsForAppointment.length > 0 ? (
                              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4">
                                ✅ {availableDoctorsForAppointment.length} doctors available for this time slot
                              </div>
                            ) : assigningAppointmentId === appointment.id && !checkingAvailability ? (
                              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg mb-4">
                                ⚠️ No doctors available for this time slot. Try a different time or check for conflicts.
                              </div>
                            ) : null}
                            
                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                              <button
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                onClick={() => {
                                  setAssigningAppointmentId(null);
                                  setSelectedAssignDoctorId(null);
                                  setAvailableDoctorsForAppointment([]);
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                className={`px-4 py-2 rounded-lg ${
                                  selectedAssignDoctorId
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                                disabled={!selectedAssignDoctorId}
                                onClick={() => selectedAssignDoctorId && handleAssignDoctor(appointment.id, selectedAssignDoctorId)}
                              >
                                Assign Selected Doctor
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            setAssigningAppointmentId(appointment.id);
                            setAvailableDoctorsForAppointment([]);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Smart Assign
                        </button>
                      )
                    ) : null}
                    
                    {/* Existing actions (Confirm/Cancel/Complete) */}
                    <div className="flex items-center gap-2">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            className="text-green-600 hover:underline text-sm"
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            className="text-red-600 hover:underline text-sm"
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          className="text-blue-600 hover:underline text-sm"
                          onClick={() => setCompleteConfirm({ show: true, appointmentId: appointment.id })}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
)}</div>
)}

{activeTab === 'orders' && (
<div className="bg-white rounded-xl shadow-sm p-6">
<div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold">Product Orders</h2>
<div className="text-sm text-gray-500">
{orders.length} total orders
</div>
</div>
{orders.length === 0 ? (
<div className="bg-gray-50 rounded-lg p-8 text-center">
<Package className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
<p className="mt-1 text-sm text-gray-500">When users place orders, they will appear here</p>
</div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-gray-50">
<th className="px-4 py-3 text-left font-medium text-gray-700">Order ID</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Items</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Total Amount</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Payment Method</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Order Date</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
</tr>
</thead>
<tbody>
{orders.map(order => (
<tr key={order.id} className="border-b hover:bg-gray-50">
<td className="px-4 py-4">
<div className="font-medium">{order.id}</div>
</td>
<td className="px-4 py-4">
<div className="font-medium">{order.userName || "Unknown User"}</div>
<div className="text-xs text-gray-500">{order.customerDetails.firstName} {order.customerDetails.lastName}</div>
<div className="text-xs text-gray-500">{order.customerDetails.email}</div>
<div className="text-xs text-gray-500">{order.customerDetails.phone}</div>
</td>
<td className="px-4 py-4">
<div className="space-y-1">
{order.items.slice(0, 2).map((item, index) => (
<div key={index} className="text-xs">
{item.name} (x{item.quantity})
</div>
))}
{order.items.length > 2 && (
<div className="text-xs text-gray-500">
+{order.items.length - 2} more items
</div>
)}
</div>
</td>
<td className="px-4 py-4">
<div className="font-medium">₹{order.totalAmount}</div>
</td>
<td className="px-4 py-4">
<div className="capitalize">
{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
</div>
</td>
<td className="px-4 py-4">
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
order.status === 'delivered' ? 'bg-green-100 text-green-800' :
order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
order.status === 'dispatched' ? 'bg-purple-100 text-purple-800' :
order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
'bg-yellow-100 text-yellow-800'
}`}>
{order.status}
</span>
</td>
<td className="px-4 py-4">
{new Date(order.orderDate).toLocaleDateString()}
</td>
<td className="px-4 py-4">
<div className="flex flex-col gap-1">
{order.status === 'pending' && (
<>
<button
className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
onClick={() => updateOrderStatus(order.id, 'confirmed')}
>
Confirm
</button>
<button
className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
onClick={() => updateOrderStatus(order.id, 'cancelled')}
>
Cancel
</button>
</>
)}
{order.status === 'confirmed' && (
<button
className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
onClick={() => updateOrderStatus(order.id, 'dispatched')}
>
Dispatch
</button>
)}
{order.status === 'dispatched' && (
<button
className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
onClick={() => updateOrderStatus(order.id, 'delivered')}
>
Mark Delivered
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

{activeTab === 'organizations' && (
<div className="bg-white rounded-xl shadow-sm p-6">
<div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold">Organization Bookings</h2>
<div className="text-sm text-gray-500">
{organizationBookings.length} total requests
</div>
</div>
{organizationBookings.length === 0 ? (
<div className="bg-gray-50 rounded-lg p-8 text-center">
<Building className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="mt-2 text-sm font-medium text-gray-900">No organization bookings found</h3>
<p className="mt-1 text-sm text-gray-500">When organizations request group appointments, they will appear here</p>
</div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-gray-50">
<th className="px-4 py-3 text-left font-medium text-gray-700">Organization</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Contact Person</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Contact Info</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Beneficiaries</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Preferred Date/Time</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Details</th>
</tr>
</thead>
<tbody>
{organizationBookings.map(booking => (
<tr key={booking.id} className="border-b hover:bg-gray-50">
<td className="px-4 py-4">
<div className="font-medium">{booking.organizationName}</div>
<div className="text-xs text-gray-500">{booking.organizationType}</div>
</td>
<td className="px-4 py-4">
<div className="font-medium">{booking.contactPersonName}</div>
<div className="text-xs text-gray-500">{booking.designation}</div>
</td>
<td className="px-4 py-4">
<div className="text-sm">{booking.contactPhone}</div>
<div className="text-xs text-gray-500">{booking.contactEmail}</div>
</td>
<td className="px-4 py-4">
<div className="text-sm">{booking.city}, {booking.state}</div>
</td>
<td className="px-4 py-4">
<div className="text-sm">{booking.numberOfBeneficiaries}</div>
</td>
<td className="px-4 py-4">
<div className="text-sm">{booking.preferredDate}</div>
<div className="text-xs text-gray-500">{booking.preferredTime}</div>
</td>
<td className="px-4 py-4">
<div className="flex flex-col">
<span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
booking.status === 'contacted' ? 'bg-green-100 text-green-800' :
booking.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
'bg-yellow-100 text-yellow-800'
}`}>
{booking.status}
</span>
{booking.autoCompletedAt && (
<div className="text-xs text-gray-500 mt-1">
Auto-completed ({booking.autoCompletedReason})
</div>
)}
</div>
</td>
<td className="px-4 py-4">
<div className="space-y-1">
<div className="text-xs text-gray-600">
<strong>Requirement:</strong> {booking.requirement}
</div>
{booking.additionalNotes && (
<div className="text-xs text-gray-600">
<strong>Notes:</strong> {booking.additionalNotes}
</div>
)}
<div className="text-xs text-gray-500">
Submitted: {new Date(booking.submittedAt).toLocaleDateString()}
</div>
{booking.scheduledDate && (
<div className="text-xs text-green-600">
<strong>Scheduled:</strong> {booking.scheduledDate} at {booking.scheduledTime}
</div>
)}
{booking.assignedDoctor && (
<div className="text-xs text-blue-600">
<strong>Doctor:</strong> {booking.assignedDoctor}
</div>
)}
{booking.adminNotes && (
<div className="text-xs text-gray-600">
<strong>Admin Notes:</strong> {booking.adminNotes}
</div>
)}
{booking.autoCompletedAt && (
<div className="text-xs text-orange-600 border-t pt-1 mt-1">
<strong>Auto-completed:</strong> {new Date(booking.autoCompletedAt).toLocaleString()}
<br />
<strong>Reason:</strong> {booking.autoCompletedReason}
{booking.autoCompletedDate && (
<span> (Date: {booking.autoCompletedDate})</span>
)}
</div>
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
{activeTab === 'verifications' && (
<div className="bg-white rounded-xl shadow-sm p-6">
<div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold">Doctor Verifications</h2>
<div className="text-sm text-gray-500">
{verificationRequests.length} pending requests
</div>
</div>
{verificationRequests.length === 0 ? (
<div className="bg-gray-50 rounded-lg p-8 text-center">
<FileText className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="mt-2 text-sm font-medium text-gray-900">No pending
verifications</h3>
<p className="mt-1 text-sm text-gray-500">All doctor verification requests
have been processed.
</p>
</div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="bg-gray-50">
<th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
<th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
<th className="px-4 py-3 text-left font-medium
text-gray-700">Specialization</th>
<th className="px-4 py-3 text-left font-medium
text-gray-700">License</th>
<th className="px-4 py-3 text-left font-medium
text-gray-700">Submitted</th>
<th className="px-4 py-3 text-left font-medium
text-gray-700">Actions</th>
</tr>
</thead>
<tbody>
{verificationRequests.map((request) => (
<tr key={request.id} className="border-b hover:bg-gray-50">
<td className="px-4 py-4">{request.name}</td>
<td className="px-4 py-4">{request.email}</td>
<td className="px-4 py-4">{request.specialization}</td>
<td className="px-4 py-4">{request.licenseNumber}</td>
<td className="px-4 py-4">{request.submittedDate}</td>
<td className="px-4 py-4 flex items-center gap-2">
<button
onClick={() => handleApproveDoctor(request.id)}
className="flex items-center text-green-600 hover:text-green-800
text-sm font-medium"
>
<Check className="mr-1" size={14} /> Approve
</button>
<button
onClick={() => handleRejectDoctor(request.id)}
className="flex items-center text-red-600 hover:text-red-800 text-sm
font-medium"
>
<X className="mr-1" size={14} /> Reject
</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</div>
)}
{activeTab === 'reports' && (
  renderReports()
)}
{activeTab === 'settings' && (
  <div className="bg-white rounded-xl shadow-sm p-6">
	<h2 className="text-xl font-semibold mb-4">Settings</h2>
	<p className="text-gray-500">Settings feature coming soon.</p>
  </div>
)}
		</>
	  )}
	</div>
  </div>
</div>
</main>
{/* Approve Confirmation Dialog */}
<AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
  <AlertDialogContent>
	<AlertDialogHeader>
	  <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
	  <AlertDialogDescription>
		Are you sure you want to approve this doctor? This action will grant them full access to
		the platform.
	  </AlertDialogDescription>
	</AlertDialogHeader>
	<AlertDialogFooter>
	  <AlertDialogCancel>Cancel</AlertDialogCancel>
	  <AlertDialogAction
		onClick={confirmApproveDoctor}
		className="bg-[#1669AE] hover:bg-[#135a94]"
	  >
		Approve
	  </AlertDialogAction>
	</AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
{/* Reject Confirmation Dialog */}
<AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
  <AlertDialogContent>
	<AlertDialogHeader>
	  <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
	  <AlertDialogDescription>
		Are you sure you want to reject this doctor's application? This action cannot be undone.
	  </AlertDialogDescription>
	</AlertDialogHeader>
	<AlertDialogFooter>
	  <AlertDialogCancel>Cancel</AlertDialogCancel>
	  <AlertDialogAction
		onClick={confirmRejectDoctor}
		className="bg-red-600 hover:bg-red-700"
	  >
		Reject
	  </AlertDialogAction>
	</AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
{/* Complete Appointment Confirmation Dialog */}
{completeConfirm?.show && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-lg p-6 relative min-w-[300px] max-w-[400px]">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        onClick={() => setCompleteConfirm(null)}
        aria-label="Close"
      >
        ×
      </button>
      <h3 className="text-lg font-bold mb-2 text-[#2563eb]">Mark Appointment Complete?</h3>
      <div className="mb-4">Are you sure you want to mark this appointment as <b>completed</b>? This action cannot be undone.</div>
      <div className="flex gap-2 justify-end">
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          onClick={() => setCompleteConfirm(null)}
        >
          No, Go Back
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => updateAppointmentStatus(completeConfirm.appointmentId, 'completed')}
        >
          Yes, Complete
        </button>
      </div>
    </div>
  </div>
)}

{/* Delete User Confirmation Dialog */}
{deleteConfirm?.show && (
  <AlertDialog open={deleteConfirm.show} onOpenChange={() => setDeleteConfirm(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-red-600">⚠️ Permanently Delete User Account</AlertDialogTitle>
        <AlertDialogDescription className="space-y-3">
          <div>
            <strong>You are about to permanently delete:</strong>
          </div>
          <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
            <div><strong>Name:</strong> {deleteConfirm.userName}</div>
            <div><strong>Email:</strong> {deleteConfirm.userEmail}</div>
          </div>
          <div className="text-red-700 font-medium">
            ⚠️ <strong>This action cannot be undone!</strong>
          </div>
          <div>
            This will permanently delete:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>User account and profile data</li>
              <li>All appointment history</li>
              <li>Doctor schedules (if applicable)</li>
              <li>All related medical records</li>
            </ul>
          </div>
          <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
            <div className="text-yellow-800 text-sm">
              <strong>⚠️ Important Note:</strong> This only deletes data from our database. 
              The Firebase Authentication record will remain, so the user cannot register again with the same email. 
              If they try to register, they should use the "Forgot Password" option instead.
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <strong>Alternative:</strong> Consider suspending the account instead, which can be reversed later.
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <AlertDialogCancel className="w-full sm:w-auto">
          Cancel - Keep Account
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={() => deleteUserPermanently(deleteConfirm.userId)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
        >
          🗑️ Yes, Delete Permanently
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
</div>
);
};
export default AdminPortal;