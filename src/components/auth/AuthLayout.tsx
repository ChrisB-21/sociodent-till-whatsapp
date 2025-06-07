import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white px-4 pt-20">
      {/* Removed the gradient background and replaced it with a plain white background */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Removed the "Back to Home" link */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <Link to="/" className="inline-block">
                <img
                  src="/logo.png"
                  alt="SocioDent Logo"
                  className="h-12 mx-auto object-contain"
                />
              </Link>
            </div>

            {title && <h2 className="text-2xl font-bold text-center mb-6">{title}</h2>}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;