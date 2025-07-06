import React, { useState } from 'react';

interface FileData {
  prescriptions?: File;
  xrays?: File;
  profilePhoto?: File;
}

interface StepOptionalProps {
  data: any;
  updateData: (data: Partial<FileData>) => void;
  prevStep: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const ACCEPTED_FILE_TYPES = {
  prescriptions: '.pdf,.jpg,.jpeg',
  xrays: '.jpg,.jpeg,.png',
  profilePhoto: '.jpg,.jpeg,.png'
};

const StepOptional: React.FC<StepOptionalProps> = ({
  data,
  updateData,
  prevStep,
  onSubmit,
  isSubmitting = false
}) => {
  const handleSkipAndFinish = () => {
    // Skip file uploads and proceed to finish registration
    onSubmit();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof FileData) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const acceptedTypes = ACCEPTED_FILE_TYPES[field].split(',');
      if (!acceptedTypes.some(type => file.name.endsWith(type.replace('.', '')))) {
        alert(`Please upload a ${ACCEPTED_FILE_TYPES[field]} file`);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      updateData({ [field]: file });
    }
  };

  const fileInputs: { label: string; field: keyof FileData }[] = [
    { label: 'Previous Prescriptions (PDF/JPG)', field: 'prescriptions' },
    { label: 'Dental X-rays (JPG/PNG)', field: 'xrays' },
    { label: 'Profile Photo', field: 'profilePhoto' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Optional Information</h2>
        <p className="text-gray-500">Step 7 of 7: Additional Documents</p>
      </div>

      <div className="space-y-4">
        {fileInputs.map(({ label, field }) => (
          <div key={field}>
            <label className="block mb-2 font-medium text-gray-700">
              {label}
            </label>
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES[field]}
              onChange={(e) => handleFileChange(e, field)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Finish Registration'
          )}
        </button>
      </div>
    </div>
  );
};

export default StepOptional;