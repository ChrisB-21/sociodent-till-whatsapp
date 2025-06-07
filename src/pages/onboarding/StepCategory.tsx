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
    updateData({ category });
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
            required
          />
          <span className="ml-2">{cat}</span>
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

export default StepCategory;
