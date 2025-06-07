import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StepCategory from "@/pages/onboarding/StepCategory";
import StepDisability from "@/pages/onboarding/StepDisability";
import StepMedical from "@/pages/onboarding/StepMedical";
import StepPreferences from "@/pages/onboarding/StepPreferences";
import StepConsent from "@/pages/onboarding/StepConsent";
import StepOptional from "@/pages/onboarding/StepOptional";
import { FaUser, FaUserMd } from "react-icons/fa";
import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { CheckCircle } from "lucide-react";

async function handleFileUpload(file: File, user: { id: string, name: string, email: string }, fileType = 'document') {
  // In a real implementation, you would upload to your preferred storage service
  // For now, we'll just return a mock URL
  return {
    publicUrl: `https://example.com/${user.id}/${file.name}`,
    filePath: `${user.id}/${file.name}`,
    bucketName: fileType === 'profilePhoto' ? 'profile-photos' : 'documents'
  };
}

// Indian states and cities
const STATES_WITH_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", 
    "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Mangalore", "Hubballi", "Belagavi",
    "Kalaburagi", "Davanagere", "Ballari", "Shivamogga", "Tumakuru"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur",
    "Alappuzha", "Palakkad", "Malappuram", "Kottayam", "Kannur"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
    "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Dindigul"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar",
    "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"
  ],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};
const STATES = Object.keys(STATES_WITH_CITIES);

const specializations = [
  "Public Health Dentistry",
  "Conservative Dentistry and Endodontics",
  "Oral and Maxillofacial Pathology",
  "Oral and Maxillofacial Surgery",
  "Oral and Maxillofacial Radiology",
  "Orthodontics and Dentofacial Orthopedics",
  "Pediatric and Preventive Dentistry",
  "Periodontics and Implantology",
  "Maxillofacial Prosthodontics and Implantology",
  "General Dentistry"
];

const initialData = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  city: "",
  state: "",
  pincode: "",
  area: "",
  category: "",
  disabilityType: "",
  disabilityOther: "",
  medicalConditions: [],
  medicalOther: "",
  medications: "",
  allergies: "",
  modeOfCare: "",
  consent: false,
  terms: false,
  email: "",
  dentalHistory: "",
  behavioralChallenges: "",
  previousRecords: null,
  profilePhoto: null,
  prescriptions: null,
  xrays: null,
  licenseNumber: "",
  specialization: "",
  password: "",
  confirmPassword: "",
  phoneVerified: false
};

const userSteps = [
  "BasicInfo",
  "Category",
  "Disability",
  "Medical",
  "Preferences",
  "Consent",
  "Optional"
];
const doctorSteps = ["Credentials"];

const tabClasses = (active: boolean) =>
  `flex-1 py-3 font-semibold text-base transition-colors duration-150 flex items-center justify-center gap-2 ${
    active
      ? "bg-[#e6f0fa] text-[#1669AE] border-b-4 border-[#1669AE]"
      : "bg-[#f5f7fa] text-[#222] border-b-4 border-transparent"
  }`;

const inputClasses =
  "w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1669AE] text-base mb-4";
const labelClasses = "block mb-1 font-medium text-gray-700";
const boxClasses =
  "max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md mt-32 mb-8";
const logo = (
  <img src="/logo.png" alt="SocioDent" className="h-12 mx-auto mb-4" />
);
const nextButtonClasses =
  "w-full py-2 rounded-lg bg-[#1669AE] text-white font-bold text-lg transition-colors duration-150 hover:bg-[#135a94]";
const finishButtonClasses =
  "w-full py-2 rounded-lg bg-[#F44336] text-white font-bold text-lg transition-colors duration-150 hover:bg-[#d32f2f] mt-4";
const errorClasses = "text-red-500 text-xs mb-2";
const overlayClasses = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

// Validate phone number (Indian mobile numbers start with 6-9 and are 10 digits)
const isPhoneValid = (phone: string) => /^[6-9]\d{9}$/.test(phone.trim());
const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordValid = (password: string) =>
  /^(?=.*[\d!@#$%^&*]).{6,}$/.test(password);

const DoctorRegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className={boxClasses}>
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">Registration Submitted</h2>
      <p className="text-gray-600 mb-6 text-center">
        Thank you for registering as a doctor. Your application is under review 
        by our admin team. You'll receive an email notification once your account 
        is approved. This process typically takes 1-2 business days.
      </p>
      <button
        onClick={() => navigate('/')}
        className={nextButtonClasses}
      >
        Return to Home
      </button>
    </div>
  );
};

const UserRegistrationSuccess = ({ fullName, onClose }: { fullName: string, onClose: () => void }) => {
  return (
    <div className={overlayClasses}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center relative">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {fullName}!
        </h2>
        <p className="mb-4 text-gray-700">
          You successfully registered for <span className="font-semibold text-[#1669AE]">SocioDent</span>.
        </p>
        <button
          className={nextButtonClasses}
          onClick={onClose}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

const renderUserBasicInfo = (
  formData: typeof initialData,
  updateFormData: (data: Partial<typeof initialData>) => void,
  nextStep: () => void,
  errors: Record<string, string>,
  setErrors: (errors: Record<string, string>) => void
) => {
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full Name required";
    if (!formData.age) newErrors.age = "Age required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.phone || !isPhoneValid(formData.phone))
      newErrors.phone = "10-digit phone required";
    if (!formData.email || !isEmailValid(formData.email))
      newErrors.email = "Valid email required";
    if (!formData.password || !isPasswordValid(formData.password))
      newErrors.password =
        "Min 6 chars, 1 number or special character required";
    if (!formData.confirmPassword) 
      newErrors.confirmPassword = "Confirm Password required";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.state) newErrors.state = "State required";
    if (!formData.city) newErrors.city = "City required";
    if (!formData.area) newErrors.area = "Area required";
    if (!formData.pincode) newErrors.pincode = "Pincode required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) nextStep();
      }}
    >
      <div className="mb-2 text-center text-2xl font-bold text-gray-800">Sign Up</div>
      <div className="mb-6 text-center text-gray-500 text-base">
        Step 1 of 7: Basic Info
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Full Name</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
        />
        {errors.fullName && <div className={errorClasses}>{errors.fullName}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Age</label>
        <input
          type="number"
          className={inputClasses}
          placeholder="Age"
          value={formData.age}
          min={1}
          max={120}
          onChange={(e) => updateFormData({ age: e.target.value })}
        />
        {errors.age && <div className={errorClasses}>{errors.age}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Gender</label>
        <select
          className={inputClasses}
          value={formData.gender}
          onChange={(e) => updateFormData({ gender: e.target.value })}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <div className={errorClasses}>{errors.gender}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Phone Number</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="10-digit Phone Number"
          value={formData.phone}
          maxLength={10}
          onChange={(e) => {
            if (/^\d{0,10}$/.test(e.target.value)) {
              updateFormData({ phone: e.target.value });
            }
          }}
        />
        {errors.phone && <div className={errorClasses}>{errors.phone}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Email</label>
        <input
          type="email"
          className={inputClasses}
          placeholder="Email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
        />
        {errors.email && <div className={errorClasses}>{errors.email}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Password</label>
        <input
          type="password"
          className={inputClasses}
          placeholder="Password"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
        />
        {errors.password && <div className={errorClasses}>{errors.password}</div>}
        <div className="text-xs text-gray-500 mb-4">
          Minimum 6 characters, at least one number or special character
        </div>
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Confirm Password</label>
        <input
          type="password"
          className={inputClasses}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
        />
        {errors.confirmPassword && <div className={errorClasses}>{errors.confirmPassword}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>State</label>
        <select
          className={inputClasses}
          value={formData.state}
          onChange={(e) => {
            updateFormData({ state: e.target.value, city: "" });
          }}
        >
          <option value="">Select State</option>
          {STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.state && <div className={errorClasses}>{errors.state}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>City</label>
        <select
          className={inputClasses}
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
          disabled={!formData.state}
        >
          <option value="">Select City</option>
          {formData.state &&
            STATES_WITH_CITIES[formData.state]?.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
        </select>
        {errors.city && <div className={errorClasses}>{errors.city}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Area/Locality</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Area/Locality"
          value={formData.area}
          onChange={(e) => updateFormData({ area: e.target.value })}
        />
        {errors.area && <div className={errorClasses}>{errors.area}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Pincode</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Pincode"
          value={formData.pincode}
          maxLength={6}
          onChange={(e) => updateFormData({ pincode: e.target.value })}
        />
        {errors.pincode && <div className={errorClasses}>{errors.pincode}</div>}
      </div>
      
      <button type="submit" className={nextButtonClasses}>
        Next
      </button>
    </form>
  );
};

const renderDoctorCredentials = (
  formData: typeof initialData,
  updateFormData: (data: Partial<typeof initialData>) => void,
  handleSubmit: () => void,
  errors: Record<string, string>,
  setErrors: (errors: Record<string, string>) => void
) => {
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full Name required";
    if (!formData.email || !isEmailValid(formData.email))
      newErrors.email = "Valid email required";
    if (!formData.password || !isPasswordValid(formData.password))
      newErrors.password =
        "Min 6 chars, 1 number or special character required";
    if (!formData.confirmPassword) 
      newErrors.confirmPassword = "Confirm Password required";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.licenseNumber) newErrors.licenseNumber = "License required";
    if (!formData.specialization)
      newErrors.specialization = "Specialization required";
    if (!formData.phone || !isPhoneValid(formData.phone))
      newErrors.phone = "10-digit phone required";
    if (!formData.age) newErrors.age = "Age required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.state) newErrors.state = "State required";
    if (!formData.city) newErrors.city = "City required";
    if (!formData.area) newErrors.area = "Area required";
    if (!formData.pincode) newErrors.pincode = "Pincode required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) handleSubmit();
      }}
    >
      <div className="mb-2 text-center text-2xl font-bold text-gray-800">Doctor Registration</div>
      <div className="mb-6 text-center text-gray-500 text-base">
        Please provide your professional details
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Full Name</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
        />
        {errors.fullName && <div className={errorClasses}>{errors.fullName}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Email</label>
        <input
          type="email"
          className={inputClasses}
          placeholder="Email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
        />
        {errors.email && <div className={errorClasses}>{errors.email}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Password</label>
        <input
          type="password"
          className={inputClasses}
          placeholder="Password"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
        />
        {errors.password && <div className={errorClasses}>{errors.password}</div>}
        <div className="text-xs text-gray-500 mb-4">
          Minimum 6 characters, at least one number or special character
        </div>
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Confirm Password</label>
        <input
          type="password"
          className={inputClasses}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
        />
        {errors.confirmPassword && <div className={errorClasses}>{errors.confirmPassword}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>License Number</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="License Number"
          value={formData.licenseNumber}
          onChange={(e) => updateFormData({ licenseNumber: e.target.value })}
        />
        {errors.licenseNumber && <div className={errorClasses}>{errors.licenseNumber}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Specialization</label>
        <select
          className={inputClasses}
          value={formData.specialization}
          onChange={(e) => updateFormData({ specialization: e.target.value })}
        >
          <option value="">Select Specialization</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
        {errors.specialization && <div className={errorClasses}>{errors.specialization}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Phone Number</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="10-digit Phone Number"
          value={formData.phone}
          maxLength={10}
          onChange={(e) => {
            if (/^\d{0,10}$/.test(e.target.value)) {
              updateFormData({ phone: e.target.value });
            }
          }}
        />
        {errors.phone && <div className={errorClasses}>{errors.phone}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Age</label>
        <input
          type="number"
          className={inputClasses}
          placeholder="Age"
          value={formData.age}
          min={1}
          max={120}
          onChange={(e) => updateFormData({ age: e.target.value })}
        />
        {errors.age && <div className={errorClasses}>{errors.age}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Gender</label>
        <select
          className={inputClasses}
          value={formData.gender}
          onChange={(e) => updateFormData({ gender: e.target.value })}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <div className={errorClasses}>{errors.gender}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>State</label>
        <select
          className={inputClasses}
          value={formData.state}
          onChange={(e) => {
            updateFormData({ state: e.target.value, city: "" });
          }}
        >
          <option value="">Select State</option>
          {STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.state && <div className={errorClasses}>{errors.state}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>City</label>
        <select
          className={inputClasses}
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
          disabled={!formData.state}
        >
          <option value="">Select City</option>
          {formData.state &&
            STATES_WITH_CITIES[formData.state]?.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
        </select>
        {errors.city && <div className={errorClasses}>{errors.city}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Area/Locality</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Area/Locality"
          value={formData.area}
          onChange={(e) => updateFormData({ area: e.target.value })}
        />
        {errors.area && <div className={errorClasses}>{errors.area}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Pincode</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Pincode"
          value={formData.pincode}
          maxLength={6}
          onChange={(e) => updateFormData({ pincode: e.target.value })}
        />
        {errors.pincode && <div className={errorClasses}>{errors.pincode}</div>}
      </div>
      
      <button 
        type="submit" 
        className={nextButtonClasses}
      >
        Register
      </button>
    </form>
  );
};

const Onboarding: React.FC = () => {
  const [role, setRole] = useState<"user" | "doctor">("user");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showUserSuccess, setShowUserSuccess] = useState(false);
  const navigate = useNavigate();

  const updateFormData = (data: Partial<typeof initialData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Create Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // Data for database
      const userData: any = {
        uid: userCredential.user.uid,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        phoneVerified: false,
        role,
        registeredAt: new Date().toISOString(),
        state: formData.state,
        city: formData.city,
        area: formData.area,
        pincode: formData.pincode,
        address: {
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          area: formData.area,
        },
        age: formData.age,
        gender: formData.gender,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Specific fields based on role
      if (role === "doctor") {
        userData.licenseNumber = formData.licenseNumber;
        userData.specialization = formData.specialization;
        userData.status = "pending"; // Admin must approve doctors
      } else {
        userData.category = formData.category;
        userData.disabilityType = formData.disabilityType;
        userData.medicalConditions = formData.medicalConditions;
        userData.modeOfCare = formData.modeOfCare;
        userData.status = "active"; // Users are active immediately
        
        // Handle file uploads if present
        if (formData.prescriptions) {
          try {
            const result = await handleFileUpload(formData.prescriptions, {
              id: userCredential.user.uid,
              name: formData.fullName,
              email: formData.email
            }, 'prescription');
            userData.prescriptionsUrl = result.publicUrl;
            userData.prescriptionPath = result.filePath;
            userData.prescriptionBucket = result.bucketName;
          } catch (uploadError) {
            console.error("Failed to upload prescriptions:", uploadError);
          }
        }

        if (formData.xrays) {
          try {
            const result = await handleFileUpload(formData.xrays, {
              id: userCredential.user.uid,
              name: formData.fullName,
              email: formData.email
            }, 'xray');
            userData.xraysUrl = result.publicUrl;
            userData.xraysPath = result.filePath;
            userData.xraysBucket = result.bucketName;
          } catch (uploadError) {
            console.error("Failed to upload x-rays:", uploadError);
          }
        }

        if (formData.profilePhoto) {
          try {
            const result = await handleFileUpload(formData.profilePhoto, {
              id: userCredential.user.uid,
              name: formData.fullName,
              email: formData.email
            }, 'profilePhoto');
            userData.profilePhotoUrl = result.publicUrl;
            userData.profilePhotoPath = result.filePath;
            userData.profilePhotoBucket = result.bucketName;
          } catch (uploadError) {
            console.error("Failed to upload profile photo:", uploadError);
          }
        }
      }

      // Save to database
      await set(ref(db, `users/${userCredential.user.uid}`), userData);

      if (role === "doctor") {
        setRegistrationSuccess(true);
      } else {
        // Update auth state for users
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", formData.fullName);
        localStorage.setItem("uid", userCredential.user.uid);
        window.dispatchEvent(new Event("authChange"));
        setShowUserSuccess(true);
      }
    } catch (error: any) {
      setError(`Registration failed: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return <DoctorRegistrationSuccess />;
  }

  if (showUserSuccess) {
    return (
      <UserRegistrationSuccess 
        fullName={formData.fullName} 
        onClose={() => navigate("/")} 
      />
    );
  }

  const renderStep = () => {
    if (role === "user") {
      switch (step) {
        case 0:
          return renderUserBasicInfo(
            formData,
            updateFormData,
            () => setStep(1),
            errors,
            setErrors
          );
        case 1:
          return (
            <StepCategory
              data={formData}
              updateData={updateFormData}
              nextStep={() => setStep(2)}
              prevStep={() => setStep(0)}
            />
          );
        case 2:
          return (
            <StepDisability
              data={formData}
              updateData={updateFormData}
              nextStep={() => setStep(3)}
              prevStep={() => setStep(1)}
            />
          );
        case 3:
          return (
            <StepMedical
              data={formData}
              updateData={updateFormData}
              nextStep={() => setStep(4)}
              prevStep={() => setStep(2)}
            />
          );
        case 4:
          return (
            <StepPreferences
              data={formData}
              updateData={updateFormData}
              nextStep={() => setStep(5)}
              prevStep={() => setStep(3)}
            />
          );
        case 5:
          return (
            <StepConsent
              data={formData}
              updateData={updateFormData}
              nextStep={() => setStep(6)}
              prevStep={() => setStep(4)}
            />
          );
        case 6:
          return (
            <StepOptional
              data={formData}
              updateData={updateFormData}
              prevStep={() => setStep(5)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          );
        default:
          return null;
      }
    } else {
      return renderDoctorCredentials(
        formData,
        updateFormData,
        handleSubmit,
        errors,
        setErrors
      );
    }
  };

  return (
    <div className={boxClasses}>
      {logo}
      <div className="flex justify-center mb-6">
        <button
          className={tabClasses(role === "user") + " rounded-l-lg"}
          onClick={() => {
            setRole("user");
            setStep(0);
            setErrors({});
          }}
        >
          <FaUser /> User
        </button>
        <button
          className={tabClasses(role === "doctor") + " rounded-r-lg"}
          onClick={() => {
            setRole("doctor");
            setStep(0);
            setErrors({});
          }}
        >
          <FaUserMd /> Doctor
        </button>
      </div>
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      {renderStep()}
    </div>
  );
};

export default Onboarding;