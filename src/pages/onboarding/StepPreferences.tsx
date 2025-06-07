import React, { useState } from "react";

const modes = ["Home Visit", "Video Consultation", "Clinic Visit"];

const StepPreferences = ({ data, updateData, nextStep, prevStep }) => {
  const [modeOfCare, setModeOfCare] = useState(data.modeOfCare || "");

  const handleNext = (e) => {
    e.preventDefault();
    updateData({ modeOfCare });
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
            required
          />
          <span className="ml-2">{mode}</span>
        </label>
      ))}
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded">Back</button>
        <button className='bg-[#0e5d9f] text-white px-4 py-2 rounded mx-auto block'>
  Next
</button>


      </div>
    </form>
  );
};

export default StepPreferences;
