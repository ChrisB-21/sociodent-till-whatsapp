import React from "react";
import OtpForm from "./OtpForm";
import DoctorDocumentsForm from "./DoctorDocumentsForm";
import { AuthFormState } from "@/hooks/useAuthForm";

interface AuthStepContainerProps {
  mode: string;
  role: string;
  formState: AuthFormState;
  setAuthType: (type: "email" | "phone") => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setPassword: (password: string) => void;
  setName: (name: string) => void;
  setOtp: (otp: string) => void;
  setIsCaptchaVerified: (verified: boolean) => void;
  setSpecialization: (specialization: string) => void;
  setExperience: (experience: string) => void;
  setBio: (bio: string) => void;
  setLicenseFile: (file: File | null) => void;
  setCertificateFile: (file: File | null) => void;
  setIdFile: (file: File | null) => void;
  handleBackFromOtp: () => void;
  handleBackFromDocuments: () => void;
}

const AuthStepContainer: React.FC<AuthStepContainerProps> = ({
  mode,
  role,
  formState,
  setAuthType,
  setEmail,
  setPhone,
  setPassword,
  setName,
  setOtp,
  setIsCaptchaVerified,
  setSpecialization,
  setExperience,
  setBio,
  setLicenseFile,
  setCertificateFile,
  setIdFile,
  handleBackFromOtp,
  handleBackFromDocuments,
}) => {
  if (formState.step === "credentials") {
    return (
      <div>
        <h2>Step 1: Credentials</h2>
        <p>
          The `CredentialsForm` component has been removed. Replace this with
          your custom implementation.
        </p>
        <form>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={formState.email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={formState.password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={formState.name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }

  if (formState.step === "otp") {
    return (
      <OtpForm
        otp={formState.otp}
        setOtp={setOtp}
        onBack={handleBackFromOtp}
        authType={formState.authType}
      />
    );
  }

  if (formState.step === "documents") {
    return (
      <DoctorDocumentsForm
        specialization={formState.specialization}
        setSpecialization={setSpecialization}
        experience={formState.experience}
        setExperience={setExperience}
        bio={formState.bio}
        setBio={setBio}
        licenseFile={formState.licenseFile}
        setLicenseFile={setLicenseFile}
        certificateFile={formState.certificateFile}
        setCertificateFile={setCertificateFile}
        idFile={formState.idFile}
        setIdFile={setIdFile}
        onBack={handleBackFromDocuments}
      />
    );
  }

  return null;
};

export default AuthStepContainer;