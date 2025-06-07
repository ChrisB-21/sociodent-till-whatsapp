
// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Mail, Phone, Eye, EyeOff } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import { Captcha } from '@/components/ui/captcha';
// import AuthTypeToggle from './AuthTypeToggle';

// interface CredentialsFormProps {
//   mode: string;
//   authType: 'email' | 'phone';
//   setAuthType: (type: 'email' | 'phone') => void;
//   email: string;
//   setEmail: (email: string) => void;
//   phone: string;
//   setPhone: (phone: string) => void;
//   password: string;
//   setPassword: (password: string) => void;
//   name: string;
//   setName: (name: string) => void;
//   onCaptchaVerify: (isVerified: boolean) => void;
// }

// const CredentialsForm: React.FC<CredentialsFormProps> = ({
//   mode,
//   authType,
//   setAuthType,
//   email,
//   setEmail,
//   phone,
//   setPhone,
//   password,
//   setPassword,
//   name,
//   setName,
//   onCaptchaVerify,
// }) => {
//   const [showPassword, setShowPassword] = useState(false);

//   return (
//     <>
//       <AuthTypeToggle authType={authType} setAuthType={setAuthType} />
      
//       {mode === 'signup' && (
//         <div className="mb-4">
//           <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
//             Full Name
//           </label>
//           <input
//             type="text"
//             id="name"
//             className="input-primary"
//             placeholder="John Doe"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />
//         </div>
//       )}
      
//       {authType === 'email' ? (
//         <div className="mb-4">
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//             Email Address
//           </label>
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
//               <Mail size={16} className="text-gray-400" />
//             </div>
//             <input
//               type="email"
//               id="email"
//               className="input-primary pl-10"
//               placeholder="name@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </div>
//         </div>
//       ) : (
//         <div className="mb-4">
//           <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
//             Phone Number
//           </label>
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
//               <Phone size={16} className="text-gray-400" />
//             </div>
//             <input
//               type="tel"
//               id="phone"
//               className="input-primary pl-10"
//               placeholder="+91 12345 67890"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//             />
//           </div>
//         </div>
//       )}
      
//       {authType === 'email' && (
//         <div className="mb-6">
//           <div className="flex justify-between mb-1">
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//               Password
//             </label>
//             {mode === 'login' && (
//               <Link to="/forgot-password" className="text-sm text-sociodent-600 hover:text-sociodent-700">
//                 Forgot password?
//               </Link>
//             )}
//           </div>
//           <div className="relative">
//             <input
//               type={showPassword ? "text" : "password"}
//               id="password"
//               className="input-primary pr-10"
//               placeholder="••••••••"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//             <button
//               type="button"
//               className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>
//       )}
      
//       <div className="mb-6">
//         <Captcha 
//           onVerify={onCaptchaVerify} 
//           className="mb-4"
//         />
//       </div>
//     </>
//   );
// };

// export default CredentialsForm;
