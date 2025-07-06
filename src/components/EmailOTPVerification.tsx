import React, { useState, useEffect } from 'react';

interface EmailOTPVerificationProps {
  email: string;
  onVerified: () => void;
  onError: (error: string) => void;
}

const EmailOTPVerification: React.FC<EmailOTPVerificationProps> = ({
  email,
  onVerified,
  onError
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'failure' | null>(null);

  // Timer for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isSent && timer === 0) {
      setCanResend(true);
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timer, timerActive, isSent]);
  // Send OTP
  const sendOtp = async () => {
    if (!email) {
      onError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setVerificationResult(null);
      
      // Generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in localStorage for verification (in production, this should be server-side)
      localStorage.setItem('emailOtp', generatedOtp);
      localStorage.setItem('emailOtpEmail', email);
      localStorage.setItem('emailOtpExpiry', (Date.now() + 300000).toString()); // 5 minutes expiry
      
      // For debugging: Show OTP in console (remove this in production)
      console.log(`DEBUG: OTP for ${email} is: ${generatedOtp}`);
      
      // Try to send OTP via backend, but don't fail if it doesn't work
      let emailSent = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('http://localhost:3000/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: 'SocioDent Email Verification',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4a90e2; text-align: center;">Email Verification</h2>
                <p>Hello,</p>
                <p>Your verification code for SocioDent is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                  <h1 style="font-size: 32px; letter-spacing: 5px; margin: 0; color: #4a90e2;">${generatedOtp}</h1>
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this verification, please ignore this email.</p>
                <p>Best regards,<br>SocioDent Team</p>
              </div>
            `
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          emailSent = true;
          console.log('Email sent successfully');
        } else {
          const errorData = await response.json();
          console.warn('Email sending failed:', errorData.error || 'Unknown error');
        }
      } catch (emailError) {
        console.warn('Failed to send email via backend:', emailError);
      }
      
      // Always proceed with OTP verification, regardless of email sending
      setIsSent(true);
      setTimer(300); // 5 minutes countdown
      setCanResend(false);
      setTimerActive(true);
      setOtp('');
      onError(''); // Clear any previous errors
      
      // Show a message about email status
      if (!emailSent) {
        console.log('Email service unavailable. For testing, check console for OTP.');
      }

    } catch (error) {
      console.error('Error in sendOtp:', error);
      onError('Failed to generate OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      onError('Please enter a valid 6-digit OTP');
      return;
    }

    setTimerActive(false); // Stop timer immediately
    try {
      setIsLoading(true);
      
      // Get stored OTP data
      const storedOtp = localStorage.getItem('emailOtp');
      const storedEmail = localStorage.getItem('emailOtpEmail');
      const storedExpiry = localStorage.getItem('emailOtpExpiry');
      
      // Check if OTP exists and hasn't expired
      if (!storedOtp || !storedEmail || !storedExpiry) {
        setVerificationResult('failure');
        setCanResend(true);
        onError('Verification code has expired. Please request a new one.');
        return;
      }
      
      if (Date.now() > parseInt(storedExpiry)) {
        setVerificationResult('failure');
        setCanResend(true);
        // Clean up expired OTP
        localStorage.removeItem('emailOtp');
        localStorage.removeItem('emailOtpEmail');
        localStorage.removeItem('emailOtpExpiry');
        onError('Verification code has expired. Please request a new one.');
        return;
      }
      
      if (storedEmail !== email) {
        setVerificationResult('failure');
        setCanResend(true);
        onError('Email mismatch. Please request a new verification code.');
        return;
      }
      
      if (storedOtp === otp) {
        setVerificationResult('success');
        // Clean up successful verification
        localStorage.removeItem('emailOtp');
        localStorage.removeItem('emailOtpEmail');
        localStorage.removeItem('emailOtpExpiry');
        onVerified();
      } else {
        setVerificationResult('failure');
        setCanResend(true);
        onError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setVerificationResult('failure');
      setCanResend(true);
      console.error('Error verifying OTP:', error);
      onError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setOtp('');
    setVerificationResult(null);
    setCanResend(false);
    setTimer(300);
    setTimerActive(true);
    await sendOtp();
    setCanResend(true); // Always enable resend after click
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-blue-800">
        📧 Email Verification Required
      </h3>
      
      <p className="text-gray-600 mb-4">
        {isSent 
          ? `We've sent a 6-digit verification code to ${email}`
          : `Please verify your email address: ${email}`
        }
      </p>

      {!isSent ? (
        <button
          onClick={sendOtp}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending OTP...
            </span>
          ) : (
            'Send Verification Code'
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit verification code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setOtp(value);
                setVerificationResult(null);
                if (!timerActive && isSent && timer > 0) setTimerActive(true);
              }}
              placeholder="123456"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={verificationResult === 'success'}
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            {timer > 0 && timerActive ? (
              <span className="text-gray-500">
                Code expires in {formatTime(timer)}
              </span>
            ) : timer === 0 ? (
              <span className="text-red-500">Code expired</span>
            ) : verificationResult === 'failure' ? (
              <span className="text-red-500">Verification failed</span>
            ) : null}

            <button
              onClick={resendOtp}
              disabled={!canResend || isLoading || verificationResult === 'success'}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
          </div>

          <button
            onClick={verifyOtp}
            disabled={isLoading || otp.length !== 6 || verificationResult === 'success'}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : verificationResult === 'success' ? (
              '✔ Email Verified'
            ) : (
              '✓ Verify Email'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailOTPVerification;
