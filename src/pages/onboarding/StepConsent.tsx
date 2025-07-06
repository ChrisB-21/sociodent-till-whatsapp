import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import Image from "next/image";

const StepConsent = ({
  data,
  updateData,
  nextStep,
  prevStep,
  hideNext = false,
}) => {
  const [local, setLocal] = useState({
    consent: data.consent || false,
    terms: data.terms || false,
  });
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  const handleChange = (e) => {
    setLocal({ ...local, [e.target.name]: e.target.checked });
  };

  const handleNext = (e) => {
    e.preventDefault();
    updateData(local);
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <label className="block">
        <input
          type="checkbox"
          name="consent"
          checked={local.consent}
          onChange={handleChange}
          required
        />
        <span className="ml-2">Consent for Teleconsultation or Homecare</span>
      </label>
      <label className="block">
        <input
          type="checkbox"
          name="terms"
          checked={local.terms}
          onChange={handleChange}
          required
        />
        <span className="ml-2">
          Accept{" "}
          <button
            type="button"
            onClick={() => setOpenTerms(true)}
            className="text-[#0e5d9f] underline hover:text-[#0a4a7f]"
          >
            Terms & Conditions
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => setOpenPrivacy(true)}
            className="text-[#0e5d9f] underline hover:text-[#0a4a7f]"
          >
            Privacy Policy
          </button>
        </span>
      </label>

      {/* Terms & Conditions Modal */}
      <Dialog open={openTerms} onOpenChange={setOpenTerms}>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              {/* <Image
                src="/sociodent-logo.png" // Replace with your actual logo path
                alt="SocioDent Logo"
                width={150}
                height={50}
              /> */}
            </div>
            <DialogTitle className="text-center mb-4">
              SocioDent Terms & Conditions
            </DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none">
            <p className="text-center mb-6">
              Contact: <a href="mailto:steward@sociodent.in">steward@sociodent.in</a>
            </p>
            
            <h3>1. Introduction</h3>
            <p>
              Welcome to SocioDent. By accessing or using our website, mobile app, or any SocioDent services (including 
              booking, consultation, product purchase, or support), you acknowledge and agree to abide by these Terms 
              & Conditions.
            </p>

            <h3>2. Services</h3>
            <ul>
              <li>SocioDent connects patients with licensed dentists for:</li>
              <li>In-home dental care visits</li>
              <li>Virtual/teleconsultations</li>
              <li>Clinic-based dental appointments</li>
              <li>Oral care product purchases</li>
              <li>SocioDent provides technology, logistics (if required), and scheduling support, but does not 
              itself provide clinical dental care.</li>
            </ul>

            <h3>3. User Eligibility and Onboarding</h3>
            <ul>
              <li>Patients: Must be at least 18 years old or be represented by a legal guardian/caregiver.</li>
              <li>Dentists: Must hold a valid BDS or MDS degree and be registered with the Dental Council of 
              India.</li>
              <li>Dentists are required to provide all necessary certificates and documents, fully 
              cooperate during onboarding and periodic verifications, and may be asked to 
              undertake training/orientation sessions conducted by SocioDent.</li>
              <li>Dentists must comply with all requirements for professional and safe practice.</li>
              <li>Special care: Services are inclusive and accessible to the elderly, persons with disabilities, and 
              caregivers.</li>
            </ul>

            {/* Continue with the rest of the Terms & Conditions content */}
            {/* ... */}

            <p className="mt-6">
              By clicking "I Agree" or by continuing to use the SocioDent platform, you acknowledge that you have read, 
              understood, and accepted these Terms & Conditions.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={openPrivacy} onOpenChange={setOpenPrivacy}>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              {/* <Image
                src="/sociodent-logo.png" // Replace with your actual logo path
                alt="SocioDent Logo"
                width={150}
                height={50}
              /> */}
            </div>
            <DialogTitle className="text-center mb-4">
              SocioDent Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none">
            <p className="text-center mb-6">
              Contact: <a href="mailto:steward@sociodent.in">steward@sociodent.in</a>
            </p>
            
            <h3>1. Introduction</h3>
            <p>
              At SocioDent, we are committed to protecting your privacy and safeguarding your personal and health 
              information. This Privacy Policy explains how we collect, use, disclose, and protect your information when 
              you use our website, mobile application, or services.
            </p>

            <h3>2. Information We Collect</h3>
            <h4>A. For Patients</h4>
            <ul>
              <li>Name, age, gender, contact details (phone number, email)</li>
              <li>Address and geolocation data (for home visits)</li>
              <li>Medical and dental history</li>
              <li>Uploaded files (e.g., prescriptions, X-rays)</li>
              <li>Payment information (processed securely by third parties—not stored by SocioDent)</li>
            </ul>

            <h4>B. For Dentists</h4>
            <ul>
              <li>Name, qualifications, registration/license details</li>
              <li>Contact information (phone number, email)</li>
              <li>Clinic address and availability schedule</li>
              <li>Certificates, documents, and specialization details</li>
            </ul>

            <h3>3. How We Use Your Information</h3>
            <ul>
              <li>To match you with suitable dental professionals and facilitate appointments</li>
              <li>To deliver, maintain, and personalize our services</li>
              <li>For communication, service updates, scheduling, and user support</li>
              <li>To comply with legal, regulatory, and ethical obligations</li>
              <li>To improve our platform and user experience through analytics (always anonymized)</li>
            </ul>

            {/* Continue with the rest of the Privacy Policy content */}
            {/* ... */}

            <p className="mt-6">
              By using SocioDent's services, you agree to the terms outlined in this Privacy Policy. Please review this 
              policy regularly and reach out if you have any questions.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between mt-6">
        {prevStep && (
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 bg-gray-300 rounded text-gray-700 font-semibold"
          >
            Back
          </button>
        )}
        {!hideNext && (
          <button
            type="submit"
            className="bg-[#0e5d9f] text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </form>
  );
};

export default StepConsent;