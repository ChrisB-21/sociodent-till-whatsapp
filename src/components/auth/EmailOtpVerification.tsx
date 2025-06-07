import React, { useState, useEffect } from "react";
import { EmailService } from "../../../services/emailService";

interface EmailOtpVerificationProps {
  userEmail: string;
  userName: string;
  onVerified: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

const EmailOtpVerification: React.FC<EmailOtpVerificationProps> = ({
  userEmail,
  userName,
  onVerified,
  onCancel,
  onError
}) => {
  const [otp, setOtp] = useState<string>("");
  const [timer, setTimer] = useState<number>(600); // 10 minutes in seconds
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>(""); // Store OTP locally

  // Timer countdown
  useEffect(() => {
    if (isSent && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      // OTP expired, clear the generated OTP
      setGeneratedOtp("");
    }
  }, [isSent, timer]);

  // Function to generate a random 6-digit OTP
  const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Function to send OTP via email
  const sendOtp = async () => {
    try {
      setIsLoading(true);

      // Generate a new OTP
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);

      // Send the OTP via email
      await EmailService.sendOtpEmail(userEmail, userName, newOtp);

      setIsSent(true);
      setIsLoading(false);
      setTimer(600); // Reset timer to 10 minutes
      setOtp("");
    } catch (error: any) {
      console.error("Error sending OTP email:", error);
      setIsLoading(false);

      // Provide user-friendly error message
      onError("Failed to send verification code. Please check your email address and try again.");
    }
  };

  // Function to verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      onError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);

      if (!generatedOtp) {
        throw new Error("Verification code has expired. Please request a new one.");
      }

      // Verify the entered OTP against the generated one
      if (otp === generatedOtp) {
        setIsLoading(false);
        onVerified();
      } else {
        throw new Error("Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setIsLoading(false);
      onError(error.message || "Invalid verification code. Please try again.");
    }
  };

  // Function to resend OTP
  const resendOtp = async () => {
    setTimer(600); // Reset to 10 minutes
    setOtp("");
    await sendOtp();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-center">Email Verification</h3>
      <p className="text-gray-600 mb-4 text-center">
        {isSent
          ? `We have sent a verification code to ${userEmail}`
          : `Verify your email address ${userEmail}`
        }
      </p>

      {!isSent ? (
        <div>
          <button
            onClick={sendOtp}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg mb-2 hover:bg-blue-700 transition"
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Enter 6-digit code"
              className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-wider"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              {timer > 0 ? `Expires in ${formatTime(timer)}` : "Code expired"}
            </span>
            <button
              onClick={resendOtp}
              disabled={timer > 300 || isLoading} // Can resend after 5 minutes
              className={`text-sm ${timer > 300 ? 'text-gray-400' : 'text-blue-600 hover:underline'}`}
            >
              Resend Code
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailOtpVerification;
