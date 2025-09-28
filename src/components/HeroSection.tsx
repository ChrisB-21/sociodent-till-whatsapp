import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication state on mount
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
    };

    checkAuth();

    // Listen for authentication changes
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <section 
      className="pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-b from-white to-sociodent-50 overflow-hidden"
    >
      <div className="container-custom relative">
        <div className="max-w-5xl mx-auto">
          {/* Chip */}
          <div 
            className="inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium"
          >
            Your Dental Health Partner
          </div>
          
          {/* Headline */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Your Trusted Partner for <br className="hidden md:block" />
            <span className="text-coral-500">Inclusive and Special Needs Dental Care</span>
          </h1>
          
          {/* Subheading */}
          <p 
            className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl"
          >
            Book virtual, in-home, or clinic visits, shop oral care essentials, and access expert
            support — smart, seamless care within reach.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/consultation" 
                  className="button-primary text-center"
                >
                  Find a Dentist
                </Link>
                <Link 
                  to="/products" 
                  className="button-secondary text-center"
                >
                  Shop Products
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/signup" 
                  className="button-primary text-center"
                >
                  Create Account
                </Link>
                <Link 
                  to="/auth?mode=login" 
                  className="button-secondary text-center"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;