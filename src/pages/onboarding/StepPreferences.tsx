import React, { useState } from "react";

const modes = ["Home Visit", "Video Consultation", "Clinic Visit"];

const StepPreferences = ({ data, updateData, nextStep, prevStep }) => {
  const [modeOfCare, setModeOfCare] = useState(data.modeOfCare || "");

  const handleNext = (e) => {
    e.preventDefault();
    if (!modeOfCare) {
      alert("Please select a preferred mode of care before proceeding.");
      return;
    }
    updateData({ modeOfCare });
    nextStep();
  };

  const handleSkip = (e) => {
    e.preventDefault();
    // Skip preferences and proceed to next step without updating data
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>Preferred Mode of Care:</div>
      {modes.map(mode => (
        <label key={mode} className="block">
          <input
            type="radio"
            name="modeOfCare"
            value={mode}
            checked={modeOfCare === mode}
            onChange={() => setModeOfCare(mode)}
            required={false}
          />
          <span className="ml-2">{mode}</span>
        </label>
      ))}
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded">Back</button>
        <button type="button" onClick={handleSkip} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Skip</button>
        <button className='bg-[#0e5d9f] text-white px-4 py-2 rounded hover:bg-blue-700'>
          Next
        </button>
      </div>
    </form>
  );
};

export default StepPreferences;
