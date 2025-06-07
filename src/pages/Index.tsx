import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Testimonials from "@/components/Testimonials";
import { featuredDentists } from "@/data/homepageData";
import { FaStar, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
    };
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main>
        <HeroSection />
        <FeaturesSection />

        {/* Meet Our Expert Dentists Section */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <span className="reveal-on-scroll inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
                Meet Our Top Dentists
              </span>
              <h2 className="reveal-on-scroll text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Experienced & Caring Dental Professionals
              </h2>
              <p className="reveal-on-scroll text-lg text-gray-600 max-w-2xl mx-auto">
                Our specialists are here to provide quality dental care with
                expertise in home care and special needs dentistry
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDentists.map((dentist, index) => (
                <div
                  key={dentist.id}
                  className="reveal-on-scroll glass-card rounded-2xl overflow-hidden card-hover transition-all duration-300"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="relative aspect-square">
                    <img
                      src={dentist.image}
                      alt={`Dr. ${dentist.name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-900">
                      Dr. {dentist.name}
                    </h3>
                    <p className="text-sociodent-600 text-sm mb-3">
                      {dentist.specialty}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{dentist.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{dentist.availability}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <Link
                        to={
                          isAuthenticated
                            ? `/consultation?dentist=${dentist.id}`
                            : "/auth?mode=login"
                        }
                        className={`button-primary w-full py-2 text-center text-sm ${
                          !isAuthenticated ? "opacity-90" : ""
                        }`}
                      >
                        {isAuthenticated
                          ? "Book Appointment"
                          : "Login for Appointment"}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />

        {/* Get Started Section */}
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-8">
              <span className="reveal-on-scroll inline-block px-3 py-1 mb-4 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
                Get Started
              </span>
              <h2 className="reveal-on-scroll text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Ready to Transform Your Smile?
              </h2>
              <p className="reveal-on-scroll text-lg text-gray-600 max-w-2xl mx-auto">
                Take the first step towards a healthier, more confident smile
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/consultation" className="button-primary">
                    Book a Consultation
                  </Link>
                  <Link to="/products" className="button-secondary">
                    Shop Products
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth" className="button-primary">
                    Create Account
                  </Link>
                  <Link to="/auth?mode=login" className="button-secondary">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
