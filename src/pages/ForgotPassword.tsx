import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaSyncAlt } from "react-icons/fa";
import { auth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import SubmitButton from "@/components/auth/SubmitButton";
import { useToast } from "@/hooks/use-toast";

// Generate captcha function
const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCaptchaRefresh = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaVerified(false);
  };

  const handleCaptchaVerify = () => {
    const isVerified = captchaInput.trim() === captcha.trim();
    setCaptchaVerified(isVerified);
    if (!isVerified) {
      toast({
        title: "Error",
        description: "Captcha verification failed",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!captchaVerified) {
      toast({
        title: "Error",
        description: "Please verify the captcha first",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email);
      
      setResetSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for a password reset link",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to send password reset email";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password">
      {resetSent ? (
        <div className="text-center py-8">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">Reset Email Sent</h2>
          <p className="mb-6 text-gray-600">
            We've sent password reset instructions to your email.
            Please check your inbox (and spam folder).
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setResetSent(false)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
            >
              Try another email
            </button>
            <Link
              to="/auth?mode=login"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-6 text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="captchaVerify"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verify you're human
              </label>
              <div className="flex items-center mb-2">
                <div className="bg-gray-100 px-3 py-2 rounded-lg tracking-widest flex-1 text-center font-mono font-semibold text-gray-700">
                  {captcha}
                </div>
                <button
                  type="button"
                  onClick={handleCaptchaRefresh}
                  className="ml-2 p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FaSyncAlt />
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="captchaInput"
                  className="block flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the code above"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  required
                />
                <button
                  type="button"
                  onClick={handleCaptchaVerify}
                  className={`px-4 py-2 ${
                    captchaVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  } rounded-r-md`}
                >
                  {captchaVerified ? "Verified" : "Verify"}
                </button>
              </div>
            </div>

            <SubmitButton isLoading={isLoading}>Send Reset Link</SubmitButton>

            <div className="text-center">
              <Link
                to="/auth?mode=login"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Back to login
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
