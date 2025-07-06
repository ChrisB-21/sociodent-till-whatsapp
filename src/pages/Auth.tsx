import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  FaUser,
  FaUserMd,
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaSyncAlt,
} from "react-icons/fa";
import { auth, db } from "@/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import AuthLayout from "@/components/auth/AuthLayout";
import SubmitButton from "@/components/auth/SubmitButton";
import EmailOtpVerification from "@/components/auth/EmailOtpVerification";
import AudioCaptcha from "@/components/AudioCaptcha";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";
  const mode = searchParams.get("mode") || "login";
  const { login } = useAuth();

  const [loginTab, setLoginTab] = useState("user");
  const [loginMethod, setLoginMethod] = useState("email");
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

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

  // Email-based login handler
  const handleEmailLogin = async () => {
    try {
      console.log(`Attempting email login with: ${form.email}, mode: ${loginTab}`);

      // Sign in with Firebase authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      
      await handleUserAuthentication(userCredential, form.email, "email");
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  // Phone-based login handler (with email OTP verification)
  const handlePhoneLogin = async () => {
    try {
      if (!form.email) {
        setErrorMessage("Please provide your email address for verification");
        toast({
          title: "Missing Email",
          description: "Email is required for phone number login verification",
          variant: "destructive",
        });
        return;
      }

      if (!isEmailVerified) {
        // Show the email OTP verification
        setShowEmailOtp(true);
        return;
      }

      console.log(`Attempting phone login with email: ${form.email}, phone: ${form.phone}, mode: ${loginTab}`);

      // Use the actual email for authentication after OTP verification
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      
      await handleUserAuthentication(userCredential, form.email, "phone");
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  // Common user authentication and validation logic
  const handleUserAuthentication = async (userCredential: any, emailToUse: string, loginType: string) => {
    // For testing/development - handle special cases first
    if (emailToUse === "saiaravindanstudiesonly@gmail.com" && loginTab === "admin") {
      login({
        uid: userCredential.user.uid,
        role: "admin",
        name: "Test Admin",
        email: userCredential.user.email || undefined,
      });

      toast({
        title: "Admin Login Successful",
        description: "Welcome back, Test Admin",
      });

      navigate("/admin-portal");
      return;
    }

    // Database operations with graceful error handling
    await validateUserInDatabase(userCredential, emailToUse, loginType);
  };

  // Database validation logic
  const validateUserInDatabase = async (userCredential: any, emailToUse: string, loginType: string) => {
    try {
      // Try to get user data from the database based on loginTab
      let userData = null;
      let userRole = "user";
      let userName = "";
      
      if (loginTab === "admin") {
        userData = await getAdminData(userCredential, emailToUse);
        if (userData) {
          userRole = "admin";
          userName = userData.fullName || "Admin";
        }
      } else if (loginTab === "doctor") {
        userData = await getDoctorData(userCredential, emailToUse);
        if (userData) {
          userRole = "doctor";
          userName = userData.fullName || "Doctor";
        }
      } else {
        userData = await getUserData(userCredential, emailToUse);
        if (userData) {
          userRole = userData.role || "user";
          userName = userData.fullName || "User";
        }
      }

      if (!userData) {
        throw new Error(`No ${loginTab} account found with these credentials`);
      }

      // Validate username if provided
      await validateUsername(userData);

      // Complete login process
      await completeLogin(userCredential, userRole, userName, emailToUse, userData);

    } catch (dbError: any) {
      await handleDatabaseError(dbError, userCredential, emailToUse);
    }
  };

  // Error handling for authentication
  const handleAuthError = (err: any) => {
    console.error("Authentication error:", err);
    
    let errorMsg = "Enter valid credentials";
    if (err.code === "auth/user-not-found") {
      errorMsg = "No account found with this email";
    } else if (err.code === "auth/wrong-password") {
      errorMsg = "Incorrect password";
    } else if (err.code === "auth/invalid-credential") {
      errorMsg = "Invalid login credentials";
    } else if (err.code === "auth/too-many-requests") {
      errorMsg = "Too many failed attempts. Try again later";
    } else if (err.message) {
      errorMsg = err.message;
    }
    
    setErrorMessage(errorMsg);
    toast({
      title: "Login Failed",
      description: errorMsg,
      variant: "destructive",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (!captchaVerified) {
      toast({
        title: "Error",
        description: "Please verify the captcha first",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Route to appropriate login method
    if (loginTab !== "admin" && loginMethod === "phone") {
      await handlePhoneLogin();
    } else {
      await handleEmailLogin();
    }

    setIsLoading(false);
  };

  // Helper function to get admin data
  const getAdminData = async (userCredential: any, emailToUse: string) => {
    // Try admin collection first
    const adminRef = ref(db, "admin");
    const adminSnapshot = await get(adminRef);
    const adminData = adminSnapshot.exists() ? adminSnapshot.val() : null;
    
    // Check if user is admin
    if (adminData && (
      adminData.email === emailToUse || 
      adminData.uid === userCredential.user.uid
    )) {
      return adminData;
    }

    // Try users collection with admin role
    const userRef = ref(db, `users/${userCredential.user.uid}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists() && userSnapshot.val().role === "admin") {
      return userSnapshot.val();
    }

    throw new Error("You don't have admin privileges");
  };

  // Helper function to get doctor data
  const getDoctorData = async (userCredential: any, emailToUse: string) => {
    // Try doctors collection first
    const doctorRef = ref(db, `doctors/${userCredential.user.uid}`);
    const doctorSnapshot = await get(doctorRef);
    
    if (doctorSnapshot.exists()) {
      return doctorSnapshot.val();
    }

    // Try users collection with doctor role
    const userRef = ref(db, `users/${userCredential.user.uid}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists() && userSnapshot.val().role === "doctor") {
      return userSnapshot.val();
    }

    throw new Error("No doctor account found with these credentials");
  };

  // Helper function to get regular user data
  const getUserData = async (userCredential: any, emailToUse: string) => {
    const userRef = ref(db, `users/${userCredential.user.uid}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      return userSnapshot.val();
    }

    throw new Error("No user account found");
  };

  // Helper function to validate username
  const validateUsername = async (userData: any) => {
    if (form.name && userData && userData.fullName) {
      const enteredName = form.name.trim().toLowerCase();
      const storedName = userData.fullName.trim().toLowerCase();
      
      if (enteredName !== storedName) {
        // Logout the user since authentication succeeded but name check failed
        await signOut(auth);
        throw new Error("Username does not match our records");
      }
    }
  };

  // Helper function to complete login process
  const completeLogin = async (userCredential: any, userRole: string, userName: string, emailToUse: string, userData: any) => {
    // Login succeeded - store user data
    login({
      uid: userCredential.user.uid,
      role: userRole,
      name: userName,
      email: userCredential.user.email || undefined,
      status: userData?.status, // Include status for approval checking
    });

    // Check if doctor is approved before allowing access
    if (userRole === "doctor" && userData?.status !== "approved") {
      toast({
        title: "Account Pending Approval",
        description: "Your doctor account is still under review. You'll be notified once approved.",
        variant: "default",
      });
      // Still redirect to doctor portal - the portal will show the pending approval screen
      navigate("/doctor-portal");
      return;
    }

    // Success toast
    toast({
      title: "Login Successful",
      description: `Welcome back, ${userName}`,
    });

    // Redirect based on role
    if (redirectTo === "admin" && userRole === "admin") {
      navigate("/admin-portal");
    } else if (userRole === "admin") {
      navigate("/admin-portal");
    } else if (userRole === "doctor") {
      navigate("/doctor-portal");
    } else {
      navigate("/");
    }
  };

  // Helper function to handle database errors
  const handleDatabaseError = async (dbError: any, userCredential: any, emailToUse: string) => {
    console.error("Database error:", dbError);
    
    // Check if error indicates user not found in database
    const isUserNotFoundError = dbError.message?.includes("User not found") || 
                               dbError.message?.includes("no user data") ||
                               dbError.message?.includes("doesn't have admin privileges") ||
                               (dbError.message?.includes("No user found") && userCredential);
    
    // Determine if this is a permission error
    const isPermissionError = dbError.message?.includes("permission_denied") || 
                             dbError.code === "PERMISSION_DENIED";
    
    if (isUserNotFoundError && userCredential) {
      // User has valid Firebase Auth but no database record (likely deleted)
      await signOut(auth);
      setErrorMessage(`Your account data was not found in our system. This might happen if your account was deleted. 
      
If you recently registered, please try creating a new account. 
If you believe this is an error, please contact support.`);
      
      toast({
        title: "Account Data Not Found",
        description: "Your authentication exists but account data is missing. Please contact support or create a new account.",
        variant: "destructive",
      });
    } else if (isPermissionError) {
      // For permission errors, allow the user to stay logged in with Firebase Auth
      // The AuthContext will handle maintaining the Firebase session
      // Default to basic user role if we can't verify from database
      login({
        uid: userCredential.user.uid,
        role: "user", // Default role when database access is denied
        name: userCredential.user.displayName || "User",
        email: userCredential.user.email || undefined,
        status: undefined, // Unknown status when database access is denied
      });

      toast({
        title: "Login Successful",
        description: "Logged in with basic access. Some features may be limited.",
        variant: "default",
      });

      // Navigate to home page with basic access
      navigate("/");
    } else {
      // For other database errors, sign out and show error
      await signOut(auth);
      setErrorMessage(dbError.message || "Validation failed");
      toast({
        title: "Login Failed",
        description: dbError.message || "Failed to validate your account",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setForm({
      email: "",
      phone: "",
      password: "",
      name: "",
    });
    setCaptchaVerified(false);
    setCaptchaInput("");
    setCaptcha(generateCaptcha());
    setErrorMessage("");
  }, [loginTab, loginMethod]);

  useEffect(() => {
    if (redirectTo === "admin") {
      setLoginTab("admin");
    }
  }, [redirectTo]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-bold mb-1">Welcome Back</h2>
        <p className="text-gray-600 mb-2">
          Sign in to continue to your account
        </p>
      </div>

      <div className="flex justify-center mb-4 space-x-2">
        {["user", "doctor", "admin"].map((role) => (
          <button
            key={role}
            className={`flex-1 flex items-center justify-center px-2 py-2 rounded-lg ${
              loginTab === role
                ? "bg-sociodent-100 text-sociodent-700 font-bold"
                : "bg-gray-100 text-gray-500"
            }`}
            onClick={() => setLoginTab(role)}
            type="button"
          >
            {role === "user" && <FaUser className="mr-1" />}
            {role === "doctor" && <FaUserMd className="mr-1" />}
            {role === "admin" && <FaUserShield className="mr-1" />}
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded text-center">
          {errorMessage}
        </div>
      )}

      {loginTab !== "admin" && (
        <div className="flex mb-4">
          {["email", "phone"].map((method) => (
            <button
              key={method}
              className={`flex-1 py-2 border ${
                loginMethod === method
                  ? "bg-white border-sociodent-500 text-sociodent-600 font-bold"
                  : "bg-gray-50 border-gray-300 text-gray-500"
              } ${method === "email" ? "rounded-l-lg" : "rounded-r-lg"}`}
              onClick={() => setLoginMethod(method)}
              type="button"
            >
              {method === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>
      )}

      {showEmailOtp && (
        <div className="mb-4">
          <EmailOtpVerification
            userEmail={form.email}
            userName={form.name}
            onVerified={() => {
              setShowEmailOtp(false);
              setIsEmailVerified(true);
              toast({
                title: "Email Verified",
                description: "Email verification successful. Please submit the form to continue.",
              });
            }}
            onCancel={() => {
              setShowEmailOtp(false);
              setIsLoading(false);
              toast({
                title: "Verification Cancelled",
                description: "Phone login cancelled. Please try again.",
                variant: "destructive",
              });
            }}
            onError={(error) => {
              setIsLoading(false);
              toast({
                title: "Verification Error",
                description: error,
                variant: "destructive",
              });
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {loginTab !== "admin" && (
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">
              User Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FaUser />
              </span>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-sociodent-500"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>
        )}

        {(loginTab === "admin" || loginMethod === "email") && (
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FaEnvelope />
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-sociodent-500 ${
                  loginTab === "admin" ? "bg-gray-50" : ""
                }`}
                placeholder={
                  loginTab === "admin"
                    ? "Enter admin email"
                    : "name@example.com"
                }
                required
              />
            </div>
          </div>
        )}

        {loginTab !== "admin" && loginMethod === "phone" && (
          <>
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaPhone />
                </span>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-sociodent-500"
                  placeholder="Enter your phone"
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-gray-700 mb-2 text-sm font-medium">                  Email Address (required for verification)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaEnvelope />
                </span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-sociodent-500"
                  placeholder="Enter your email for OTP verification"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                You'll receive a verification code via email
              </p>
            </div>
          </>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-700 text-sm font-medium">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sociodent-500 text-xs hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-sociodent-500"
              placeholder="Enter your password"
              required
            />
            <span
              className="absolute right-3 top-3 text-gray-400 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {loginTab === "admin" && (
            <p className="text-xs text-gray-500 mt-1">
              Admin password is case sensitive
            </p>
          )}
        </div>

        <div className="bg-gray-50 border rounded-md p-3">
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            Verify you're human
          </label>
          
          {/* Audio CAPTCHA for accessibility */}
          <AudioCaptcha captchaText={captcha} className="mb-3" />
          
          <div className="flex items-center mb-2">
            <div className="flex-1 flex items-center justify-between px-3 py-2 bg-white border rounded font-mono tracking-widest text-lg select-none">
              <span>{captcha}</span>
              <span
                className="ml-2 text-sociodent-500 cursor-pointer"
                onClick={handleCaptchaRefresh}
                title="Refresh Captcha"
              >
                <FaSyncAlt />
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded-l focus:ring-2 focus:ring-sociodent-500"
              placeholder="Enter the code above"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                setCaptchaVerified(false);
              }}
              required
            />
            <button
              type="button"
              className={`px-4 py-2 rounded-r ${
                captchaVerified ? "bg-green-500" : "bg-sociodent-500"
              } text-white`}
              onClick={handleCaptchaVerify}
              disabled={captchaVerified}
            >
              {captchaVerified ? "Verified" : "Verify"}
            </button>
          </div>
        </div>

        <SubmitButton
          type="submit"
          disabled={isLoading || !captchaVerified}
          isLoading={isLoading}
        >
          Sign In
        </SubmitButton>

        {mode === "login" && (
          <p className="text-sm text-gray-600 text-center mt-4">
            Don't have an account?{" "}
            <a href="/signup" className="text-sociodent-600 hover:underline">
              Sign up now
            </a>
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default Auth;
