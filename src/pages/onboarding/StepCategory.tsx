import React, { useState } from "react";

const categories = [
  
  "Dependent Elderly",
  "Child with Disability",
  "Adult with Disability",
  "Hospitalized/Bedridden Individual",
  "Parent/Caregivers of Dependent Individuals",
  "Individual Without Disability (Adult/Child)"
];

const StepCategory = ({ data, updateData, nextStep, prevStep }) => {
  const [category, setCategory] = useState(data.category || "");

  const handleNext = (e) => {
    e.preventDefault();
    if (!category) {
      alert("Please select a category before proceeding.");
      return;
    }
    updateData({ category });
    nextStep();
  };

  const handleSkip = (e) => {
    e.preventDefault();
    // Skip category selection and proceed to next step without updating data
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>Select Category:</div>
      {categories.map(cat => (
        <label key={cat} className="block">
          <input
            type="radio"
            name="category"
            value={cat}
            checked={category === cat}
            onChange={(e) => setCategory(e.target.value)}
          />
          <span className="ml-2">{cat}</span>
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

export default StepCategory;
