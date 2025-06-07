// src/components/auth/FormFooter.tsx
import React from "react";
import { Link } from "react-router-dom";

interface FormFooterProps {
  mode: "login" | "signup";
  role?: "user" | "doctor";
}

const FormFooter: React.FC<FormFooterProps> = ({ mode, role = "user" }) => {
  const isDoctor = role === "doctor";
  const isLogin = mode === "login";

  let text: string;
  let linkText: string;
  let linkTo: string;

  if (isDoctor && isLogin) {
    text = "Not Registered as a Doctor with us?";
    linkText = "Sign up";
    linkTo = "/auth?mode=signup&role=doctor";
  } else {
    text = isLogin ? "Don't have an account?" : "Already have an account?";
    linkText = isLogin ? "Sign up" : "Sign in";
    linkTo = isLogin ? "/auth?mode=signup" : "/auth?mode=login";
  }

  return (
    <div className="mt-6 text-center text-sm text-gray-600">
      {text}{" "}
      <Link to={linkTo} className="text-sociodent-600 font-medium hover:underline">
        {linkText}
      </Link>
    </div>
  );
};

export default FormFooter;
