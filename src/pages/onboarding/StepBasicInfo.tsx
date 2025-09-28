import React, { useState, ChangeEvent, FormEvent } from "react";
import OtpVerification from "@/components/auth/OtpVerification";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getStates, getDistricts, getCities, getLocalities, getAreas } from '@/utils/locationUtils';

/**
 * Note: This component has been replaced with integrated OTP verification
 * in the main Onboarding.tsx file. This file is kept for reference but is no longer used.
 */
interface StepBasicInfoProps {
  data: any;
  updateData: (data: any) => void;
  nextStep: () => void;
}

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({ data, updateData, nextStep }) => {
  const [local, setLocal] = useState({
    fullName: data.fullName || "",
    age: data.age || "",
    gender: data.gender || "",
    phone: data.phone || "",
    state: data.state || "",
    district: data.district || "",
    city: data.city || "",
    locality: data.locality || "",
    area: data.area || "",
    pincode: data.pincode || "",
  });
  // Location dropdown state
  const [selectedState, setSelectedState] = useState(local.state || "");
  const [selectedDistrict, setSelectedDistrict] = useState(local.district || "");
  const [selectedCity, setSelectedCity] = useState(local.city || "");
  const [selectedLocality, setSelectedLocality] = useState(local.locality || "");
  const [selectedArea, setSelectedArea] = useState(local.area || "");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(data.phoneVerified || false);
  const [verificationError, setVerificationError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocal({ ...local, [name]: value });
    
    // Reset verification status if phone number changes
    if (name === "phone" && phoneVerified) {
      setPhoneVerified(false);
    }
  };

  const handleStartVerification = (e: FormEvent) => {
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

  const handleVerificationError = (error: string) => {
    setVerificationError(error);
  };

  const handleNext = (e: FormEvent) => {
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-medium" htmlFor="state-select">State *</label>
          <Select value={selectedState} onValueChange={(value) => {
            setSelectedState(value);
            setSelectedDistrict("");
            setSelectedCity("");
            setSelectedLocality("");
            setSelectedArea("");
            setLocal(l => ({ ...l, state: value, district: "", city: "", locality: "", area: "" }));
          }}>
            <SelectTrigger id="state-select">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {getStates().map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="district-select">District *</label>
          <Select value={selectedDistrict} onValueChange={(value) => {
            setSelectedDistrict(value);
            setSelectedCity("");
            setSelectedLocality("");
            setSelectedArea("");
            setLocal(l => ({ ...l, district: value, city: "", locality: "", area: "" }));
          }} disabled={!selectedState}>
            <SelectTrigger id="district-select">
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              {getDistricts(selectedState).map((district) => (
                <SelectItem key={district} value={district}>{district}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="city-select">City *</label>
          <Select value={selectedCity} onValueChange={(value) => {
            setSelectedCity(value);
            setSelectedLocality("");
            setSelectedArea("");
            setLocal(l => ({ ...l, city: value, locality: "", area: "" }));
          }} disabled={!selectedDistrict}>
            <SelectTrigger id="city-select">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {getCities(selectedState, selectedDistrict).map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block mb-1 font-medium" htmlFor="locality-select">Locality *</label>
          <Select value={selectedLocality} onValueChange={(value) => {
            setSelectedLocality(value);
            setSelectedArea("");
            setLocal(l => ({ ...l, locality: value, area: "" }));
          }} disabled={!selectedCity}>
            <SelectTrigger id="locality-select">
              <SelectValue placeholder="Select Locality" />
            </SelectTrigger>
            <SelectContent>
              {getLocalities(selectedState, selectedDistrict, selectedCity).map((locality) => (
                <SelectItem key={locality} value={locality}>{locality}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="area-select">Area *</label>
          <Select value={selectedArea} onValueChange={(value) => {
            setSelectedArea(value);
            setLocal(l => ({ ...l, area: value }));
          }} disabled={!selectedLocality}>
            <SelectTrigger id="area-select">
              <SelectValue placeholder="Select Area" />
            </SelectTrigger>
            <SelectContent>
              {getAreas(selectedState, selectedDistrict, selectedCity, selectedLocality).map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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
