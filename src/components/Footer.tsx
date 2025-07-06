import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Linkedin,
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";

// Example AuthContext (replace with your actual context or logic)
const AuthContext = React.createContext({ isLoggedIn: false });
const useAuth = () => useContext(AuthContext);

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  const handleContactClick = () => {
    if (location.pathname === "/about") {
      document.getElementById("contact-us")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/about");
      setTimeout(() => {
        document.getElementById("contact-us")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  };

  // Contact information with links
  const contactItems = [
    {
      icon: <MapPin size={22} className="mt-0.5 mr-3 flex-shrink-0" />,
      content: (
        <a
          href="https://www.google.com/maps/search/?api=1&query=Sociodent+Private+Limited+IITM+Research+Park+Chennai"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-900 transition-colors"
        >
          Sociodent Private Limited<br />
          IITM Research Park, No. 1 FA, I Floor, Kanagam Road,<br />
          Taramani, Adayar, Chennai-600 113, Tamil Nadu, India.
        </a>
      )
    },
    {
      icon: <Phone size={22} className="mr-3 flex-shrink-0" />,
      content: (
        <a
          href="tel:+919043561043"
          className="hover:text-gray-900 transition-colors"
        >
          +91 90435 61043
        </a>
      )
    },
    {
      icon: <Mail size={22} className="mr-3 flex-shrink-0" />,
      content: (
        <a
          href="mailto:steward@sociodent.in?subject=Enquiry from SocioDent Website"
          className="hover:text-gray-900 transition-colors"
        >
          steward@sociodent.in
        </a>
      )
    }
  ];

  // Conditionally include "Find a Dentist"
  const quickLinks = [
    { label: "Home", path: "/" },
    ...(isLoggedIn ? [{ label: "Find a Dentist", path: "/consultation" }] : []),
    { label: "Products", path: "/products" },
    { label: "About Us", path: "/about" },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container-custom px-6 py-20 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          {/* Company Info */}
          <div className="space-y-5">
            <Link to="/" onClick={scrollToTop}>
              <img
                src="/logo.png"
                alt="SocioDent Logo"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-base text-gray-600 max-w-xs">
              Transforming dental care with technology. Book appointments, shop products, and access dental education all in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-900 mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={scrollToTop}
                    className="text-base px-2 py-1 rounded transition-colors hover:bg-gray-100 inline-flex items-center"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={18} className="ml-2" />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={handleContactClick}
                  className="text-base px-2 py-1 rounded transition-colors hover:bg-gray-100 inline-flex items-center"
                >
                  <span>Contact</span>
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-900 mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4 text-base text-gray-600">
              {contactItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  {item.icon}
                  <div className="flex-1">
                    {item.content}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-900 mb-5">
              Follow Us
            </h3>
            <p className="text-base text-gray-600 mb-5">
              Connect with us on social media.
            </p>
            <div className="flex space-x-6">
              {[
                {
                  href: "https://www.linkedin.com/company/sociodent/",
                  icon: <Linkedin size={28} />,
                },
                {
                  href: "https://www.facebook.com/SociodentPrivateLimited/",
                  icon: <Facebook size={28} />,
                },
                {
                  href: "https://www.instagram.com/sociodent.in/",
                  icon: <Instagram size={28} />,
                },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 mt-14 pt-8 text-center md:flex md:justify-between md:text-left">
          <p className="text-base text-gray-600">
            &copy; {new Date().getFullYear()} SocioDent. All rights reserved.
          </p>
          <div className="mt-2 md:mt-0 flex justify-center md:justify-end space-x-8">
            <Link
              to="/privacy-policy"
              onClick={scrollToTop}
              className="text-base px-2 py-1 rounded hover:bg-gray-100"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              onClick={scrollToTop}
              className="text-base px-2 py-1 rounded hover:bg-gray-100"
            >
              Terms of Service
            </Link>
            <Link
              to="/cancellation-refund-policy"
              onClick={scrollToTop}
              className="text-base px-2 py-1 rounded hover:bg-gray-100"
            >
              Cancellation & Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;