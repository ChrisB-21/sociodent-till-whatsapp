import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

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
  }, [timer, timerActive, isSent]);  // Send OTP
  const sendOtp = async () => {
    if (!email) {
      onError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setVerificationResult(null);
      
      // Debug logging
      console.log('🔍 OTP Debug Info:');
      console.log('Email:', email);
      console.log('API Endpoint:', API_ENDPOINTS.OTP.SEND);
      console.log('Full URL will be:', window.location.origin + API_ENDPOINTS.OTP.SEND);
      
      // Send OTP via backend API
      const response = await fetch(API_ENDPOINTS.OTP.SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });
      
      console.log('📊 Response Details:');
      console.log('Status:', response.status);
      console.log('StatusText:', response.statusText);
      console.log('OK:', response.ok);
      console.log('URL:', response.url);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        // Get the actual response to see what we received
        const responseText = await response.text();
        console.error('❌ Non-JSON Response:', responseText.substring(0, 500));
        throw new Error('Server returned invalid response. Please check if the backend is running correctly.');
      }
      
      const result = await response.json();
      console.log('✅ JSON Result:', result);
      
      if (response.ok && result.success) {
        // OTP sent successfully
        setIsSent(true);
        setTimer(300); // 5 minutes countdown
        setCanResend(false);
        setTimerActive(true);
        setOtp('');
        onError(''); // Clear any previous errors
        console.log('OTP sent successfully to', email);
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }    } catch (error) {
      console.error('💥 Error in sendOtp:', error);
      if (error instanceof Error && error.message.includes('Unexpected token')) {
        onError('Server connection error. Please check if the backend is running.');
      } else if (error instanceof Error && error.message.includes('invalid response')) {
        // Try alternative approach - direct proxy call
        console.log('🔄 Trying direct proxy call...');
        try {
          const fallbackResponse = await fetch('/api/otp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email
            })
          });
          
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            console.log('✅ Fallback successful:', fallbackResult);
            
            // Process successful result
            setIsSent(true);
            setTimer(300); // 5 minutes countdown
            setCanResend(false);
            setTimerActive(true);
            setOtp('');
            onError(''); // Clear any previous errors
            console.log('OTP sent successfully to', email);
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
        onError('Unable to send OTP. Please check your connection and try again.');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      onError('Please enter a valid 6-digit OTP');
      return;
    }

    setTimerActive(false); // Stop timer immediately
    try {
      setIsLoading(true);
      
      // Debug logging for verification
      console.log('🔍 OTP Verification Debug Info:');
      console.log('Email:', email);
      console.log('OTP:', otp);
      console.log('Verify Endpoint:', API_ENDPOINTS.OTP.VERIFY);
      console.log('Full URL will be:', window.location.origin + API_ENDPOINTS.OTP.VERIFY);
      
      // Verify OTP via backend API
      const response = await fetch(API_ENDPOINTS.OTP.VERIFY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otp
        })
      });
      
      console.log('📊 Verification Response Details:');
      console.log('Status:', response.status);
      console.log('StatusText:', response.statusText);
      console.log('OK:', response.ok);
      console.log('URL:', response.url);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        // Get the actual response to see what we received
        const responseText = await response.text();
        console.error('❌ Non-JSON Verification Response:', responseText.substring(0, 500));
        
        // Try fallback for verification
        console.log('🔄 Trying direct proxy for verification...');
        try {
          const fallbackResponse = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              otp: otp
            })
          });
          
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            console.log('✅ Verification Fallback successful:', fallbackResult);
            
            if (fallbackResult.success) {
              setVerificationResult('success');
              onVerified();
              return;
            } else {
              setVerificationResult('failure');
              setCanResend(true);
              onError(fallbackResult.message || 'Invalid verification code. Please try again.');
              return;
            }
          }
        } catch (fallbackError) {
          console.error('❌ Verification Fallback also failed:', fallbackError);
        }
        
        throw new Error('Server returned invalid response. Please check if the backend is running correctly.');
      }
      
      const result = await response.json();
      console.log('✅ Verification JSON Result:', result);
      
      if (response.ok && result.success) {
        setVerificationResult('success');
        onVerified();
      } else {
        setVerificationResult('failure');
        setCanResend(true);
        onError(result.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      setVerificationResult('failure');
      setCanResend(true);
      console.error('💥 Error verifying OTP:', error);
      if (error instanceof Error && error.message.includes('Unexpected token')) {
        onError('Server connection error. Please check if the backend is running.');
      } else if (error instanceof Error && error.message.includes('invalid response')) {
        onError('Unable to verify OTP. Please check your connection and try again.');
      } else {
        onError(error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.');
      }
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
