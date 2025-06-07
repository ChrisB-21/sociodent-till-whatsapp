import React from 'react';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DoctorDocumentsFormProps {
  specialization: string;
  setSpecialization: (specialization: string) => void;
  experience: string;
  setExperience: (experience: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  licenseFile: File | null;
  setLicenseFile: React.Dispatch<React.SetStateAction<File | null>>;
  certificateFile: File | null;
  setCertificateFile: React.Dispatch<React.SetStateAction<File | null>>;
  idFile: File | null;
  setIdFile: React.Dispatch<React.SetStateAction<File | null>>;
  onBack: () => void;
}

const DoctorDocumentsForm: React.FC<DoctorDocumentsFormProps> = ({
  specialization,
  setSpecialization,
  experience,
  setExperience,
  bio,
  setBio,
  licenseFile,
  setLicenseFile,
  certificateFile,
  setCertificateFile,
  idFile,
  setIdFile,
  onBack,
}) => {
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
          Specialization
        </label>
        <select
          id="specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        >
          <option value="">Select Specialization</option>
          <option value="General">General</option>
          <option value="Oral Medicine">Oral Medicine</option>
          <option value="Orthodontics">Orthodontics</option>
          <option value="Pedodontics">Pedodontics</option>
          <option value="Periodontics">Periodontics</option>
          <option value="Endodontics">Endodontics</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
          Years of Experience
        </label>
        <Input
          type="text"
          id="experience"
          placeholder="e.g., 5 years"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Professional Bio
        </label>
        <Textarea
          id="bio"
          placeholder="Briefly describe your professional background and expertise..."
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="resize-none"
        />
      </div>
      
      <div>
        <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-1">
          Dental Council Certificate <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            type="file"
            id="license"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => handleFileChange(e, setLicenseFile)}
            required
          />
          <label
            htmlFor="license"
            className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            {licenseFile ? licenseFile.name : 'Upload your dental license'}
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">PDF or image files only</p>
      </div>
      
      <div>
        <label htmlFor="certificate" className="block text-sm font-medium text-gray-700 mb-1">
          Dental Certificate (BDS/MDS) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            type="file"
            id="certificate"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => handleFileChange(e, setCertificateFile)}
            required
          />
          <label
            htmlFor="certificate"
            className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            {certificateFile ? certificateFile.name : 'Upload your dental certificate'}
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">PDF or image files only</p>
      </div>
      
      <div>
        <label htmlFor="idFile" className="block text-sm font-medium text-gray-700 mb-1">
          Government-issued ID <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            type="file"
            id="idFile"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => handleFileChange(e, setIdFile)}
            required
          />
          <label
            htmlFor="idFile"
            className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            {idFile ? idFile.name : 'Upload your ID proof'}
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">PDF or image files only</p>
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        <FileText size={16} className="inline-block mr-1" />
        Your documents will be reviewed by our team within 2-3 business days.
      </p>
      
      <button
        type="button"
        className="flex items-center justify-center w-full text-sociodent-600 hover:text-sociodent-700 mb-2"
        onClick={onBack}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to credentials
      </button>
    </div>
  );
};

export default DoctorDocumentsForm;
