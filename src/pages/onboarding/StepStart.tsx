import React from "react";

const StepStart = ({ nextStep }: { nextStep: () => void }) => (
  <div className="text-center">
    <h2 className="text-2xl font-bold mb-6">Welcome to Patient Onboarding</h2>
    <button
  className="px-6 py-2 rounded text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition"
  onClick={nextStep}
>
  Get Started
</button>

  </div>
);

export default StepStart;
