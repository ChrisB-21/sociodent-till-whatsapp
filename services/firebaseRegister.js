// // src/services/firebaseRegister.js
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { auth, db } from "../firebaseConfig";

// const registerUser = async (formData) => {
//   try {
//     // Create Firebase Auth User
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       formData.email,
//       formData.password
//     );
//     const user = userCredential.user;

//     // Prepare user document data
//     const userDoc = {
//       fullName: formData.fullName,
//       email: formData.email,
//       phone: formData.phone,
//       age: formData.age,
//       gender: formData.gender,
//       state: formData.state,
//       city: formData.city,
//       pincode: formData.pincode,
//       role: "user",  // Default role
//       category: formData.category,
//       disabilityType: formData.disabilityType,
//       medicalConditions: formData.medicalConditions,
//       medications: formData.medications,
//       allergies: formData.allergies,
//       modeOfCare: formData.modeOfCare,
//       createdAt: serverTimestamp(),
//       status: "pending", // For admin approval
//     };

//     // Store in Firestore with UID as document ID
//     await setDoc(doc(db, "users", user.uid), userDoc);

//     return { success: true, userId: user.uid };

//   } catch (error) {
//     console.error("Registration Error: ", error.message);
//     throw error;
//   }
// };

// export default registerUser;
