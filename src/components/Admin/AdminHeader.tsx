// import React from 'react';
// import { Shield } from "lucide-react";

// interface AdminHeaderProps {
//   username: string;
//   onLogout: () => void;
//   onToggleDebug: () => void;
//   showDebug: boolean;
//   dropdownOpen: boolean;
//   setDropdownOpen: (open: boolean) => void;
// }

// export const AdminHeader: React.FC<AdminHeaderProps> = ({
//   username,
//   onLogout,
//   onToggleDebug,
//   showDebug,
//   dropdownOpen,
//   setDropdownOpen
// }) => {
//   return (
//     <header className="w-full bg-white py-4 px-8 flex items-center justify-between shadow-sm">
//       <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
//       <div className="text-gray-700 font-semibold flex items-center gap-2">
//         <Shield className="w-5 h-5" />
//         <span>Welcome, {username || "Admin"}</span>
//         <div className="relative ml-2">
//           <button
//             onClick={() => setDropdownOpen(!dropdownOpen)}
//             className="flex items-center focus:outline-none"
//           >
//             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
//             </svg>
//           </button>
          
//           {dropdownOpen && (
//             <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
//               <button
//                 onClick={onLogout}
//                 className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 Log out
//               </button>
//               <button
//                 onClick={onToggleDebug}
//                 className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 {showDebug ? "Hide Debug Info" : "Show Debug Info"}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default AdminHeader;
