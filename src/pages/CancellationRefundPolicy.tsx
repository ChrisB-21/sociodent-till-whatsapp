import React, { useEffect } from 'react';

const CancellationRefundPolicy = () => {
  useEffect(() => {
    // Set page title
    document.title = 'Cancellation & Refund Policy - SocioDent';
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="container-custom mx-auto max-w-4xl">
        <div className="prose prose-lg prose-blue max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">SocioDent Cancellation & Refund Policy</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> May 15, 2025<br />
            <strong>Contact:</strong> support@sociodent.in
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Consultation Cancellation Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">1.1 Virtual Consultations</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Cancellations made <strong>24 hours or more</strong> before the scheduled appointment: Full refund</li>
                <li>Cancellations made <strong>less than 24 hours</strong> before the scheduled appointment: 50% refund</li>
                <li>No-shows: No refund</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">1.2 Home Visit Consultations</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Cancellations made <strong>48 hours or more</strong> before the scheduled appointment: Full refund</li>
                <li>Cancellations made <strong>24-48 hours</strong> before the scheduled appointment: 75% refund</li>
                <li>Cancellations made <strong>less than 24 hours</strong> before the scheduled appointment: 50% refund</li>
                <li>No-shows: No refund</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">1.3 Clinic Consultations</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Cancellations made <strong>24 hours or more</strong> before the scheduled appointment: Full refund</li>
                <li>Cancellations made <strong>less than 24 hours</strong> before the scheduled appointment: 50% refund</li>
                <li>No-shows: No refund</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Product Return & Refund Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">2.1 Return Eligibility</h3>
              <p className="text-gray-600 mb-4">
                Most items purchased from SocioDent can be returned within 7 days of delivery, provided that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>The product is unused, undamaged, and in its original packaging</li>
                <li>The product is not opened (for hygiene products and medical items)</li>
                <li>The product is not on our list of non-returnable items</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">2.2 Non-Returnable Items</h3>
              <p className="text-gray-600 mb-4">
                For hygiene and safety reasons, the following items cannot be returned:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Personal hygiene products once opened</li>
                <li>Custom-made dental appliances</li>
                <li>Prescription medications</li>
                <li>Items marked as non-returnable on the product page</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">2.3 Refund Process</h3>
              <p className="text-gray-600 mb-4">
                Once we receive and inspect your return, we will notify you of the approval or rejection of your refund.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Approved refunds will be processed within 5-7 business days</li>
                <li>Refunds will be credited back to the original payment method</li>
                <li>Shipping charges are non-refundable unless there was an error on our part</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Shipping Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">3.1 Shipping Timeframes</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Standard shipping: 3-5 business days</li>
                <li>Express shipping: 1-2 business days (additional charges apply)</li>
                <li>Orders are processed within 24 hours of placement</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">3.2 Shipping Costs</h3>
              <p className="text-gray-600 mb-4">
                Shipping costs are calculated based on the delivery location, package weight, and selected shipping method.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Free standard shipping on orders above ₹999</li>
                <li>Standard shipping fee: ₹99 - ₹199 (based on location)</li>
                <li>Express shipping fee: ₹199 - ₹399 (based on location)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about our cancellation, refund, or shipping policies, please contact us at:
              </p>
              <ul className="list-none text-gray-600">
                <li><strong>Email:</strong> <a href="mailto:support@sociodent.in" className="text-teal-700 hover:underline">support@sociodent.in</a></li>
                <li><strong>Phone:</strong> +91 9876543210</li>
                <li><strong>Address:</strong> SocioDent Private Limited, ITM Research Park, No. 11A, Door, Taramani Road, Chennai - 600113</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 pt-8 mt-8">
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <a 
                  href="/SocioDent-Refunds-Cancellation-Policy.pdf" 
                  download="SocioDent-Refunds-Cancellation-Policy.pdf"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
