import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress specific Razorpay header warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out Razorpay header warnings
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('Refused to get unsafe header "x-rtb-fingerprint-id"') ||
    message.includes('x-rtb-fingerprint-id') ||
    message.includes('unsafe header')
  )) {
    return; // Suppress these specific warnings
  }
  originalConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
