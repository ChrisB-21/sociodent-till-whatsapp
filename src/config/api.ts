// API configuration for both development and production
const API_BASE_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  EMAIL: {
    SEND: `${API_BASE_URL}/email/send`,
  },
  OTP: {
    SEND: `${API_BASE_URL}/otp/send`,
    VERIFY: `${API_BASE_URL}/otp/verify`,
    CHECK_VERIFICATION: `${API_BASE_URL}/otp/check-verification`,
  },
  WHATSAPP: {
    SEND_WELCOME: `${API_BASE_URL}/whatsapp/send-welcome`,
  },
  RAZORPAY: {
    CREATE_ORDER: `${API_BASE_URL}/razorpay/create-order`,
    VERIFY_PAYMENT: `${API_BASE_URL}/razorpay/verify-payment`,
  },
};

// Log the current API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

export default API_ENDPOINTS;
