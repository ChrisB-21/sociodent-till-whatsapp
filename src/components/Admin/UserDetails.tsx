import React from 'react';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  registeredAt: string;
  age?: number;
  allergies?: string;
  profilePicture?: string;
  [key: string]: any;
}

interface UserDetailsProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (userId: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  formatDate: (date: string) => string;
  showDebug?: boolean;
}

export const UserDetails: React.FC<UserDetailsProps> = ({
  user,
  isOpen,
  onClose,
  onDelete,
  onUpdateRole,
  formatDate,
  showDebug = false
}) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profilePicture || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-lg">{user.fullName || "Unknown User"}</h3>
              <div className="flex items-center gap-2">
                <Badge className={
                  user.role === "doctor"
                    ? "bg-blue-100 text-blue-800"
                    : user.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }>
                  {user.role || "user"}
                </Badge>
                <div className="relative">
                  <select 
                    className="text-xs border rounded px-2 py-1 appearance-none pr-6 bg-white"
                    value={user.role || "user"}
                    onChange={(e) => onUpdateRole(user.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <svg className="w-4 h-4 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="text-sm">{user.email || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Phone Number</Label>
              <p className="text-sm">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Joined On</Label>
              <p className="text-sm">{formatDate(user.registeredAt) || "Unknown"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Age</Label>
              <p className="text-sm">{user.age || "Not specified"}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-500">Allergies</Label>
              <p className="text-sm">{user.allergies || "None"}</p>
            </div>

            {/* Show all user data in debug mode */}
            {showDebug && (
              <div className="col-span-2 mt-4">
                <Label className="text-xs text-gray-500">Raw User Data</Label>
                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onDelete(user.id)}
            >
              Delete User
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetails;
