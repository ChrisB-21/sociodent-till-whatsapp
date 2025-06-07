// Global error handler to suppress Razorpay header warnings
(() => {
  // Suppress specific console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Refused to get unsafe header "x-rtb-fingerprint-id"') ||
      message.includes('x-rtb-fingerprint-id') ||
      message.includes('unsafe header') ||
      message.includes('Refused to get unsafe header')
    )) {
      return; // Suppress these specific warnings
    }
    originalConsoleError.apply(console, args);
  };

  // Suppress window errors related to Razorpay headers
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && (
      message.includes('x-rtb-fingerprint-id') ||
      message.includes('unsafe header') ||
      message.includes('Refused to get unsafe header')
    )) {
      return true; // Suppress these specific errors
    }
    
    if (originalWindowError) {
      return originalWindowError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // Suppress unhandled promise rejections related to headers
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    if (event.reason && event.reason.message && (
      event.reason.message.includes('x-rtb-fingerprint-id') ||
      event.reason.message.includes('unsafe header')
    )) {
      event.preventDefault();
      return;
    }
    
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.call(window, event);
    }
  };
})();
