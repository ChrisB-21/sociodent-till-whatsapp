// src/components/auth/SubmitButton.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  step?: "credentials" | "otp" | "documents";
  mode?: "login" | "signup";
  role?: "user" | "doctor" | "admin";
  children?: React.ReactNode; // Optional override
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading = false,
  step = "credentials",
  mode = "login",
  role = "user",
  children,
  ...props
}) => {
  const getDefaultText = () => {
    if (step === "credentials") {
      return mode === "login"
        ? `Sign In as ${role === "user" ? "User" : role === "doctor" ? "Doctor" : "Admin"}`
        : "Create Account";
    }
    if (step === "otp") return "Verify";
    if (step === "documents") return "Submit Documents";
    return "Submit";
  };

  return (
    <button
      type="submit"
      className={cn(
        "w-full py-2 px-4 bg-sociodent-600 text-white rounded-md font-semibold hover:bg-sociodent-700 transition",
        isLoading && "opacity-70 cursor-not-allowed"
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        <span>{children || getDefaultText()}</span>
      )}
    </button>
  );
};

export default SubmitButton;
