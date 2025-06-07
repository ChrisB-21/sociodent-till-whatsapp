// import React, { useState } from "react";
// import Step1BasicInfo from "./Step1BasicInfo";
// import Step2Category from "./Step2Category";
// import Step3Disability from "./Step3Disability";
// import Step4Medical from "./Step4Medical";
// import Step5Preferences from "./Step5Preferences";
// import { FormData } from "./formData";

// export default function Onboarding() {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState<FormData>({
//     fullName: "",
//     age: "",
//     gender: "",
//     phone: "",
//     city: "",
//     state: "",
//     pincode: "",
//     category: "",
//     disabilityType: "",
//     disabilityOther: "",
//     medicalConditions: [],
//     medicalOther: "",
//     medications: "",
//     allergies: "",
//     modeOfCare: "",
//     consent: false,
//     terms: false,
//   });

//   const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
//   const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
//   const updateFormData = (newData: Partial<FormData>) =>
//     setFormData((prev) => ({ ...prev, ...newData }));

//   const handleSubmit = () => {
//     alert("Form submitted successfully!");
//     console.log("Form Data:", formData);
//     window.location.href = "/";
//   };

//   return (
//     <div className="max-w-lg mx-auto my-8 p-6 bg-white rounded-lg shadow">
//       <h1 className="text-2xl font-bold mb-6 text-center">Patient Onboarding</h1>
//       <div className="mb-6">
//         <div className="flex justify-between">
//           {[1, 2, 3, 4, 5].map((num) => (
//             <div key={num} className="text-center">
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
//                   step >= num
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-600"
//                 }`}
//               >
//                 {num}
//               </div>
//               <div className="text-xs">
//                 {num === 1 && "Info"}
//                 {num === 2 && "Category"}
//                 {num === 3 && "Disability"}
//                 {num === 4 && "Medical"}
//                 {num === 5 && "Preferences"}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       {step === 1 && (
//         <Step1BasicInfo
//           data={formData}
//           updateData={updateFormData}
//           nextStep={nextStep}
//         />
//       )}
//       {step === 2 && (
//         <Step2Category
//           data={formData}
//           updateData={updateFormData}
//           nextStep={nextStep}
//           prevStep={prevStep}
//         />
//       )}
//       {step === 3 && (
//         <Step3Disability
//           data={formData}
//           updateData={updateFormData}
//           nextStep={nextStep}
//           prevStep={prevStep}
//         />
//       )}
//       {step === 4 && (
//         <Step4Medical
//           data={formData}
//           updateData={updateFormData}
//           nextStep={nextStep}
//           prevStep={prevStep}
//         />
//       )}
//       {step === 5 && (
//         <Step5Preferences
//           data={formData}
//           updateData={updateFormData}
//           prevStep={prevStep}
//           onSubmit={handleSubmit}
//         />
//       )}
//     </div>
//   );
// }