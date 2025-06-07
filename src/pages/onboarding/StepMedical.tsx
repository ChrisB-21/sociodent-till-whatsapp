import React, { useState } from "react";

const conditionsList = [
   "None/Nothing",
  "Diabetes",
  "Hypertension",
  "Blood Disorders",
  "Others"
];

const StepMedical = ({ data, updateData, nextStep, prevStep }) => {
  const [local, setLocal] = useState({
    medicalConditions: data.medicalConditions || [],
    medicalOther: data.medicalOther || "",
    medications: data.medications || "",
    allergies: data.allergies || "",
  });

  const handleCheckbox = (cond) => {
    setLocal((prev) => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(cond)
        ? prev.medicalConditions.filter(c => c !== cond)
        : [...prev.medicalConditions, cond]
    }));
  };

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
      <div>Existing Medical Conditions:</div>
      {conditionsList.map(cond => (
        <label key={cond} className="block">
          <input
            type="checkbox"
            checked={local.medicalConditions.includes(cond)}
            onChange={() => handleCheckbox(cond)}
          />
          <span className="ml-2">{cond}</span>
        </label>
      ))}
      {local.medicalConditions.includes("Others") && (
        <input
          name="medicalOther"
          placeholder="Please specify"
          value={local.medicalOther}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      )}
      <input
        name="medications"
        placeholder="Current Medications"
        value={local.medications}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      />
      <input
        name="allergies"
        placeholder="Known Allergies"
        value={local.allergies}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      />
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded">Back</button>
        <button className='bg-[#0e5d9f] text-white px-4 py-2 rounded mx-auto block'>
  Next
</button>

      </div>
    </form>
  );
};

export default StepMedical;
