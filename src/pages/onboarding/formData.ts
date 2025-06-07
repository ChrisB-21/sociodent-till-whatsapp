// Types for different roles
export type UserRole = 'patient' | 'doctor' | 'admin';

// Base interface for common fields
export interface BaseFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: {
    city: string;
    state: string;
    pincode: string;
    area: string;
  };
  profilePhoto?: File;
}

// Patient specific fields
export interface PatientFormData extends BaseFormData {
  role: 'patient';
  age: string;
  gender: string;
  category: string;
  disabilityType: string;
  disabilityOther: string;
  medicalConditions: string[];
  medicalOther: string;
  medications: string;
  allergies: string;
  modeOfCare: string;
  consent: boolean;
  terms: boolean;
}

// Doctor specific fields
export interface DoctorFormData extends BaseFormData {
  role: 'doctor';
  degree: string;
  college: string;
  graduationYear: string;
  registrationNumber: string;
  specialization: string;
  experienceYears: string;
  certificates: File[];
  clinicDetails: {
    name: string;
    address: string;
  };
  professionalMemberships: string[];
  languages: string[];
  bio: string;
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
}

// Admin specific fields
export interface AdminFormData extends BaseFormData {
  role: 'admin';
  designation: string;
  qualification: string;
  experienceYears: string;
  officeDetails: {
    name: string;
    address: string;
  };
  idProof: File;
  skills: string[];
}

// Combined type for all possible form data
export type FormData = PatientFormData | DoctorFormData | AdminFormData;

// Constants and options
export const categories = [
  "Dependent Elderly",
  "Child with Disability",
  "Adult with Disability",
  "Hospitalized/Bedridden Individual",
  "Parent/Caregivers of Dependent Individuals",
  "Individual Without Known Disability (Adult/Child)",
];

export const disabilityTypes = [
  "Physical Disability",
  "Intellectual Disability",
  "Others",
];

export const medicalConditions = [
  "Diabetes",
  "Hypertension",
  "Blood Disorders",
  "Others",
];

export const modesOfCare = [
  "Home Visit",
  "Video Consultation",
  "Clinic Visit",
];

export const specializations = [
  "General Dentistry",
  "Orthodontics",
  "Periodontics",
  "Endodontics",
  "Pediatric Dentistry",
  "Oral Surgery",
  "Prosthodontics",
];

export const adminRoles = [
  "Office Manager",
  "Receptionist",
  "Administrative Assistant",
  "System Administrator",
];

export const languages = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Marathi",
  "Gujarati",
];

// Initial form data
export const getInitialFormData = (role: UserRole): FormData => {
  const baseData = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    address: {
      city: '',
      state: '',
      pincode: '',
      area: '',
    },
  };

  switch (role) {
    case 'patient':
      return {
        ...baseData,
        role: 'patient',
        age: '',
        gender: '',
        category: '',
        disabilityType: '',
        disabilityOther: '',
        medicalConditions: [],
        medicalOther: '',
        medications: '',
        allergies: '',
        modeOfCare: '',
        consent: false,
        terms: false,
      };
    
    case 'doctor':
      return {
        ...baseData,
        role: 'doctor',
        degree: '',
        college: '',
        graduationYear: '',
        registrationNumber: '',
        specialization: '',
        experienceYears: '',
        certificates: [],
        clinicDetails: {
          name: '',
          address: '',
        },
        professionalMemberships: [],
        languages: [],
        bio: '',
        availability: {
          days: [],
          hours: {
            start: '',
            end: '',
          },
        },
      };
    
    case 'admin':
      return {
        ...baseData,
        role: 'admin',
        designation: '',
        qualification: '',
        experienceYears: '',
        officeDetails: {
          name: '',
          address: '',
        },
        idProof: null as unknown as File,
        skills: [],
      };
  }
};