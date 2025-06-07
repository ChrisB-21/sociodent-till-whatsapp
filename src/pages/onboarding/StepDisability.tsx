import React, { useState } from "react";

const disabilities = [
  "No Disability",
  "Physical Disability",
  "Intellectual Disability",
  "Others"
];

const StepDisability = ({ data, updateData, nextStep, prevStep }) => {
  const [local, setLocal] = useState({
    disabilityType: data.disabilityType || "",
    disabilityOther: data.disabilityOther || "",
  });

  const handleChange = (e) => {
    setLocal({ ...local, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    updateData(local);
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>Type of Disability (if applicable):</div>
      <select name="disabilityType" value={local.disabilityType} onChange={handleChange} className="w-full border rounded px-3 py-2">
        <option value="">Select</option>
        {disabilities.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      {local.disabilityType === "Others" && (
        <input
          name="disabilityOther"
          placeholder="Please specify"
          value={local.disabilityOther}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      )}
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded">Back</button>
        <button className='bg-[#0e5d9f] text-white px-4 py-2 rounded mx-auto block'>
  Next
</button>


      </div>
    </form>
  );
};

export default StepDisability;
