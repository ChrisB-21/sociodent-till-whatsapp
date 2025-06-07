import React, { useState } from "react";

const Signup: React.FC = () => {
  const [role, setRole] = useState<"user" | "doctor" | "admin">("user");
  const [tab, setTab] = useState<"email" | "phone">("email");

  // Example credential state (expand as needed)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    license: "", // for doctor
    adminCode: "", // for admin
    captcha: "",
    captchaInput: "",
    city: "",
    state: "",
    area: "",
    pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (r: "user" | "doctor" | "admin") => {
    setRole(r);
    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      license: "",
      adminCode: "",
      captcha: "KKHX5T",
      captchaInput: "",
      city: "",
      state: "",
      area: "",
      pincode: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your signup logic here
    alert(`Signed up as ${role}`);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded shadow">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="SocioDent" className="h-10" />
      </div>
      <h2 className="text-xl font-bold text-center mb-2">Create Account</h2>
      <div className="flex justify-center mb-4">
        <button
          className={`px-4 py-2 rounded-l ${role === "user" ? "bg-blue-100 font-bold" : "bg-gray-100"}`}
          onClick={() => handleRoleChange("user")}
        >
          User
        </button>
        <button
          className={`px-4 py-2 ${role === "doctor" ? "bg-blue-100 font-bold" : "bg-gray-100"}`}
          onClick={() => handleRoleChange("doctor")}
        >
          Doctor
        </button>
        <button
          className={`px-4 py-2 rounded-r ${role === "admin" ? "bg-blue-100 font-bold" : "bg-gray-100"}`}
          onClick={() => handleRoleChange("admin")}
        >
          Admin
        </button>
      </div>
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 rounded-l ${tab === "email" ? "bg-blue-50 font-bold" : "bg-gray-50"}`}
          onClick={() => setTab("email")}
        >
          Email
        </button>
        <button
          className={`flex-1 py-2 rounded-r ${tab === "phone" ? "bg-blue-50 font-bold" : "bg-gray-50"}`}
          onClick={() => setTab("phone")}
        >
          Phone
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block mb-1">User Name</label>
          <input
            type="text"
            name="name"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        {tab === "email" ? (
          <div className="mb-3">
            <label className="block mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              className="w-full border rounded px-3 py-2"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <div className="mb-3">
            <label className="block mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter your phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div className="mb-3">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full border rounded px-3 py-2"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        {role === "doctor" && (
          <div className="mb-3">
            <label className="block mb-1">Medical License Number</label>
            <input
              type="text"
              name="license"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter your license number"
              value={form.license}
              onChange={handleChange}
              required
            />
          </div>
        )}
        
        {/* Address Fields */}
        <div className="mb-3">
          <label className="block mb-1">City</label>
          <input
            type="text"
            name="city"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your city"
            value={form.city}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">State</label>
          <input
            type="text"
            name="state"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your state"
            value={form.state}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Area/Locality</label>
          <input
            type="text"
            name="area"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your area/locality"
            value={form.area}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Pincode</label>
          <input
            type="text"
            name="pincode"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your pincode"
            value={form.pincode}
            onChange={handleChange}
            required
          />
        </div>
        
        {role === "admin" && (
          <div className="mb-3">
            <label className="block mb-1">Admin Code</label>
            <input
              type="text"
              name="adminCode"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter admin code"
              value={form.adminCode}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div className="mb-3">
          <label className="block mb-1">Verify you're human</label>
          <div className="flex items-center mb-1">
            <span className="px-3 py-2 bg-gray-100 rounded font-mono tracking-widest">{form.captcha}</span>
            <button
              type="button"
              className="ml-2 text-blue-500"
              onClick={() => setForm({ ...form, captcha: "KKHX5T" })} // Replace with random generator
            >
              &#8635;
            </button>
          </div>
          <div className="flex">
            <input
              type="text"
              name="captchaInput"
              className="flex-1 border rounded-l px-3 py-2"
              placeholder="Enter the code above"
              value={form.captchaInput}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-4 rounded-r"
              // Add captcha verification logic here
            >
              Verify
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full mt-4 py-2 rounded bg-red-400 text-white font-bold text-lg"
        >
          {role === "user"
            ? "Sign Up as User"
            : role === "doctor"
            ? "Sign Up as Doctor"
            : "Sign Up as Admin"}
        </button>
      </form>
    </div>
  );
};

export default Signup;