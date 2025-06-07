// // src/pages/Register.js
// import React, { useState } from "react";
// import registerUser from "../services/firebaseRegister";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     phone: "",
//     age: "",
//     gender: "",
//     state: "",
//     city: "",
//     pincode: "",
//     category: "",
//     disabilityType: "",
//     medicalConditions: "",
//     medications: "",
//     allergies: "",
//     modeOfCare: ""
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     try {
//       await registerUser(formData);
//       setSuccess(true);
//     } catch (err) {
//       setError(err.message);
//     }
//     setLoading(false);
//   };

//   if (success) return <div>Registration successful!</div>;

//   return (
//     <form onSubmit={handleSubmit}>
//       <input name="fullName" onChange={handleChange} placeholder="Full Name" required />
//       <input name="email" type="email" onChange={handleChange} placeholder="Email" required />
//       <input name="password" type="password" onChange={handleChange} placeholder="Password" required />
//       <input name="phone" onChange={handleChange} placeholder="Phone" required />
//       {/* Add other fields as needed */}
//       <button type="submit" disabled={loading}>
//         {loading ? "Registering..." : "Register"}
//       </button>
//       {error && <div style={{ color: "red" }}>{error}</div>}
//     </form>
//   );
// };

// export default Register;
