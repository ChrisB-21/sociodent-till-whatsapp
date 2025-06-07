import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  useEffect(() => {
    // Set page title
    document.title = 'Terms & Conditions - SocioDent';
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="container-custom mx-auto max-w-4xl">
        <div className="prose prose-lg prose-blue max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">SocioDent Terms & Conditions</h1>
        
        <p className="text-gray-600 mb-8">
          <strong>Effective Date:</strong> June 1, 2025<br />
          <strong>Contact:</strong> steward@sociodent.in
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
            <p className="text-gray-600">
              Welcome to SocioDent. By accessing or using our website, mobile app, or any SocioDent services (including 
              booking, consultation, product purchase, or support), you acknowledge and agree to abide by these Terms 
              & Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Services</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>SocioDent connects patients with licensed dentists for:
                <ul className="list-disc pl-6 mt-2">
                  <li>In-home dental care visits</li>
                  <li>Virtual/teleconsultations</li>
                  <li>Clinic-based dental appointments</li>
                  <li>Oral care product purchases</li>
                </ul>
              </li>
              <li>SocioDent provides technology, logistics (if required), and scheduling support, but does not 
                itself provide clinical dental care.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Eligibility and Onboarding</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li><strong>Patients:</strong> Must be at least 18 years old or be represented by a legal guardian/caregiver.</li>
              <li><strong>Dentists:</strong> Must hold a valid BDS or MDS degree and be registered with the Dental Council of 
                India.</li>
              <li>Dentists are required to provide all necessary certificates and documents, fully 
                cooperate during onboarding and periodic verifications, and may be asked to 
                undertake training/orientation sessions conducted by SocioDent.</li>
              <li>Dentists must comply with all requirements for professional and safe practice.</li>
              <li>Special care: Services are inclusive and accessible to the elderly, persons with disabilities, and 
                caregivers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Appointments & Payments</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>All appointments must be booked and, whenever possible, paid for directly through the 
                SocioDent platform.</li>
              <li>Charges and fees are set with the aim to remain reasonable and fair.</li>
              <li>SocioDent reserves the right to reschedule appointments due to emergencies or logistical 
                constraints.</li>
              <li>Payments are processed securely using trusted third-party payment gateways.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Conduct & Communication</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Dentists:</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Must at all times exhibit professionalism, good conduct, and respect.</li>
              <li>Must not collect any patient's personal contact information or arrange treatment, 
                follow-up, or solicit services outside the SocioDent platform.</li>
              <li>Must obtain valid informed consent from the patient (or their guardian/caregiver) 
                prior to initiating any dental procedure.</li>
            </ul>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Patients/Caregivers:</h3>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Must provide a safe, dignified, and hygienic environment for home visits.</li>
              <li>Must treat dental professionals with courtesy and respect.</li>
              <li>Any abuse, unprofessional conduct, or violation by either party can result in account 
                suspension or termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Medical/Clinical Indemnity & Responsibility</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>SocioDent facilitates connections between patients and dentists; it does not provide dental 
                care itself.</li>
              <li>Dentists are solely responsible for the quality, safety, and proper documentation (including 
                informed consent) of any treatment delivered.</li>
              <li>SocioDent is indemnified from any liabilities or claims arising from clinical procedures, 
                complications, or treatment outcomes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Intellectual Property</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>All content, branding, platform design, and materials on SocioDent are the exclusive property 
                of SocioDent and may not be copied, reproduced, or reused without explicit written 
                permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Fair Usage & Platform Integrity</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Abuse or misuse of SocioDent's services by any user (fake information, impersonation, fraud, 
                repeated cancellations, etc.) will result in moderation actions, up to account suspension or 
                permanent ban, at SocioDent's discretion.</li>
              <li>SocioDent may require verification, provide training, or request updated documentation 
                from users as part of continuous quality and compliance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Modifications to Terms</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>SocioDent may revise these Terms & Conditions from time to time. Major updates will be 
                communicated via the app or website.</li>
              <li>Continued use of SocioDent's services implies acceptance of the updated terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Legal Jurisdiction</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Any dispute or legal proceeding related to the use of SocioDent is subject to the exclusive 
                jurisdiction of the Courts in Chennai, India.</li>
            </ul>
          </section>

          <section>
            <p className="text-gray-600 mb-2">
              By clicking "I Agree" or by continuing to use the SocioDent platform, you acknowledge that you have read, 
              understood, and accepted these Terms & Conditions.
            </p>
            <p className="text-gray-600">
              If you have any questions or concerns regarding these Terms, please contact us at <Link to="mailto:steward@sociodent.in" className="text-blue-600 hover:underline">steward@sociodent.in</Link>.
            </p>
            <p className="text-gray-600 mt-4">
              Thank you for choosing SocioDent—committed to safe, inclusive, and quality dental care for all.
            </p>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;