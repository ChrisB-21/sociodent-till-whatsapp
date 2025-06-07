import React from 'react';
import { cn } from "@/lib/utils";
import { Eye, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  registeredAt: string;
  [key: string]: any;
}

interface UserTableProps {
  users: User[];
  formatDate: (date: string) => string;
  onViewUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  isCompact?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users = [],
  formatDate,
  onViewUser,
  onDeleteUser,
  isCompact = false
}) => {
  // Defensive check for undefined or null users array
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Email/Phone</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Join Date</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, isCompact ? 5 : undefined).map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <Avatar className={isCompact ? "h-6 w-6" : "h-8 w-8"}>
                    <AvatarImage src={user.profilePicture || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      {user.fullName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isCompact ? (
                    <span>{user.fullName || "Unknown"}</span>
                  ) : (
                    <div>
                      <p className="font-medium">{user.fullName || "Unknown User"}</p>
                      {user.id && <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</p>}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                {isCompact ? (
                  <span>{user.email || user.phone || "No contact"}</span>
                ) : (
                  <>
                    {user.email && <p className="text-sm">{user.email}</p>}
                    {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                    {!user.email && !user.phone && <p className="text-sm text-gray-400">No contact</p>}
                  </>
                )}
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    user.role === "doctor"
                      ? "bg-blue-100 text-blue-800"
                      : user.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {user.role || "user"}
                </span>
              </td>
              <td className="px-4 py-4">{user.registeredAt ? formatDate(user.registeredAt) : "Unknown"}</td>
              <td className="px-4 py-4">
                {isCompact ? (
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => onViewUser(user.id)}
                  >
                    View
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => onViewUser(user.id)}
                      title="View user details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-700 text-sm"
                      onClick={() => onDeleteUser(user.id)}
                      title="Delete user"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
