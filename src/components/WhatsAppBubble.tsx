import React, { useEffect, useState } from "react";

export default function WhatsAppBubble() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show icon only if user scrolled down 100px or more
      setVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check in case page loads scrolled
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <a
      href="https://wa.me/919043561043"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className={`fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <img
        src="/whatsapp-logo.png"
        alt="WhatsApp"
        className="w-10 h-10"
      />
    </a>
  );
}
