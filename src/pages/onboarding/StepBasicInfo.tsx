import React, { useState } from "react";
import OtpVerification from "@/components/auth/OtpVerification";

/**
 * Note: This component has been replaced with integrated OTP verification
 * in the main Onboarding.tsx file. This file is kept for reference but is no longer used.
 */
const StepBasicInfo = ({ data, updateData, nextStep }) => {  const [local, setLocal] = useState({
    fullName: data.fullName || "",
    age: data.age || "",
    gender: data.gender || "",
    phone: data.phone || "",
    city: data.city || "",
    state: data.state || "",
    pincode: data.pincode || "",
    area: data.area || "",
  });
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(data.phoneVerified || false);
  const [verificationError, setVerificationError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocal({ ...local, [name]: value });
    
    // Reset verification status if phone number changes
    if (name === "phone" && phoneVerified) {
      setPhoneVerified(false);
    }
  };

  const handleStartVerification = (e) => {
    e.preventDefault();
    
    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(local.phone)) {
      setVerificationError("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    
    setVerificationError("");
    setShowOtpVerification(true);
  };

  const handleVerificationSuccess = () => {
    setPhoneVerified(true);
    setShowOtpVerification(false);
  };

  const handleVerificationCancel = () => {
    setShowOtpVerification(false);
  };

  const handleVerificationError = (error) => {
    setVerificationError(error);
  };

  const handleNext = (e) => {
    e.preventDefault();
    
    // Validate phone verification
    if (!phoneVerified) {
      setVerificationError("Please verify your phone number before proceeding");
      return;
    }
      updateData({...local, phoneVerified: true});
    nextStep();
  };
  return (
    <form onSubmit={handleNext} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Basic Demographic Information</h2>
      <input name="fullName" placeholder="Full Name" value={local.fullName} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      <input name="age" placeholder="Age" type="number" value={local.age} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      <select name="gender" value={local.gender} onChange={handleChange} required className="w-full border rounded px-3 py-2">
        <option value="">Select Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      
      {/* Phone input with verification */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input 
            name="phone" 
            placeholder="Phone Number (10 digits)" 
            value={local.phone} 
            onChange={handleChange} 
            required 
            className="flex-1 border rounded px-3 py-2" 
          />
          <button
            type="button"
            onClick={handleStartVerification}
            disabled={!local.phone || phoneVerified}
            className={`px-3 py-2 rounded text-white font-medium ${
              phoneVerified 
                ? "bg-green-500" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {phoneVerified ? "Verified ✓" : "Verify"}
          </button>
        </div>
        
        {verificationError && (
          <p className="text-red-500 text-sm">{verificationError}</p>
        )}
        
        {showOtpVerification && (
          <div className="mt-4 border rounded-lg p-4 bg-gray-50">
            <OtpVerification
              phoneNumber={local.phone}
              onVerified={handleVerificationSuccess}
              onCancel={handleVerificationCancel}
              onError={handleVerificationError}
            />
          </div>
        )}
      </div>
      
      <input name="city" placeholder="City" value={local.city} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      <input name="state" placeholder="State" value={local.state} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      <input name="area" placeholder="Area/Locality" value={local.area} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      <input name="pincode" placeholder="Pincode" value={local.pincode} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      <button
        type="submit"
        className="w-full px-6 py-2 rounded text-white font-semibold hover:brightness-90 transition"
        style={{ backgroundColor: "#0e5d9f" }}
      >
        Next
      </button>
    </form>
  );
};

export default StepBasicInfo;
