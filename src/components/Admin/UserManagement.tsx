import React, { useState } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { update, ref } from "firebase/database";
import { db } from "@/firebase";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  status?: string;
  [key: string]: any;
};

type Props = {
  users: User[];
  toast: (args: any) => void;
  loading: boolean;
};

const UserManagement: React.FC<Props> = ({ users, toast, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: "ascending" | "descending" } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter users
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort users
  const sortedUsers = React.useMemo(() => {
    if (!sortConfig) return filteredUsers;
    const sorted = [...filteredUsers].sort((a, b) => {
      if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortConfig]);

  const requestSort = (key: keyof User) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof User) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleSuspend = async (userId: string) => {
    await update(ref(db, `users/${userId}`), { status: "suspended" });
    toast({
      title: "User Suspended",
      description: "The user has been suspended.",
      variant: "destructive"
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">User Management</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="pl-8 pr-3 py-2 border rounded-md text-sm"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="ml-2 text-xs px-3 py-1 rounded bg-blue-100 text-blue-700"
            onClick={() => requestSort("name")}
          >
            Sort by Name {getSortIndicator("name")}
          </button>
          <button
            className="ml-2 text-xs px-3 py-1 rounded bg-blue-100 text-blue-700"
            onClick={() => requestSort("email")}
          >
            Sort by Email {getSortIndicator("email")}
          </button>
          <button
            className="ml-2 text-xs px-3 py-1 rounded bg-blue-100 text-blue-700"
            onClick={() => requestSort("role")}
          >
            Sort by Role {getSortIndicator("role")}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Join Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">No users found.</td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      user.role === "doctor"
                        ? "bg-blue-100 text-blue-800"
                        : user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2">{user.joinDate}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : user.status === "suspended"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-600 hover:underline mr-4"
                      onClick={() => setSelectedUser(user)}
                    >
                      View
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleSuspend(user.id)}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4">User Details</h3>
            <div className="space-y-2">
              <div><b>Name:</b> {selectedUser.name}</div>
              <div><b>Email:</b> {selectedUser.email}</div>
              <div><b>Role:</b> {selectedUser.role}</div>
              <div><b>Join Date:</b> {selectedUser.joinDate}</div>
              <div><b>Status:</b> {selectedUser.status}</div>
              {/* Show all other fields if needed */}
              {Object.keys(selectedUser)
                .filter(
                  (k) =>
                    !["id", "name", "email", "role", "joinDate", "status"].includes(k)
                )
                .map((key) => (
                  <div key={key}>
                    <b>{key}:</b> {String(selectedUser[key])}
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
