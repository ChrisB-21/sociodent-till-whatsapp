import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, MoreHorizontal, Star, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  verified?: boolean;
  rating?: number;
  appointmentsCount?: number;
  registeredAt: string;
  profilePicture?: string;
  [key: string]: any;
}

interface DoctorManagementProps {
  doctors: Doctor[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  formatDate: (date: string) => string;
  onViewDoctor: (doctorId: string) => void;
  onVerifyDoctor?: (doctorId: string, status: boolean) => void;
}

export const DoctorManagement: React.FC<DoctorManagementProps> = ({
  doctors,
  searchTerm,
  onSearchChange,
  formatDate,
  onViewDoctor,
  onVerifyDoctor
}) => {
  const [sortBy, setSortBy] = useState<string>("date");

  // Sort doctors based on selected criteria
  const sortedDoctors = [...doctors].sort((a, b) => {
    switch(sortBy) {
      case "name":
        return (a.fullName || "").localeCompare(b.fullName || "");
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "appointments":
        return (b.appointmentsCount || 0) - (a.appointmentsCount || 0);
      case "date":
      default:
        const dateA = new Date(a.registeredAt || 0).getTime();
        const dateB = new Date(b.registeredAt || 0).getTime();
        return dateB - dateA;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Doctor Management</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors..."
              className="px-10 py-2 border rounded-md text-sm w-64"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <select 
            className="text-sm border rounded px-3 py-2 bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by: Recent</option>
            <option value="name">Sort by: Name</option>
            <option value="rating">Sort by: Rating</option>
            <option value="appointments">Sort by: Appointments</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-700">Doctor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Specialization</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Metrics</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Join Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDoctors.map((doctor) => (
              <tr key={doctor.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={doctor.profilePicture || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {doctor.fullName?.charAt(0).toUpperCase() || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{doctor.fullName || "Unknown Doctor"}</p>
                      <p className="text-xs text-gray-500">{doctor.email || doctor.phone || "No contact"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span>{doctor.specialization || "General"}</span>
                </td>
                <td className="px-4 py-4">
                  <Badge 
                    className={cn(
                      doctor.verified 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    )}
                  >
                    {doctor.verified ? "Verified" : "Pending"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{doctor.rating || "0"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{doctor.appointmentsCount || "0"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {formatDate(doctor.registeredAt) || "Unknown"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDoctor(doctor.id)}
                    >
                      View
                    </Button>
                    
                    {onVerifyDoctor && (
                      <Button 
                        variant={doctor.verified ? "destructive" : "default"}
                        size="sm"
                        onClick={() => onVerifyDoctor(doctor.id, !doctor.verified)}
                      >
                        {doctor.verified ? (
                          <XCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        {doctor.verified ? "Revoke" : "Verify"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center">No doctors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorManagement;
