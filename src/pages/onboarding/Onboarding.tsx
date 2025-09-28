import React, { useState, useEffect } from "react";
import { fetchCitiesAndAreas } from "@/services/mapmyindiaService";
import { INDIAN_STATES } from "@/constants/indianStates";
import { useNavigate } from "react-router-dom";
import StepCategory from "@/pages/onboarding/StepCategory";
import StepDisability from "@/pages/onboarding/StepDisability";
import StepMedical from "@/pages/onboarding/StepMedical";
import StepPreferences from "@/pages/onboarding/StepPreferences";
import StepConsent from "@/pages/onboarding/StepConsent";
import StepOptional from "@/pages/onboarding/StepOptional";
import { FaUser, FaUserMd, FaSyncAlt, FaBuilding } from "react-icons/fa";
import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser, signOut } from "firebase/auth";
import { ref, set, get, push, onValue } from "firebase/database";
import { CheckCircle } from "lucide-react";
import { sendNewDoctorRegistrationNotification, sendUserRegistrationSuccessEmail, sendNewUserRegistrationNotificationToAdmin, sendOrganizationBookingNotification, sendOrganizationBookingConfirmation } from "../../services/emailService";
import EmailOTPVerification from "@/components/EmailOTPVerification";
import AudioCaptcha from "@/components/AudioCaptcha";
import WhatsAppWelcomeService from "@/services/whatsappWelcomeService";

// Generate CAPTCHA function
const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

async function handleFileUpload(file: File, user: { id: string, name: string, email: string }, fileType = 'document') {
  // In a real implementation, you would upload to your preferred storage service
  // For now, we'll just return a mock URL
  return {
    publicUrl: `https://example.com/${user.id}/${file.name}`,
    filePath: `${user.id}/${file.name}`,
    bucketName: fileType === 'profilePhoto' ? 'profile-photos' : 'documents'
  };
}



// These must be inside a component, not at the top level!
// Remove from here. Will move to Onboarding component below.


// These must be inside a component, not at the top level!
// Remove from here. Will move to Onboarding component below.

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

export const initialData = {
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
  phoneVerified: false,
  // Organization specific fields
  organizationName: "",
  designation: "",
  requirement: "",
  organizationPhone: "",
  organizationEmail: "",
  organizationType: "",
  numberOfBeneficiaries: "",
  preferredDate: "",
  preferredTime: "",
  additionalNotes: ""
};


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

const OrganizationRegistrationSuccess = ({ organizationName, onClose }: { organizationName: string, onClose: () => void }) => {
  return (
    <div className={overlayClasses}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center relative">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">
          🎉 Request Submitted Successfully!
        </h2>
        <p className="mb-4 text-lg text-gray-700">
          Thank you <span className="font-semibold text-[#1669AE]">{organizationName}</span>!
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 text-sm mb-2">
            <strong>✅ What we've done:</strong>
          </p>
          <ul className="text-green-700 text-sm text-left space-y-1">
            <li>• Your group booking request has been received</li>
            <li>• Admin notification has been sent</li>
            <li>• Confirmation email sent to your registered email</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm mb-2">
            <strong>⏰ What happens next:</strong>
          </p>
          <ul className="text-blue-700 text-sm text-left space-y-1">
            <li>• Our team will review your request</li>
            <li>• We'll contact you within <strong>24-48 hours</strong></li>
            <li>• We'll coordinate the best appointment schedule</li>
            <li>• Group dental care will be arranged at your location</li>
          </ul>
        </div>
        
        <p className="mb-4 text-gray-600 text-sm">
          For any immediate queries, please contact us at <strong>steward@sociodent.in</strong>
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

interface RenderUserBasicInfoProps {
  formData: typeof initialData;
  updateFormData: (data: Partial<typeof initialData>) => void;
  nextStep: () => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  emailVerified: boolean;
  setEmailVerified: (verified: boolean) => void;
  otpError: string;
  setOtpError: (error: string) => void;
  captcha: string;
  captchaInput: string;
  captchaVerified: boolean;
  setCaptchaInput: (input: string) => void;
  setCaptchaVerified: (verified: boolean) => void;
  handleCaptchaRefresh: () => void;
  handleCaptchaVerify: () => void;
  cityQuery: string;
  setCityQuery: React.Dispatch<React.SetStateAction<string>>;
  cityResults: any[];
  isLoadingCities: boolean;
  fetchCities: (query: string) => Promise<void>;
  areaQuery: string;
  setAreaQuery: React.Dispatch<React.SetStateAction<string>>;
  areaResults: any[];
  isLoadingAreas: boolean;
  fetchAreas: (query: string) => Promise<void>;
  setCityResults: React.Dispatch<React.SetStateAction<any[]>>;
  setAreaResults: React.Dispatch<React.SetStateAction<any[]>>;
}

const renderUserBasicInfo = ({
  formData,
  updateFormData,
  nextStep,
  errors,
  setErrors,
  emailVerified,
  setEmailVerified,
  otpError,
  setOtpError,
  captcha,
  captchaInput,
  captchaVerified,
  setCaptchaInput,
  setCaptchaVerified,
  handleCaptchaRefresh,
  handleCaptchaVerify,
  cityQuery,
  setCityQuery,
  cityResults,
  isLoadingCities,
  fetchCities,
  areaQuery,
  setAreaQuery,
  areaResults,
  isLoadingAreas,
  fetchAreas,
  setCityResults,
  setAreaResults
}: RenderUserBasicInfoProps) => {
  // Function to validate pincode and update location
  const verifyAndUpdateLocation = async (pincode: string) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data[0].Status === "Success") {
        const location = data[0].PostOffice[0];
        const state = location.State;
        const city = location.District;
        const area = location.Name;
        
        // Show a temporary notification about the update
        const newErrors = { ...errors, pincode: `Location updated based on pincode: ${city}, ${state}` };
        setErrors(newErrors);
        
        // Clear the notification after 3 seconds
        setTimeout(() => {
          setErrors({ ...errors, pincode: "" });
        }, 3000);
        
        // Always update the location fields with verified data
        updateFormData({
          state,
          city,
          area,
          pincode
        });
        
        // Update the queries to match the verified data
        setCityQuery(city);
        setAreaQuery(area);
        setCityResults([]);
        setAreaResults([]);
        
      } else {
        setErrors({
          ...errors,
          pincode: "Invalid pincode. Please enter a valid 6-digit pincode."
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        pincode: "Error validating pincode. Please try again."
      });
    }
  };
  // Function to validate pincode and fetch location details
  // Function to validate pincode and fetch location details
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full Name required";
    if (!formData.age) newErrors.age = "Age required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.phone || !isPhoneValid(formData.phone))
      newErrors.phone = "10-digit phone required";
    if (!formData.email || !isEmailValid(formData.email))
      newErrors.email = "Valid email required";
    if (!emailVerified) newErrors.email = "Please verify your email address";
    if (!captchaVerified) newErrors.captcha = "Please verify CAPTCHA";
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
        <label className={labelClasses} htmlFor="fullNameInput">Full Name</label>
        <input
          id="fullNameInput"
          type="text"
          className={inputClasses}
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
        />
        {errors.fullName && <div className={errorClasses}>{errors.fullName}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="ageInput">Age</label>
        <input
          id="ageInput"
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
        <label className={labelClasses} htmlFor="genderSelect">Gender</label>
        <select
          id="genderSelect"
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
        <label className={labelClasses} htmlFor="phoneInput">Phone Number</label>
        <input
          id="phoneInput"
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
        <label className={labelClasses} htmlFor="emailInput">Email</label>
        <input
          id="emailInput"
          type="email"
          className={inputClasses}
          placeholder="Email"
          value={formData.email}
          onChange={(e) => {
            updateFormData({ email: e.target.value });
            // Reset email verification when email changes
            if (emailVerified) {
              setEmailVerified(false);
            }
            setOtpError("");
          }}
        />
        {errors.email && <div className={errorClasses}>{errors.email}</div>}
      </div>

      {/* Email OTP Verification */}
      {formData.email && isEmailValid(formData.email) && (
        <EmailOTPVerification
          email={formData.email}
          onVerified={() => {
            setEmailVerified(true);
            setOtpError("");
            // Remove email error if it exists
            const newErrors = { ...errors };
            delete newErrors.email;
            setErrors(newErrors);
          }}
          onError={(error) => {
            setOtpError(error);
            setEmailVerified(false);
          }}
        />
      )}
      
      {otpError && <div className={errorClasses}>{otpError}</div>}
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="passwordInput">Password</label>
        <input
          id="passwordInput"
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
        <label className={labelClasses} htmlFor="confirmPasswordInput">Confirm Password</label>
        <input
          id="confirmPasswordInput"
          type="password"
          className={inputClasses}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
        />
        {errors.confirmPassword && <div className={errorClasses}>{errors.confirmPassword}</div>}
      </div>
      


      <div className="mb-4">
        <label className={labelClasses} htmlFor="stateInput">State</label>
        <select
          id="stateInput"
          className={inputClasses}
          value={formData.state}
          onChange={e => {
            updateFormData({ state: e.target.value, city: "", area: "" });
            setCityQuery("");
            setAreaQuery("");
            setCityResults([]);
            setAreaResults([]);
          }}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        {errors.state && <div className={errorClasses}>{errors.state}</div>}
      </div>

      <div className="mb-4">
        <label className={labelClasses} htmlFor="cityInput">City</label>
        <input
          id="cityInput"
          className={inputClasses}
          placeholder="Type city name"
          value={cityQuery}
          onChange={async (e) => {
            setCityQuery(e.target.value);
            await fetchCities(e.target.value + (formData.state ? `,${formData.state}` : ""));
          }}
          autoComplete="off"
          disabled={!formData.state}
        />
        {isLoadingCities && <div className="text-sm text-gray-500">Loading cities...</div>}
        <div className="relative">
          {cityResults.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
              {cityResults.map((city: any) => (
                <li
                  key={city.id}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    updateFormData({ city: city.text, area: "" });
                    setCityQuery(city.text);
                    setCityResults([]);
                  }}
                >
                  {city.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.city && <div className={errorClasses}>{errors.city}</div>}
      </div>

      <div className="mb-4">
        <label className={labelClasses} htmlFor="areaInput">Area/Locality</label>
        <input
          id="areaInput"
          className={inputClasses}
          placeholder="Type area/locality"
          value={areaQuery}
          onChange={async (e) => {
            setAreaQuery(e.target.value);
            await fetchAreas(e.target.value + (formData.city ? `,${formData.city}` : ""));
          }}
          autoComplete="off"
          disabled={!formData.city}
        />
        {isLoadingAreas && <div className="text-sm text-gray-500">Loading areas...</div>}
        <div className="relative">
          {areaResults.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
              {areaResults.map((area: any) => (
                <li
                  key={area.id}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    updateFormData({ area: area.text });
                    setAreaQuery(area.text);
                    setAreaResults([]);
                  }}
                >
                  {area.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.area && <div className={errorClasses}>{errors.area}</div>}
      </div>

      <div className="mb-4">
        <label className={labelClasses} htmlFor="pincodeInput">Pincode</label>
        <div className="flex gap-2">
          <input
            id="pincodeInput"
            type="text"
            className={inputClasses}
            placeholder="Pincode"
            value={formData.pincode}
            maxLength={6}
            onChange={(e) => {
              const pincode = e.target.value;
              // Allow only digits
              if (/^\d*$/.test(pincode)) {
                updateFormData({ pincode });
                // Clear validation error when user starts typing
                if (errors.pincode) {
                  setErrors({ ...errors, pincode: "" });
                }
                // Auto-validate when 6 digits are entered
                if (pincode.length === 6) {
                  verifyAndUpdateLocation(pincode);
                }
              }
            }}
          />
          <button
            type="button"
            className="px-4 py-2 bg-[#1669AE] text-white rounded-lg hover:bg-[#135a94] disabled:opacity-50"
            onClick={() => verifyAndUpdateLocation(formData.pincode)}
            disabled={!formData.pincode || formData.pincode.length !== 6}
          >
            Verify
          </button>
        </div>
        {errors.pincode && <div className={errorClasses}>{errors.pincode}</div>}
      </div>      {/* CAPTCHA Section */}
      <div className="mb-4">
        <label className={labelClasses} htmlFor="captchaInput">Security Verification</label>
        <div className="mb-3">
        {/* Audio CAPTCHA for accessibility */}
        <AudioCaptcha captchaText={captcha} className="mb-3" />
        
        {/* Visual CAPTCHA */}
        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-3">
          <div className="flex items-center">
            <span>{captcha}</span>
            <button
              type="button"
              onClick={handleCaptchaRefresh}
              title="Refresh Captcha"
              className="ml-2 p-1 text-gray-600 hover:text-gray-800"
            >
              <FaSyncAlt />
            </button>
          </div>
        </div>
        
        <input
          type="text"
          className={inputClasses}
          placeholder="Enter CAPTCHA"
          value={captchaInput}
          onChange={(e) => {
            setCaptchaInput(e.target.value);
            setCaptchaVerified(false);
          }}
          onBlur={handleCaptchaVerify}
        />
        {errors.captcha && <div className={errorClasses}>{errors.captcha}</div>}
        </div>
      </div>
      
      <button type="submit" className={nextButtonClasses}>
        Next
      </button>
    </form>
  );
};

const renderOrganizationInfo = (
  formData: typeof initialData,
  updateFormData: (data: Partial<typeof initialData>) => void,
  handleSubmit: () => void,
  errors: Record<string, string>,
  setErrors: (errors: Record<string, string>) => void,
  emailVerified: boolean,
  setEmailVerified: (verified: boolean) => void,
  otpError: string,
  setOtpError: (error: string) => void,
  captcha: string,
  captchaInput: string,
  captchaVerified: boolean,
  setCaptchaInput: (input: string) => void,
  setCaptchaVerified: (verified: boolean) => void,
  handleCaptchaRefresh: () => void,
  handleCaptchaVerify: () => void,
  bookedDates: Set<string>,
  setError: (error: string) => void
) => {
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Contact Person Name required";
    if (!formData.organizationName) newErrors.organizationName = "Organization Name required";
    if (!formData.designation) newErrors.designation = "Designation required";
    if (!formData.requirement) newErrors.requirement = "Requirement details required";
    if (!formData.organizationPhone || !isPhoneValid(formData.organizationPhone))
      newErrors.organizationPhone = "Valid 10-digit phone number required";
    if (!formData.organizationEmail || !isEmailValid(formData.organizationEmail))
      newErrors.organizationEmail = "Valid email required";
    if (!emailVerified) newErrors.organizationEmail = "Please verify your email address";
    if (!captchaVerified) newErrors.captcha = "Please verify CAPTCHA";
    if (!formData.organizationType) newErrors.organizationType = "Organization type required";
    if (!formData.numberOfBeneficiaries) newErrors.numberOfBeneficiaries = "Number of beneficiaries required";
    if (!formData.state) newErrors.state = "State required";
    if (!formData.city) newErrors.city = "City required";
    
    // Date validation - same as consultation booking
    if (formData.preferredDate) {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      const minDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from today
      const maxDate = new Date(today.getTime() + 2 * 30 * 24 * 60 * 60 * 1000); // 2 months from today
      
      if (selectedDate < minDate) {
        newErrors.preferredDate = `You can only book after 2 days from today (starting from ${minDate.toLocaleDateString()})`;
      } else if (selectedDate > maxDate) {
        newErrors.preferredDate = `You can only book up to 2 months in advance (until ${maxDate.toLocaleDateString()})`;
      }
    }
    
    // Check if preferred date is already booked
    if (formData.preferredDate && bookedDates.has(formData.preferredDate)) {
      newErrors.preferredDate = "This date is already booked. Please select a different date.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const organizationTypes = [
    "NGO - Elderly Care",
    "NGO - Disability Services",
    "Government Institution",
    "Old Age Home",
    "Rehabilitation Center",
    "Community Center",
    "Educational Institution",
    "Healthcare Facility",
    "Other"
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) handleSubmit();
      }}
    >
      <div className="mb-2 text-center text-2xl font-bold text-gray-800">Organization Booking</div>
      <div className="mb-6 text-center text-gray-500 text-base">
        Group dental appointment for elderly or persons with disabilities
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Contact Person Name *</label>
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
        <label className={labelClasses}>Organization Name *</label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Organization/Institution Name"
          value={formData.organizationName}
          onChange={(e) => updateFormData({ organizationName: e.target.value })}
        />
        {errors.organizationName && <div className={errorClasses}>{errors.organizationName}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses}>Organization Type *</label>
        <select
          className={inputClasses}
          value={formData.organizationType}
          onChange={(e) => updateFormData({ organizationType: e.target.value })}
        >
          <option value="">Select Organization Type</option>
          {organizationTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.organizationType && <div className={errorClasses}>{errors.organizationType}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgDesignationInput">Your Designation *</label>
        <input
          id="orgDesignationInput"
          type="text"
          className={inputClasses}
          placeholder="e.g., Manager, Coordinator, Director"
          value={formData.designation}
          onChange={(e) => updateFormData({ designation: e.target.value })}
        />
        {errors.designation && <div className={errorClasses}>{errors.designation}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgPhoneInput">Contact Phone *</label>
        <input
          id="orgPhoneInput"
          type="tel"
          className={inputClasses}
          placeholder="10-digit mobile number"
          value={formData.organizationPhone}
          maxLength={10}
          onChange={(e) => updateFormData({ organizationPhone: e.target.value })}
        />
        {errors.organizationPhone && <div className={errorClasses}>{errors.organizationPhone}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgEmailInput">Contact Email *</label>
        <input
          id="orgEmailInput"
          type="email"
          className={inputClasses}
          placeholder="Email"
          value={formData.organizationEmail}
          onChange={(e) => {
            updateFormData({ organizationEmail: e.target.value });
            // Reset email verification when email changes
            if (emailVerified) {
              setEmailVerified(false);
            }
            setOtpError("");
          }}
        />
        {errors.organizationEmail && <div className={errorClasses}>{errors.organizationEmail}</div>}
      </div>

      {/* Email OTP Verification */}
      {formData.organizationEmail && isEmailValid(formData.organizationEmail) && (
        <EmailOTPVerification
          email={formData.organizationEmail}
          onVerified={() => {
            setEmailVerified(true);
            setOtpError("");
            // Remove email error if it exists
            const newErrors = { ...errors };
            delete newErrors.organizationEmail;
            setErrors(newErrors);
          }}
          onError={(error) => {
            setOtpError(error);
            setEmailVerified(false);
          }}
        />
      )}
      
      {otpError && <div className={errorClasses}>{otpError}</div>}
      
      {/* State/city dropdowns removed: now only dynamic city/area search is used */}
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgBeneficiariesInput">Number of Beneficiaries *</label>
        <input
          id="orgBeneficiariesInput"
          type="number"
          className={inputClasses}
          placeholder="How many people need dental care?"
          value={formData.numberOfBeneficiaries}
          min="1"
          onChange={(e) => updateFormData({ numberOfBeneficiaries: e.target.value })}
        />
        {errors.numberOfBeneficiaries && <div className={errorClasses}>{errors.numberOfBeneficiaries}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgPreferredDateInput">Preferred Date</label>
        <input
          id="orgPreferredDateInput"
          type="date"
          className={`${inputClasses} ${
            formData.preferredDate && bookedDates.has(formData.preferredDate) 
              ? 'border-red-500 bg-red-50' 
              : ''
          }`}
          value={formData.preferredDate}
          min={(() => {
            const today = new Date();
            const minDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
            return minDate.toISOString().split('T')[0];
          })()}
          max={(() => {
            const today = new Date();
            const maxDate = new Date(today.getTime() + 2 * 30 * 24 * 60 * 60 * 1000);
            return maxDate.toISOString().split('T')[0];
          })()}
          onChange={(e) => {
            const selectedDate = e.target.value;
            updateFormData({ preferredDate: selectedDate });
            
            // Clear any previous error if date is available
            if (selectedDate && !bookedDates.has(selectedDate)) {
              setError("");
            }
          }}
        />
        <div className="text-sm text-gray-600 mt-1 mb-2">
          You can book only after 2 days from today (starting from {(() => {
            const today = new Date();
            const minDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
            return minDate.toLocaleDateString();
          })()}) and up to 2 months in advance.
        </div>
        {formData.preferredDate && bookedDates.has(formData.preferredDate) && (
          <div className="text-red-600 text-sm mt-1 mb-2">
            ⚠️ This date is already booked by another organization. Please select a different date.
          </div>
        )}
        {bookedDates.size > 0 && (
          <div className="text-gray-600 text-sm mt-1">
            <strong>Note:</strong> The following dates are already booked: {Array.from(bookedDates).sort().join(', ')}
          </div>
        )}
        {errors.preferredDate && <div className={errorClasses}>{errors.preferredDate}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgPreferredTimeSelect">Preferred Time</label>
        <select
          id="orgPreferredTimeSelect"
          className={inputClasses}
          value={formData.preferredTime}
          onChange={(e) => updateFormData({ preferredTime: e.target.value })}
        >
          <option value="">Select preferred time</option>
          <option value="morning">Morning (9 AM - 12 PM)</option>
          <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
          <option value="evening">Evening (4 PM - 7 PM)</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgRequirementTextarea">Requirement Details *</label>
        <textarea
          id="orgRequirementTextarea"
          className={inputClasses}
          placeholder="Please describe your dental care requirements, special needs, accessibility requirements, etc."
          value={formData.requirement}
          rows={4}
          onChange={(e) => updateFormData({ requirement: e.target.value })}
        />
        {errors.requirement && <div className={errorClasses}>{errors.requirement}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="orgNotesTextarea">Additional Notes</label>
        <textarea
          id="orgNotesTextarea"
          className={inputClasses}
          placeholder="Any additional information that would help us serve you better"
          value={formData.additionalNotes}
          rows={3}
          onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
        />
      </div>

      {/* CAPTCHA Section */}
      <div className="mb-4">
        <label className={labelClasses}>Security Verification</label>
        <div className="mb-3">
        {/* Audio CAPTCHA for accessibility */}
        <AudioCaptcha captchaText={captcha} className="mb-3" />
        
        {/* Visual CAPTCHA */}
        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-3">
          <div className="flex items-center">
            <span>{captcha}</span>
            <button
              type="button"
              onClick={handleCaptchaRefresh}
              title="Refresh Captcha"
              className="ml-2 p-1 text-gray-600 hover:text-gray-800"
            >
              <FaSyncAlt />
            </button>
          </div>
        </div>
        
        <input
          type="text"
          className={inputClasses}
          placeholder="Enter CAPTCHA"
          value={captchaInput}
          onChange={(e) => {
            setCaptchaInput(e.target.value);
            setCaptchaVerified(false);
          }}
          onBlur={handleCaptchaVerify}
        />
        {errors.captcha && <div className={errorClasses}>{errors.captcha}</div>}
        </div>
      </div>
      
      <button type="submit" className={finishButtonClasses}>
        Submit Request
      </button>
    </form>
  );
};

// Function to validate pincode and fetch location details

const renderDoctorCredentials = (
  formData: typeof initialData,
  updateFormData: (data: Partial<typeof initialData>) => void,
  handleSubmit: () => void,
  errors: Record<string, string>,
  setErrors: (errors: Record<string, string>) => void,
  emailVerified: boolean,
  setEmailVerified: (verified: boolean) => void,
  otpError: string,
  setOtpError: (error: string) => void,
  captcha: string,
  captchaInput: string,
  captchaVerified: boolean,
  setCaptchaInput: (input: string) => void,
  setCaptchaVerified: (verified: boolean) => void,
  handleCaptchaRefresh: () => void,
  handleCaptchaVerify: () => void,
  cityQuery: string,
  setCityQuery: React.Dispatch<React.SetStateAction<string>>,
  cityResults: any[],
  isLoadingCities: boolean,
  fetchCities: (query: string) => Promise<void>,
  areaQuery: string,
  setAreaQuery: React.Dispatch<React.SetStateAction<string>>,
  areaResults: any[],
  isLoadingAreas: boolean,
  fetchAreas: (query: string) => Promise<void>,
  setCityResults: React.Dispatch<React.SetStateAction<any[]>>,
  setAreaResults: React.Dispatch<React.SetStateAction<any[]>>
) => {
  // Function to validate pincode and fetch location details
  const validatePincodeLocation = async (pincode: string) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data[0].Status === "Success") {
        const location = data[0].PostOffice[0];
        const state = location.State;
        const city = location.District;
        const area = location.Name;
        
        // If location differs, show an informative message but still update
        if ((formData.state && formData.state !== state) || 
            (formData.city && formData.city !== city) || 
            (formData.area && formData.area !== area)) {
          // Show a temporary notification about the change
          setErrors({
            ...errors,
            pincode: `Location updated based on pincode: ${city}, ${state}`
          });
          
          // Clear the notification after 3 seconds
          setTimeout(() => {
            setErrors({
              ...errors,
              pincode: ""
            });
          }, 3000);
        }
        
        // Always update the location fields with verified data
        updateFormData({
          state,
          city,
          area,
          pincode
        });
        
        // Clear any existing errors
        setErrors({
          ...errors,
          pincode: "",
          state: "",
          city: "",
          area: ""
        });
        
        // Update the queries to match the verified data
        setCityQuery(city);
        setAreaQuery(area);
        setCityResults([]);
        setAreaResults([]);
        
      } else {
        setErrors({
          ...errors,
          pincode: "Invalid pincode. Please enter a valid 6-digit pincode."
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        pincode: "Error validating pincode. Please try again."
      });
    }
  };
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full Name required";
    if (!formData.email || !isEmailValid(formData.email))
      newErrors.email = "Valid email required";
    if (!emailVerified) newErrors.email = "Please verify your email address";
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
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.area) newErrors.area = "Area/Locality is required";
    if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) 
      newErrors.pincode = "Valid 6-digit pincode required";
    if (!formData.age) newErrors.age = "Age required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.state) newErrors.state = "State required";
   
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
        <label className={labelClasses} htmlFor="doctorFullNameInput">Full Name</label>
        <input
          id="doctorFullNameInput"
          type="text"
          className={inputClasses}
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
        />
        {errors.fullName && <div className={errorClasses}>{errors.fullName}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorEmailInput">Email</label>
        <input
          id="doctorEmailInput"
          type="email"
          className={inputClasses}
          placeholder="Email"
          value={formData.email}
          onChange={(e) => {
            updateFormData({ email: e.target.value });
            // Reset email verification when email changes
            if (emailVerified) {
              setEmailVerified(false);
            }
          }}
        />
        {errors.email && <div className={errorClasses}>{errors.email}</div>}
      </div>

      {/* Email OTP Verification for Doctor */}
      {formData.email && isEmailValid(formData.email) && (
        <EmailOTPVerification
          email={formData.email}
          onVerified={() => {
            setEmailVerified(true);
            setOtpError("");
            // Remove email error if it exists
            const newErrors = { ...errors };
            delete newErrors.email;
            setErrors(newErrors);
          }}
          onError={(error) => {
            setOtpError(error);
            setEmailVerified(false);
          }}
        />
      )}

      {otpError && <div className={errorClasses}>{otpError}</div>}
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorPasswordInput">Password</label>
        <input
          id="doctorPasswordInput"
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
        <label className={labelClasses} htmlFor="doctorConfirmPasswordInput">Confirm Password</label>
        <input
          id="doctorConfirmPasswordInput"
          type="password"
          className={inputClasses}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
        />
        {errors.confirmPassword && <div className={errorClasses}>{errors.confirmPassword}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorLicenseInput">License Number</label>
        <input
          id="doctorLicenseInput"
          type="text"
          className={inputClasses}
          placeholder="License Number"
          value={formData.licenseNumber}
          onChange={(e) => updateFormData({ licenseNumber: e.target.value })}
        />
        {errors.licenseNumber && <div className={errorClasses}>{errors.licenseNumber}</div>}
      </div>
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorSpecializationSelect">Specialization</label>
        <select
          id="doctorSpecializationSelect"
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
        <label className={labelClasses} htmlFor="doctorPhoneInput">Phone Number</label>
        <input
          id="doctorPhoneInput"
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
        <label className={labelClasses} htmlFor="doctorAgeInput">Age</label>
        <input
          id="doctorAgeInput"
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
        <label className={labelClasses} htmlFor="doctorGenderSelect">Gender</label>
        <select
          id="doctorGenderSelect"
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
      
  {/* State/city dropdowns removed: now only dynamic city/area search is used */}
      
      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorStateSelect">State</label>
        <select
          id="doctorStateSelect"
          className={inputClasses}
          value={formData.state}
          onChange={(e) => {
            updateFormData({ state: e.target.value, city: "", area: "" });
          }}
        >
          <option value="">Select State</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Kerala">Kerala</option>
          <option value="Andhra Pradesh">Andhra Pradesh</option>
          <option value="Telangana">Telangana</option>
        </select>
        {errors.state && <div className={errorClasses}>{errors.state}</div>}
      </div>

      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorCityInput">City</label>
        <input
          id="doctorCityInput"
          className={inputClasses}
          placeholder="Type city name"
          value={cityQuery}
          onChange={async (e) => {
            setCityQuery(e.target.value);
            await fetchCities(e.target.value);
          }}
          autoComplete="off"
          disabled={!formData.state}
        />
        {isLoadingCities && <div className="text-sm text-gray-500">Loading cities...</div>}
        <div className="relative">
          {cityResults.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
              {cityResults.map((city: any) => (
                <li
                  key={city.id}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    updateFormData({ city: city.text, area: "" });
                    setCityQuery(city.text);
                    setCityResults([]);
                  }}
                >
                  {city.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.city && <div className={errorClasses}>{errors.city}</div>}
      </div>

      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorAreaInput">Area/Locality</label>
        <input
          id="doctorAreaInput"
          className={inputClasses}
          placeholder="Type area/locality"
          value={areaQuery}
          onChange={async (e) => {
            setAreaQuery(e.target.value);
            await fetchAreas(e.target.value + (formData.city ? `,${formData.city}` : ""));
          }}
          autoComplete="off"
          disabled={!formData.city}
        />
        {isLoadingAreas && <div className="text-sm text-gray-500">Loading areas...</div>}
        <div className="relative">
          {areaResults.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
              {areaResults.map((area: any) => (
                <li
                  key={area.id}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    updateFormData({ area: area.text });
                    setAreaQuery(area.text);
                    setAreaResults([]);
                  }}
                >
                  {area.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.area && <div className={errorClasses}>{errors.area}</div>}
      </div>

      <div className="mb-4">
        <label className={labelClasses} htmlFor="doctorPincodeInput">Pincode</label>
        <div className="flex gap-2">
          <input
            id="doctorPincodeInput"
            type="text"
            className={inputClasses}
            placeholder="Pincode"
            value={formData.pincode}
            maxLength={6}
            onChange={(e) => {
              const pincode = e.target.value;
              updateFormData({ pincode });
              // Clear validation error when user starts typing
              if (errors.pincode) {
                setErrors({ ...errors, pincode: "" });
              }
              // Auto-validate pincode when 6 digits are entered
              if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
                validatePincodeLocation(pincode);
              }
            }}
          />
          <button
            type="button"
            className="px-4 py-2 bg-[#1669AE] text-white rounded-lg hover:bg-[#135a94] disabled:opacity-50"
            onClick={() => validatePincodeLocation(formData.pincode)}
            disabled={!formData.pincode || formData.pincode.length !== 6}
          >
            Verify
          </button>
        </div>
        {errors.pincode && <div className={errorClasses}>{errors.pincode}</div>}
      </div>
      
      {/* CAPTCHA Section */}
      <div className="mb-4 bg-gray-50 border rounded-md p-3">
        <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="doctorCaptchaInput">
          Verify you're human
        </label>
        
        {/* Audio CAPTCHA for accessibility */}
        <AudioCaptcha captchaText={captcha} className="mb-3" />
        
        <div className="flex items-center mb-2">
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-white border rounded font-mono tracking-widest text-lg select-none">
            <span>{captcha}</span>
            <span
              className="ml-2 text-[#1669AE] cursor-pointer"
              onClick={handleCaptchaRefresh}
              title="Refresh Captcha"
            >
              <FaSyncAlt />
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            className="flex-1 px-3 py-2 border rounded-l focus:ring-2 focus:ring-[#1669AE]"
            placeholder="Enter the code above"
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value);
              setCaptchaVerified(false);
            }}
            required
          />
          <button
            type="button"
            className={`px-4 py-2 rounded-r ${
              captchaVerified ? "bg-green-500" : "bg-[#1669AE]"
            } text-white`}
            onClick={handleCaptchaVerify}
            disabled={captchaVerified}
          >
            {captchaVerified ? "Verified" : "Verify"}
          </button>
        </div>
        {errors.captcha && <div className={errorClasses}>{errors.captcha}</div>}
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Verification Required
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>After submitting this form, you'll need to verify both your email address and phone number before your application is submitted for admin review.</p>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        type="submit" 
        className={nextButtonClasses}
      >
        Register as Doctor
      </button>
    </form>
  );
};

const Onboarding: React.FC = () => {
  // Dynamic city/area state for Mapbox API (must be inside component)
  const [cityQuery, setCityQuery] = React.useState("");
  const [cityResults, setCityResults] = React.useState<any[]>([]);
  const [areaQuery, setAreaQuery] = React.useState("");
  const [areaResults, setAreaResults] = React.useState<any[]>([]);
  const [isLoadingCities, setIsLoadingCities] = React.useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = React.useState(false);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.REACT_APP_MAPBOX_TOKEN || "";

  // Fetch cities dynamically using Mapbox
  const fetchCities = async (query: string) => {
    setIsLoadingCities(true);
    try {
      // Only search if state is selected
      if (!formData.state) {
        setCityResults([]);
        setIsLoadingCities(false);
        return;
      }
      // Query with city and state context for better filtering
      const searchQuery = query ? `${query}, ${formData.state}` : formData.state;
      const results = await fetchCitiesAndAreas(searchQuery, MAPBOX_TOKEN, 'place');
      // Filter to only cities in the selected state
      const filtered = results.filter(item => {
        // Check if state context is present in place_name
        return item.place_name && item.place_name.includes(formData.state);
      });
      // Deduplicate by city.text
      const unique = Array.from(
        new Map(filtered.map(item => [item.text, item])).values()
      );
      setCityResults(unique);
    } catch (e) {
      setCityResults([]);
    }
    setIsLoadingCities(false);
  };

  // Fetch areas dynamically using Mapbox
  const fetchAreas = async (query: string) => {
    setIsLoadingAreas(true);
    try {
      // Only search if city is selected
      if (!formData.city) {
        setAreaResults([]);
        setIsLoadingAreas(false);
        return;
      }
      // Query with area, city, and state context for best filtering
      const searchQuery = query ? `${query}, ${formData.city}, ${formData.state}` : `${formData.city}, ${formData.state}`;
      const results = await fetchCitiesAndAreas(searchQuery, MAPBOX_TOKEN, 'locality,neighborhood');
      // Filter to only areas in the selected city
      const filtered = results.filter(item => {
        // Check if city context is present in place_name
        return item.place_name && item.place_name.includes(formData.city);
      });
      // Deduplicate by area.text
      const unique = Array.from(
        new Map(filtered.map(item => [item.text, item])).values()
      );
      setAreaResults(unique);
    } catch (e) {
      setAreaResults([]);
    }
    setIsLoadingAreas(false);
  };
  const [role, setRole] = useState<"user" | "doctor" | "organization">("user");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showUserSuccess, setShowUserSuccess] = useState(false);
  const [showOrganizationSuccess, setShowOrganizationSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Fetch booked dates from Firebase to prevent double bookings
  useEffect(() => {
    const organizationBookingsRef = ref(db, 'organizationBookings');
    
    const unsubscribe = onValue(organizationBookingsRef, (snapshot) => {
      const data = snapshot.val();
      const bookedDatesSet = new Set<string>();
      
      if (data) {
        Object.values(data).forEach((booking: any) => {
          if (booking.preferredDate && booking.status !== 'cancelled') {
            bookedDatesSet.add(booking.preferredDate);
          }
        });
      }
      
      setBookedDates(bookedDatesSet);
    });

    return () => unsubscribe();
  }, []);

  const updateFormData = (data: Partial<typeof initialData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleCaptchaRefresh = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaVerified(false);
  };

  const handleCaptchaVerify = () => {
    const isVerified = captchaInput.trim() === captcha.trim();
    setCaptchaVerified(isVerified);
    if (!isVerified) {
      setError("CAPTCHA verification failed. Please try again.");
    } else {
      setError("");
    }
  };

  const handleDoctorFormSubmit = () => {
    // Validate doctor form first
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full Name required";
    if (!formData.email || !isEmailValid(formData.email))
      newErrors.email = "Valid email required";
    if (!emailVerified) newErrors.email = "Please verify your email address";
    if (!captchaVerified) newErrors.captcha = "Please verify CAPTCHA";
    if (!formData.password || !isPasswordValid(formData.password))
      newErrors.password = "Min 6 chars, 1 number or special character required";
    if (!formData.confirmPassword) 
      newErrors.confirmPassword = "Confirm Password required";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.licenseNumber) newErrors.licenseNumber = "License required";
    if (!formData.specialization) newErrors.specialization = "Specialization required";
    if (!formData.phone || !isPhoneValid(formData.phone))
      newErrors.phone = "10-digit phone required";
    if (!formData.age) newErrors.age = "Age required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.state) newErrors.state = "State required";
    if (!formData.city) newErrors.city = "City required";
    if (!formData.area) newErrors.area = "Area required";
    if (!formData.pincode) newErrors.pincode = "Pincode required";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Form is valid, proceed with registration
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Handle user registration
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await continueWithRegistration(userCredential);
    } catch (error: any) {
      console.error('User registration error:', error);
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrganizationFormSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Validate date constraints on backend
      if (formData.preferredDate) {
        const selectedDate = new Date(formData.preferredDate);
        const today = new Date();
        const minDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from today
        const maxDate = new Date(today.getTime() + 2 * 30 * 24 * 60 * 60 * 1000); // 2 months from today
        
        if (selectedDate < minDate) {
          setError(`You can only book after 2 days from today (starting from ${minDate.toLocaleDateString()})`);
          setIsSubmitting(false);
          return;
        }
        
        if (selectedDate > maxDate) {
          setError(`You can only book up to 2 months in advance (until ${maxDate.toLocaleDateString()})`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Check if the selected date is already booked
      if (formData.preferredDate && bookedDates.has(formData.preferredDate)) {
        setError("The selected date is already booked by another organization. Please choose a different date.");
        setIsSubmitting(false);
        return;
      }

      // Create organization booking data
      const organizationData = {
        type: 'organization_booking',
        contactPersonName: formData.fullName,
        organizationName: formData.organizationName,
        organizationType: formData.organizationType,
        designation: formData.designation,
        contactPhone: formData.organizationPhone,
        contactEmail: formData.organizationEmail,
        state: formData.state,
        city: formData.city,
        numberOfBeneficiaries: formData.numberOfBeneficiaries,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        requirement: formData.requirement,
        additionalNotes: formData.additionalNotes,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Save to Firebase database
      const organizationBookingsRef = ref(db, 'organizationBookings');
      const newBookingRef = push(organizationBookingsRef);
      await set(newBookingRef, {
        ...organizationData,
        id: newBookingRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log('Organization booking saved to Firebase with ID:', newBookingRef.key);

      // Send email notifications
      try {
        // Send notification to admin about organization booking
        await sendOrganizationBookingNotification(organizationData);
        console.log('Admin notification sent for organization booking');
        
        // Send confirmation email to the organization
        await sendOrganizationBookingConfirmation(organizationData);
        console.log('Confirmation email sent to organization');
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the submission if email fails, just log it
      }
      
      // Show success message
      setShowOrganizationSuccess(true);
      
    } catch (error: any) {
      console.error('Organization booking submission error:', error);
      setError('Failed to submit organization booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle password reset for existing emails
  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setError(`Password reset email sent to ${email}. Please check your inbox and follow the instructions to reset your password. After resetting, you can sign in with your new password.`);
    } catch (resetError: any) {
      console.error('Password reset error:', resetError);
      setError(`Failed to send password reset email: ${resetError.message}`);
    }
  };

  // Helper function to continue with registration after auth account is created
  const continueWithRegistration = async (userCredential: any) => {
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
      userData.status = "pending";
      userData.phoneVerified = false;
      userData.emailVerified = emailVerified;
    } else {
      userData.category = formData.category;
      userData.disabilityType = formData.disabilityType;
      userData.medicalConditions = formData.medicalConditions;
      userData.modeOfCare = formData.modeOfCare;
      userData.status = "active";
      userData.emailVerified = emailVerified;
      
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

    // Send registration success email to user
    try {
      await sendUserRegistrationSuccessEmail({
        email: formData.email,
        name: formData.fullName,
        username: formData.email.split('@')[0]
      });
      console.log('Registration success email sent to user');
    } catch (emailError) {
      console.error('Failed to send registration success email:', emailError);
    }

    // Send admin notification for new user registration (NOT just doctors)
    try {
      await sendNewUserRegistrationNotificationToAdmin({
        name: formData.fullName,
        email: formData.email,
        role: role,
        phone: formData.phone,
        location: `${formData.city}, ${formData.state}`,
        registrationDate: new Date().toISOString()
      });
      console.log('Admin notification sent for new user registration');
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    // Send WhatsApp welcome message
    try {
      const whatsappResult = await WhatsAppWelcomeService.sendUserWelcomeMessage({
        name: formData.fullName,
        phone: formData.phone,
        role: role === 'doctor' ? 'doctor' : 'user'
      });
      if (whatsappResult.success) {
        console.log('WhatsApp welcome message sent successfully:', whatsappResult.messageId);
      } else {
        console.warn('WhatsApp message failed:', whatsappResult.error);
      }
    } catch (whatsappError) {
      console.error('Error sending WhatsApp welcome message:', whatsappError);
    }

    if (role === "doctor") {
      // Send admin notification email for new doctor registration
      try {
        await sendNewDoctorRegistrationNotification(
          formData.fullName,
          formData.email,
          formData.specialization || 'General Dentistry',
          formData.licenseNumber || 'Not provided'
        );
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError);
      }

      // Send general admin notification for new user registration
      try {
        await sendNewUserRegistrationNotificationToAdmin({
          name: formData.fullName,
          email: formData.email,
          role: role,
          phone: formData.phone,
          location: `${formData.city}, ${formData.state}`,
          registrationDate: new Date().toLocaleDateString()
        });
        console.log('Admin notification sent for new doctor registration');
      } catch (emailError) {
        console.error('Failed to send admin notification for doctor registration:', emailError);
      }
      
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
    
    setIsSubmitting(false);
  };

  // Advanced solution: Try to sign in first, then decide what to do
  const handleEmailAlreadyInUse = async (): Promise<'allow_new_registration' | boolean> => {
    try {
      console.log('Checking if user can sign in with existing credentials...');
      
      // Try to sign in with the existing credentials
      const signInResult = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // If sign in succeeds, check if user exists in database
      const userRef = ref(db, `users/${signInResult.user.uid}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        console.log('User signed in successfully but no database record found. This account was deleted.');
        
        // Account was deleted - sign out and allow new registration
        await signOut(auth);
        
        setError('Your previous account was deleted. You can now register as a new user with this email. Please try registering again.');
        
        // Delete the Firebase Auth user to allow clean registration
        try {
          await deleteUser(signInResult.user);
          console.log('Deleted Firebase Auth record to allow clean registration');
        } catch (deleteError) {
          console.log('Could not delete auth record, but will proceed anyway:', deleteError);
        }
        
        return 'allow_new_registration'; // Signal that new registration should be allowed
      } else {
        // User exists in database too - redirect to login
        await signOut(auth);
        setError('Account already exists and is active. Please sign in instead.');
        return false;
      }
    } catch (signInError: any) {
      console.log('Sign in failed, checking why:', signInError.code);
      
      if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
        // Different password - this might be a different user wanting to use this email
        setError(`This email is registered with a different password. 

Options:
1. Use "Forgot Password" to reset your password if this is your account
2. Try signing in with your correct password  
3. Contact support if you believe this email should be available

Note: If an admin deleted your account, contact them to ensure complete removal.`);
      } else if (signInError.code === 'auth/user-not-found') {
        // This shouldn't happen in email-already-in-use scenario, but if it does, allow registration
        console.log('Unexpected: auth record not found despite email-already-in-use error');
        return 'allow_new_registration';
      } else {
        setError(`Unable to verify account status. Please try the "Forgot Password" option or contact support.`);
      }
      return false;
    }
  };

  const renderStep = () => {
    if (role === "user") {
      switch (step) {
        case 0:
          return renderUserBasicInfo({
            formData,
            updateFormData,
            nextStep: () => setStep(1),
            errors,
            setErrors,
            emailVerified,
            setEmailVerified,
            otpError,
            setOtpError,
            captcha,
            captchaInput,
            captchaVerified,
            setCaptchaInput,
            setCaptchaVerified,
            handleCaptchaRefresh,
            handleCaptchaVerify,
            cityQuery,
            setCityQuery,
            cityResults,
            isLoadingCities,
            fetchCities,
            areaQuery,
            setAreaQuery,
            areaResults,
            isLoadingAreas,
            fetchAreas,
            setCityResults,
            setAreaResults
          });
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
              onSubmit={handleSubmit}
              prevStep={() => setStep(5)}
              isSubmitting={isSubmitting}
            />
          );
        default:
          return <div>Invalid step</div>;
      }
    } else if (role === "doctor") {
      return renderDoctorCredentials(
        formData,
        updateFormData,
        handleDoctorFormSubmit,
        errors,
        setErrors,
        emailVerified,
        setEmailVerified,
        otpError,
        setOtpError,
        captcha,
        captchaInput,
        captchaVerified,
        setCaptchaInput,
        setCaptchaVerified,
        handleCaptchaRefresh,
        handleCaptchaVerify,
        cityQuery,
        setCityQuery,
        cityResults,
        isLoadingCities,
        fetchCities,
        areaQuery,
        setAreaQuery,
        areaResults,
        isLoadingAreas,
        fetchAreas,
        setCityResults,
        setAreaResults
      );
    } else if (role === "organization") {
      return renderOrganizationInfo(
        formData,
        updateFormData,
        handleOrganizationFormSubmit,
        errors,
        setErrors,
        emailVerified,
        setEmailVerified,
        otpError,
        setOtpError,
        captcha,
        captchaInput,
        captchaVerified,
        setCaptchaInput,
        setCaptchaVerified,
        handleCaptchaRefresh,
        handleCaptchaVerify,
        bookedDates,
        setError
      );
    }
    return <div>Invalid role</div>;
  };

  if (registrationSuccess) {
    return <DoctorRegistrationSuccess />;
  }

  if (showUserSuccess) {
    return (
      <UserRegistrationSuccess
        fullName={formData.fullName}
        onClose={() => navigate('/')}
      />
    );
  }

  if (showOrganizationSuccess) {
    return (
      <OrganizationRegistrationSuccess
        organizationName={formData.organizationName}
        onClose={() => navigate('/')}
      />
    );
  }

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
          className={tabClasses(role === "doctor")}
          onClick={() => {
            setRole("doctor");
            setStep(0);
            setErrors({});
          }}
        >
          <FaUserMd /> Doctor
        </button>
        <button
          className={tabClasses(role === "organization") + " rounded-r-lg"}
          onClick={() => {
            setRole("organization");
            setStep(0);
            setErrors({});
          }}
        >
          <FaBuilding /> Organization
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
          {(error.includes('Quick Fix Options') || 
            error.includes('email is already registered in our system')) && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => handleEmailAlreadyInUse()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
                disabled={isSubmitting}
              >
                🔧 Try Account Recovery (Automatic)
              </button>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handlePasswordReset(formData.email)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  disabled={isSubmitting}
                >
                  📧 Send Password Reset Email
                </button>
                <button
                  onClick={() => {
                    setError("");
                    navigate('/auth?mode=login');
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                >
                  Go to Login Page
                </button>
              </div>
            </div>
          )}
          {(error.includes('account with this email already exists') ||
            error.includes('Please sign in instead')) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setError("");
                  navigate('/auth?mode=login');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Go to Login Page
              </button>
            </div>
          )}
        </div>
      )}
      {renderStep()}
    </div>
  );
};

export default Onboarding;