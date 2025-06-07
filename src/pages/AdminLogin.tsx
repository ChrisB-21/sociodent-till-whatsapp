import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import SubmitButton from "@/components/auth/SubmitButton";

const AdminLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate admin login logic
    if (form.email && form.password) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userName", "Admin");
      window.dispatchEvent(new Event("authChange"));
      navigate("/admin-portal");
    } else {
      alert("Please enter both email and password.");
    }
  };

  return (
    <AuthLayout title="Admin Login">
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
      {/* No signup link for admins */}
    </AuthLayout>
  );
};

export default AdminLogin;
