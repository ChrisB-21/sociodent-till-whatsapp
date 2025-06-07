
import React from 'react';
import { cn } from '@/lib/utils';

interface AuthTypeToggleProps {
  authType: 'email' | 'phone';
  setAuthType: (type: 'email' | 'phone') => void;
}

const AuthTypeToggle: React.FC<AuthTypeToggleProps> = ({ authType, setAuthType }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
      <button
        type="button"
        className={cn(
          "flex-1 py-2 text-sm font-medium rounded-md transition-all",
          authType === 'email'
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        )}
        onClick={() => setAuthType('email')}
      >
        Email
      </button>
      <button
        type="button"
        className={cn(
          "flex-1 py-2 text-sm font-medium rounded-md transition-all",
          authType === 'phone'
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        )}
        onClick={() => setAuthType('phone')}
      >
        Phone
      </button>
    </div>
  );
};

export default AuthTypeToggle;
