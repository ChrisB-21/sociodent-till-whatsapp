import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Phone, MapPin, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, update, get } from 'firebase/database';
import { db } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Define types for our data
interface UserData {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

interface Doctor {
  name: string;
  image: string;
  specialization: string;
}

interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctorId?: string; // Add doctorId to appointment interface
}

interface FirebaseAppointment {
  userId: string;
  patientId?: string; // Some appointments may use patientId instead
  userEmail?: string; // Some appointments may be identified by email
  doctorId?: string;
  doctorName?: string;
  doctorImage?: string;
  specialization?: string;
  consultationType?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const MyAppointments = () => {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '/doc-img/placeholder.svg', // Default avatar
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoctor, setViewDoctor] = useState<{ 
    name: string; 
    email?: string; 
    phone?: string; 
    specialization?: string; 
    image?: string;
    licenseNumber?: string;
    experience?: string;
    qualifications?: string;
    clinicAddress?: string;
    consultationFee?: string;
    availableHours?: string;
    languages?: string[];
    about?: string;
  } | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch user data and appointments from Firebase
  useEffect(() => {
    // Try multiple localStorage keys for user ID to handle inconsistency
    const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
    console.log('MyAppointments: Current userId from localStorage:', userId);
    console.log('MyAppointments: Available localStorage keys:', {
      userId: localStorage.getItem('userId'),
      uid: localStorage.getItem('uid'),
      userEmail: localStorage.getItem('userEmail'),
      userName: localStorage.getItem('userName'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
    
    if (!userId) {
      console.log('MyAppointments: No userId found, redirecting to login');
      navigate('/auth?mode=login');
      return;
    }

    // Fetch user data
    const userRef = ref(db, `users/${userId}`);
    const appointmentsRef = ref(db, 'appointments');
    const usersRef = ref(db, 'users');

    const unsubscribeUser = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserData({
          name: userData.fullName || 'User',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          avatar: userData.profileImage || '/doc-img/placeholder.svg',
        });
      } else {
        console.log('No user data available');
      }
    });

    // Fetch appointments for this user and always get latest doctor info
    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      console.log('MyAppointments: Fetching appointments for userId:', userId);
      
      if (snapshot.exists()) {
        const appointmentsData = snapshot.val();
        console.log('MyAppointments: Raw appointments data:', appointmentsData);
        
        // Fetch all doctors for lookup (fresh each time to ensure latest info)
        onValue(usersRef, (usersSnap) => {
          let doctorsCache: Record<string, any> = {};
          if (usersSnap.exists()) {
            const usersData = usersSnap.val();
            Object.entries(usersData).forEach(([id, user]: any) => {
              if (user.role === 'doctor') {
                doctorsCache[id] = user;
              }
            });
          }
          
          console.log('MyAppointments: Doctors cache:', doctorsCache);
          const userEmail = localStorage.getItem('userEmail');
          const userAppointments = Object.entries(appointmentsData)
            .filter(([_, appointment]) => {
              const appt = appointment as FirebaseAppointment;
              // Enhanced filtering logic to check multiple fields for appointment matching
              const isUserAppointment = appt.userId === userId || 
                                      (appt as any).patientId === userId ||
                                      (appt as any).userEmail === userEmail;
              console.log(`MyAppointments: Checking appointment ${_}, userId: ${appt.userId}, patientId: ${(appt as any).patientId}, userEmail: ${(appt as any).userEmail}, matches current user: ${isUserAppointment}`);
              return isUserAppointment;
            })
            .map(([id, appointment]) => {
              const appt = appointment as FirebaseAppointment;
              let doctorInfo = {
                name: appt.doctorName || 'Pending Assignment',
                image: appt.doctorImage || '/doc-img/placeholder.svg',
                specialization: appt.specialization || appt.consultationType || 'Dental Consultation',
              };
              // If doctorId is present, try to get latest info from users table
              if (appt.doctorId && doctorsCache[appt.doctorId]) {
                const doc = doctorsCache[appt.doctorId];
                doctorInfo = {
                  name: doc.name || doctorInfo.name,
                  image: doc.profileImage || doctorInfo.image,
                  specialization: doc.specialization || doctorInfo.specialization,
                };
              }
              return {
                id,
                doctor: doctorInfo,
                date: appt.date || 'To be confirmed',
                time: appt.time || 'To be confirmed',
                type: appt.consultationType || 'General',
                status: appt.status || 'pending',
                doctorId: appt.doctorId, // Include doctorId in appointment
              };
            });
          
          console.log('MyAppointments: Filtered user appointments:', userAppointments);
          setAppointments(userAppointments);
          setLoading(false);
        }, { onlyOnce: true });
      } else {
        console.log('MyAppointments: No appointments data exists in database');
        setAppointments([]);
        setLoading(false);
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeUser();
      unsubscribeAppointments();
    };
  }, [navigate]);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleReschedule = (appointmentId: string) => {
    // Navigate to the consultation page with appointment ID for rescheduling
    navigate(`/consultation?reschedule=${appointmentId}`);
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      // Update appointment status in Firebase
      const appointmentRef = ref(db, `appointments/${appointmentId}`);
      await update(appointmentRef, {
        status: 'cancelled',
        updatedAt: Date.now()
      });
      
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully"
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBookNewAppointment = () => {
    navigate('/consultation');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Banner */}
      <div className="bg-sociodent-600 text-white">
        <div className="container-custom py-8">
          <div className="flex items-center gap-4">
            <img
              src={userData.avatar}
              alt={userData.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>
              <p className="text-sociodent-100">Manage your appointments and orders</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="container-custom py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sociodent-600"></div>
        </div>
      ) : (
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-gray-900">{userData.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-gray-900">{userData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-gray-900">{userData.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">{userData.address}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleEditProfile}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-sociodent-100 text-sociodent-600 rounded-lg hover:bg-sociodent-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Appointments Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Your Dental Appointments</h2>
                  <button
                    onClick={handleBookNewAppointment}
                    className="button-primary py-2"
                  >
                    Book New Appointment
                  </button>
                </div>

                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={appointment.doctor.image}
                            alt={appointment.doctor.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-semibold">{appointment.doctor.name}</h3>
                            <p className="text-gray-500">{appointment.doctor.specialization}</p>
                            <p className="text-sm text-gray-600">{appointment.type}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{appointment.date}</span>
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                appointment.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                              <>
                                <button
                                  onClick={() => handleReschedule(appointment.id)}
                                  className="text-sociodent-600 hover:text-sociodent-700 text-sm"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancel(appointment.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={async () => {
                                // Check if appointment has a doctorId
                                if (appointment.doctorId) {
                                  console.log('Fetching doctor details for ID:', appointment.doctorId);
                                  
                                  const doctorRef = ref(db, `users/${appointment.doctorId}`);
                                  onValue(doctorRef, (doctorSnap) => {
                                    if (doctorSnap.exists()) {
                                      const doctorData = doctorSnap.val();
                                      console.log('Doctor data found:', doctorData);
                                      
                                      setViewDoctor({
                                        name: doctorData.fullName || doctorData.name || '',
                                        email: doctorData.email || '',
                                        phone: doctorData.phone || doctorData.phoneNumber || '',
                                        specialization: doctorData.specialization || '',
                                        image: doctorData.profileImage || doctorData.profilePhotoUrl || '/doc-img/placeholder.svg',
                                        licenseNumber: doctorData.licenseNumber || '',
                                        experience: doctorData.experience || '',
                                        qualifications: doctorData.qualifications || doctorData.degree || '',
                                        clinicAddress: doctorData.clinicAddress || doctorData.address || '',
                                        consultationFee: doctorData.consultationFee || '',
                                        availableHours: doctorData.availableHours || '',
                                        languages: doctorData.languages || [],
                                        about: doctorData.about || doctorData.bio || ''
                                      });
                                    } else {
                                      console.log('Doctor not found for ID:', appointment.doctorId);
                                      // Fallback: show basic info from appointment
                                      setViewDoctor({
                                        name: appointment.doctor.name,
                                        email: 'Not available',
                                        phone: 'Not available',
                                        specialization: appointment.doctor.specialization,
                                        image: appointment.doctor.image,
                                        licenseNumber: '',
                                        experience: '',
                                        qualifications: '',
                                        clinicAddress: '',
                                        consultationFee: '',
                                        availableHours: '',
                                        languages: [],
                                        about: ''
                                      });
                                    }
                                  }, { onlyOnce: true });
                                } else if (appointment.doctor.name !== 'Pending Assignment') {
                                  // Fallback: search by name if no doctorId
                                  const usersRef = ref(db, 'users');
                                  onValue(usersRef, (usersSnap) => {
                                    if (usersSnap.exists()) {
                                      const usersData = usersSnap.val();
                                      const doctor = Object.values(usersData).find((u: any) => 
                                        (u.fullName === appointment.doctor.name || u.name === appointment.doctor.name) && u.role === 'doctor'
                                      );
                                      if (doctor && typeof doctor === 'object') {
                                        const doctorData = doctor as any;
                                        setViewDoctor({
                                          name: doctorData.fullName || doctorData.name || '',
                                          email: doctorData.email || '',
                                          phone: doctorData.phone || doctorData.phoneNumber || '',
                                          specialization: doctorData.specialization || '',
                                          image: doctorData.profileImage || doctorData.profilePhotoUrl || '/doc-img/placeholder.svg',
                                          licenseNumber: doctorData.licenseNumber || '',
                                          experience: doctorData.experience || '',
                                          qualifications: doctorData.qualifications || doctorData.degree || '',
                                          clinicAddress: doctorData.clinicAddress || doctorData.address || '',
                                          consultationFee: doctorData.consultationFee || '',
                                          availableHours: doctorData.availableHours || '',
                                          languages: doctorData.languages || [],
                                          about: doctorData.about || doctorData.bio || ''
                                        });
                                      } else {
                                        console.log('Doctor not found by name:', appointment.doctor.name);
                                        // Show basic info from appointment
                                        setViewDoctor({
                                          name: appointment.doctor.name,
                                          email: 'Not available',
                                          phone: 'Not available',
                                          specialization: appointment.doctor.specialization,
                                          image: appointment.doctor.image,
                                          licenseNumber: '',
                                          experience: '',
                                          qualifications: '',
                                          clinicAddress: '',
                                          consultationFee: '',
                                          availableHours: '',
                                          languages: [],
                                          about: ''
                                        });
                                      }
                                    }
                                  }, { onlyOnce: true });
                                }
                              }}
                              className="text-sociodent-600 hover:text-sociodent-700 text-sm ml-2 disabled:text-gray-400"
                              disabled={appointment.doctor.name === 'Pending Assignment'}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No appointments scheduled. Book your first appointment now!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Doctor Info Modal */}
      {viewDoctor && (
        <Dialog open={!!viewDoctor} onOpenChange={() => setViewDoctor(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">Doctor Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Doctor Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <img 
                  src={viewDoctor.image || '/doc-img/placeholder.svg'} 
                  alt={viewDoctor.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Dr. {viewDoctor.name}</h2>
                  <p className="text-lg text-blue-600 font-medium">{viewDoctor.specialization || 'General Dentist'}</p>
                  {viewDoctor.licenseNumber && (
                    <p className="text-sm text-gray-500">License: {viewDoctor.licenseNumber}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Email:</strong> {viewDoctor.email || 'Not available'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {viewDoctor.phone || 'Not available'}
                    </span>
                  </div>
                  {viewDoctor.clinicAddress && (
                    <div className="flex items-start space-x-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">
                        <strong>Clinic Address:</strong> {viewDoctor.clinicAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Professional Details
                </h3>
                <div className="space-y-2">
                  {viewDoctor.experience && (
                    <div className="text-sm">
                      <strong>Experience:</strong> {viewDoctor.experience}
                    </div>
                  )}
                  {viewDoctor.qualifications && (
                    <div className="text-sm">
                      <strong>Qualifications:</strong> {viewDoctor.qualifications}
                    </div>
                  )}
                  {viewDoctor.consultationFee && (
                    <div className="text-sm">
                      <strong>Consultation Fee:</strong> ₹{viewDoctor.consultationFee}
                    </div>
                  )}
                  {viewDoctor.availableHours && (
                    <div className="text-sm">
                      <strong>Available Hours:</strong> {viewDoctor.availableHours}
                    </div>
                  )}
                  {viewDoctor.languages && viewDoctor.languages.length > 0 && (
                    <div className="text-sm">
                      <strong>Languages:</strong> {viewDoctor.languages.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* About Section */}
              {viewDoctor.about && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">About Dr. {viewDoctor.name}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{viewDoctor.about}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-4 border-t">
                {viewDoctor.phone && viewDoctor.phone !== 'Not available' ? (
                  <button
                    onClick={() => window.open(`tel:${viewDoctor.phone}`)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Doctor</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Phone Not Available</span>
                  </button>
                )}
                {viewDoctor.email && viewDoctor.email !== 'Not available' ? (
                  <button
                    onClick={() => window.open(`mailto:${viewDoctor.email}`)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Email</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Not Available</span>
                  </button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MyAppointments;