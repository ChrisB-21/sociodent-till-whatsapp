import React, { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "@/firebase";
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { ref, onValue, update, get } from "firebase/database";
import { ref as storageRef, getDownloadURL, listAll, uploadBytes, deleteObject, getMetadata } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

// Sidebar item component
const SidebarItem = ({ icon, label, active, onClick }) => (
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

const statusColors = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const initialProfile = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  city: "",
  state: "",
  area: "",
  pincode: "",
  age: "",
  disabilityType: "",
  category: "",
  medicalConditions: "",
  medications: "",
  modeOfCare: "",
};

const MyProfile = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState("appointments");
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState<{
    name: string, 
    url: string,
    type?: string,
    category?: string,
    uploadDate?: string
  }[]>([]);

  const navigate = useNavigate();
  const toast = useToast ? useToast() : { toast: (msg) => alert(msg.description) };

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
        
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        navigate("/auth?mode=login", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle profile change
  const handleProfileChange = (e) => {
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
      
      toast.toast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError("Failed to update profile. Please try again.");
      
      toast.toast({
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
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Then update password
      await updatePassword(user, newPassword);
      
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      
      toast.toast({
        title: "Success",
        description: "Password changed successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else {
        setPasswordError("Failed to change password. Please try again.");
      }
      
      toast.toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                <h2 className="text-xl font-semibold mb-4 text-[#1164A8]">
                  Current Appointments
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
                      {appointments
                        .filter(a => a.status === 'pending' || a.status === 'confirmed')
                        .map((a) => (
                        <tr key={a.id} className="border-b">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {a.doctorName || 'Doctor Assignment Pending'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {a.specialization || a.consultationType || 'General Consultation'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium">{a.date}</div>
                            <div className="text-sm text-gray-500">{a.time}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="capitalize">{a.consultationType || 'Virtual'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                statusColors[a.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {a.paymentAmount ? `₹${a.paymentAmount}` : 'N/A'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button 
                                className="text-[#1164A8] hover:underline text-sm"
                                onClick={() => {
                                  // You can add view details functionality here
                                  console.log('View appointment:', a);
                                }}
                              >
                                View
                              </button>
                              {a.status === 'pending' && (
                                <button 
                                  className="text-red-600 hover:underline text-sm"
                                  onClick={() => {
                                    // Add cancel functionality here
                                    console.log('Cancel appointment:', a);
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-4 text-center text-gray-500"
                          >
                            No current appointments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
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
                          const fileRef = storageRef(storage, `users/${userId}/medicalRecords/${file.name}`);
                          
                          // Upload the file
                          await uploadBytes(fileRef, file);
                          
                          // Get the download URL
                          const url = await getDownloadURL(fileRef);
                          
                          // Update state with the new record
                          setMedicalRecords([...medicalRecords, {
                            name: file.name,
                            url,
                            type: file.type,
                            category: 'document',
                            uploadDate: new Date().toLocaleDateString()
                          }]);

                          toast.toast({
                            title: "Success",
                            description: "Document uploaded successfully!",
                            variant: "default",
                          });
                        } catch (error) {
                          toast.toast({
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

                                toast.toast({
                                  title: "Success",
                                  description: "Document deleted successfully!",
                                  variant: "default",
                                });
                              } catch (error) {
                                toast.toast({
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
                      <b>City:</b> {profile.city}
                    </div>
                    <div>
                      <b>State:</b> {profile.state}
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
                            onChange={handleProfileChange}
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
                            onChange={handleProfileChange}
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
                            onChange={handleProfileChange}
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
                          <label className="block mb-1 font-medium">City</label>
                          <input
                            type="text"
                            name="city"
                            value={profile.city}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">State</label>
                          <input
                            type="text"
                            name="state"
                            value={profile.state}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Area/Locality</label>
                          <input
                            type="text"
                            name="area"
                            value={profile.area}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
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
                          onClick={() => setIsEditing(false)}
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
                          onClick={() => setShowChangePassword(false)}
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
              <>
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
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .filter(a => a.status === 'completed' || a.status === 'cancelled')
                        .sort((a, b) => {
                          // Sort by most recent first
                          const dateA = new Date(`${a.date} ${a.time}`);
                          const dateB = new Date(`${b.date} ${b.time}`);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .map((a) => (
                        <tr key={a.id} className="border-b">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {a.doctorName || 'Doctor Not Assigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {a.specialization || a.consultationType || 'General Consultation'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium">{a.date}</div>
                            <div className="text-sm text-gray-500">{a.time}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="capitalize">{a.consultationType || 'Virtual'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                statusColors[a.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {a.paymentAmount ? `₹${a.paymentAmount}` : 'N/A'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button 
                                className="text-[#1164A8] hover:underline text-sm"
                                onClick={() => {
                                  // You can add view details functionality here
                                  console.log('View appointment details:', a);
                                }}
                              >
                                View
                              </button>
                              {a.status === 'completed' && (
                                <button 
                                  className="text-green-600 hover:underline text-sm"
                                  onClick={() => {
                                    // Add download prescription/report functionality here
                                    console.log('Download report:', a);
                                  }}
                                >
                                  Report
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-4 text-center text-gray-500"
                          >
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
                      {appointments.filter(a => a.status === 'completed').length}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-red-800 font-semibold">
                      Cancelled Appointments
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {appointments.filter(a => a.status === 'cancelled').length}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-blue-800 font-semibold">
                      Total Appointments
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {appointments.length}
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "prescriptions" && (
              <div className="text-gray-500">
                Prescriptions coming soon...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyProfile;