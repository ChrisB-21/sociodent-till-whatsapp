import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="container-custom mx-auto px-6 py-12 max-w-4xl">
      <div className="prose prose-lg prose-blue max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">SocioDent Privacy Policy</h1>
        
        <p className="text-gray-600 mb-8">
          <strong>Effective Date:</strong> June 1, 2025<br />
          <strong>Contact:</strong> steward@sociodent.in
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
            <p className="text-gray-600">
              At SocioDent, we are committed to protecting your privacy and safeguarding your personal and health 
              information. This Privacy Policy explains how we collect, use, disclose, and protect your information when 
              you use our website, mobile application, or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-2">A. For Patients</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Name, age, gender, contact details (phone number, email)</li>
              <li>Address and geolocation data (for home visits)</li>
              <li>Medical and dental history</li>
              <li>Uploaded files (e.g., prescriptions, X-rays)</li>
              <li>Payment information (processed securely by third parties—not stored by SocioDent)</li>
            </ul>
            <h3 className="text-xl font-medium text-gray-700 mb-2">B. For Dentists</h3>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Name, qualifications, registration/license details</li>
              <li>Contact information (phone number, email)</li>
              <li>Clinic address and availability schedule</li>
              <li>Certificates, documents, and specialization details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>To match you with suitable dental professionals and facilitate appointments</li>
              <li>To deliver, maintain, and personalize our services</li>
              <li>For communication, service updates, scheduling, and user support</li>
              <li>To comply with legal, regulatory, and ethical obligations</li>
              <li>To improve our platform and user experience through analytics (always anonymized)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Storage & Security</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>All data is encrypted both at rest and in transit using industry-standard protocols.</li>
              <li>Personal and health information is accessible only to authorized SocioDent staff, matched healthcare 
                providers, and necessary third-party service partners (e.g., payment gateways, logistics).</li>
              <li>We regularly review our security measures to protect your data from unauthorized access, alteration, 
                disclosure, or destruction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Sharing & Disclosure</h2>
            <p className="text-gray-600 mb-2">
              We do not sell or rent your personal data to third parties.
            </p>
            <p className="text-gray-600">
              Your information is shared only:
            </p>
            <ul className="list-disc pl-6 text-gray-600">
              <li>With matched dentists or care professionals for the explicit purpose of providing care</li>
              <li>With labs, pharmacies, or logistics partners strictly for fulfilling orders/services, and always with your 
                consent when needed</li>
              <li>With law enforcement or regulatory authorities, but only if legally required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. User Rights</h2>
            <p className="text-gray-600 mb-2">
              You are entitled to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-2">
              <li>Access, review, and edit your profile and medical information</li>
              <li>Request deletion of your personal data by contacting us at steward@sociodent.in</li>
            </ul>
            <p className="text-gray-600">
              We will respond to data deletion or access requests within 15 business days, except where retention is 
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Cookies, Analytics & Tracking</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Our website and mobile app may use cookies or similar technologies to enhance your experience, 
                understand how the platform is used, and for basic analytics.</li>
              <li>You can adjust your device or browser settings to disable cookies, although this may affect certain platform 
                functions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Data Retention</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>We retain your information only as long as necessary to fulfill the purposes described in this policy and to 
                comply with legal obligations.</li>
              <li>Data may be anonymized and retained for statistical or regulatory reasons, in which case it will no longer be 
                linked to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Children's Privacy</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>SocioDent does not knowingly collect information from children under 18 without consent from a parent, 
                guardian, or legal caregiver.</li>
              <li>If you believe a minor's information has been provided without such consent, please contact us 
                immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Policy Updates</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>SocioDent may update or revise this Privacy Policy from time to time. Major changes will be communicated 
                via our app or website.</li>
              <li>Continued use of our services after any changes implies your acceptance of the revised policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Contact Us</h2>
            <p className="text-gray-600 mb-2">
              If you have any questions, requests, or concerns about this Privacy Policy or your personal information, 
              please contact us at <Link to="mailto:steward@sociodent.in" className="text-blue-600 hover:underline">steward@sociodent.in</Link>
            </p>
            <p className="text-gray-600">
              By using SocioDent's services, you agree to the terms outlined in this Privacy Policy. Please review this 
              policy regularly and reach out if you have any questions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;