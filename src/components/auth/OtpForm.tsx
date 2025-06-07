
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface OtpFormProps {
  otp: string;
  setOtp: (otp: string) => void;
  onBack: () => void;
  authType: 'email' | 'phone';
}

const OtpForm: React.FC<OtpFormProps> = ({ otp, setOtp, onBack, authType }) => {
  return (
    <div className="mb-6">
      <div className="mb-4">
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
          Verification Code
        </label>
        <input
          type="text"
          id="otp"
          className="input-primary text-center text-xl tracking-widest"
          placeholder="••••"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>
      
      <p className="text-sm text-gray-500 text-center mb-4">
        Didn't receive the code?{" "}
        <button 
          type="button"
          className="text-sociodent-600 hover:text-sociodent-700 font-medium"
        >
          Resend
        </button>
      </p>
      
      <button
        type="button"
        className="flex items-center justify-center w-full text-sociodent-600 hover:text-sociodent-700 mb-2"
        onClick={onBack}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to {authType === 'email' ? 'email' : 'phone number'}
      </button>
    </div>
  );
};

export default OtpForm;
