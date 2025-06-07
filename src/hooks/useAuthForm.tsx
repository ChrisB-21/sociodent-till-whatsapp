
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface AuthFormState {
  isLoading: boolean;
  step: 'credentials' | 'otp' | 'documents';
  authType: 'email' | 'phone';
  email: string;
  phone: string;
  password: string;
  name: string;
  otp: string;
  isCaptchaVerified: boolean;
  specialization: string;
  experience: string;
  bio: string;
  licenseFile: File | null;
  certificateFile: File | null;
  idFile: File | null;
}

interface UseAuthFormProps {
  mode: string;
  role: string;
}

export const useAuthForm = ({ mode, role }: UseAuthFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formState, setFormState] = useState<AuthFormState>({
    isLoading: false,
    step: 'credentials',
    authType: 'email',
    email: '',
    phone: '',
    password: '',
    name: '',
    otp: '',
    isCaptchaVerified: false,
    specialization: '',
    experience: '',
    bio: '',
    licenseFile: null,
    certificateFile: null,
    idFile: null,
  });

  const updateFormState = (updates: Partial<AuthFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const setAuthType = (type: 'email' | 'phone') => updateFormState({ authType: type });
  const setEmail = (email: string) => updateFormState({ email });
  const setPhone = (phone: string) => updateFormState({ phone });
  const setPassword = (password: string) => updateFormState({ password });
  const setName = (name: string) => updateFormState({ name });
  const setOtp = (otp: string) => updateFormState({ otp });
  const setIsCaptchaVerified = (isCaptchaVerified: boolean) => updateFormState({ isCaptchaVerified });
  const setSpecialization = (specialization: string) => updateFormState({ specialization });
  const setExperience = (experience: string) => updateFormState({ experience });
  const setBio = (bio: string) => updateFormState({ bio });
  const setLicenseFile = (licenseFile: File | null) => updateFormState({ licenseFile });
  const setCertificateFile = (certificateFile: File | null) => updateFormState({ certificateFile });
  const setIdFile = (idFile: File | null) => updateFormState({ idFile });

  const handleBackFromOtp = () => updateFormState({ step: 'credentials' });
  const handleBackFromDocuments = () => updateFormState({ step: 'credentials' });

  const validateCredentials = () => {
    if (mode === 'signup' && !formState.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return false;
    }
    
    if (formState.authType === 'email' && !formState.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return false;
    }
    
    if (formState.authType === 'phone' && !formState.phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return false;
    }
    
    if (formState.authType === 'email' && !formState.password.trim()) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive"
      });
      return false;
    }

    if (!formState.isCaptchaVerified) {
      toast({
        title: "Error",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateOtp = () => {
    if (!formState.otp || formState.otp.length < 4) {
      toast({
        title: "Error",
        description: "Please enter a valid verification code",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateDocuments = () => {
    if (!formState.specialization || !formState.experience) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formState.licenseFile || !formState.certificateFile || !formState.idFile) {
      toast({
        title: "Error",
        description: "Please upload all required documents",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleCredentialSubmit = () => {
    if (!validateCredentials()) return;

    updateFormState({ isLoading: true });

    setTimeout(() => {
      updateFormState({ isLoading: false });
      
      if (formState.authType === 'phone') {
        updateFormState({ step: 'otp' });
        toast({
          title: "OTP Sent",
          description: `A verification code has been sent to ${formState.phone}`,
        });
      } else {
        if (mode === 'signup') {
          if (role === 'doctor') {
            updateFormState({ step: 'documents' });
            toast({
              title: "Account Created",
              description: "Please complete your profile with professional details",
            });
          } else {
            completeAuthentication();
          }
        } else {
          completeAuthentication();
        }
      }
    }, 1500);
  };

  const handleOtpSubmit = () => {
    if (!validateOtp()) return;
    
    updateFormState({ isLoading: true });
    
    setTimeout(() => {
      updateFormState({ isLoading: false });
      
      if (mode === 'signup') {
        if (role === 'doctor') {
          updateFormState({ step: 'documents' });
        } else {
          completeAuthentication();
        }
      } else {
        completeAuthentication();
      }
    }, 1500);
  };

  const handleDocumentsSubmit = () => {
    if (!validateDocuments()) return;
    
    updateFormState({ isLoading: true });
    
    setTimeout(() => {
      updateFormState({ isLoading: false });
      
      toast({
        title: "Documents Submitted",
        description: "Your profile is under review. We'll notify you once approved.",
      });
      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', formState.name || formState.email);
      localStorage.setItem('userRole', 'doctor_pending');
      
      navigate('/');
    }, 2000);
  };

  const completeAuthentication = () => {
    localStorage.setItem('isAuthenticated', 'true');
    
    if (mode === 'login') {
      localStorage.setItem('userName', 'Demo User');
      localStorage.setItem('userRole', role);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      if (role === 'doctor') {
        navigate('/doctor-portal');
      } else if (role === 'admin') {
        navigate('/admin-portal');
      } else {
        navigate('/dashboard');
      }
    } else {
      localStorage.setItem('userName', formState.name);
      localStorage.setItem('userRole', role);
      
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      
      navigate('/');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.step === 'credentials') {
      handleCredentialSubmit();
    } else if (formState.step === 'otp') {
      handleOtpSubmit();
    } else if (formState.step === 'documents') {
      handleDocumentsSubmit();
    }
  };

  return {
    formState,
    setAuthType,
    setEmail,
    setPhone,
    setPassword,
    setName,
    setOtp,
    setIsCaptchaVerified,
    setSpecialization,
    setExperience,
    setBio,
    setLicenseFile,
    setCertificateFile,
    setIdFile,
    handleBackFromOtp,
    handleBackFromDocuments,
    handleSubmit
  };
};
