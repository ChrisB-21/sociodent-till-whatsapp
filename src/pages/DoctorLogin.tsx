import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import SubmitButton from "@/components/auth/SubmitButton";

const DoctorLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate doctor login logic
    if (form.email && form.password) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "doctor");
      localStorage.setItem("userName", "Dr. John Doe");
      window.dispatchEvent(new Event("authChange"));
      navigate("/doctor-portal");
    } else {
      alert("Please enter both email and password.");
    }
  };

  return (
    <AuthLayout title="Doctor Login">
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-gray-700 mb-2 text-sm font-medium">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sociodent-500"
            required
          />
        </div>
        <div className="mb-8">
          <label className="block text-gray-700 mb-2 text-sm font-medium">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sociodent-500"
            required
          />
        </div>
        <SubmitButton type="submit">Login</SubmitButton>
      </form>
      <div className="mt-4 text-center text-gray-500 text-sm">
        Don't have an account?{" "}
        <button
          className="text-blue-600 hover:underline font-medium"
          onClick={() => navigate("/signup?role=doctor")}
          type="button"
        >
          Sign up
        </button>
      </div>
    </AuthLayout>
  );
};

export default DoctorLogin;
