import React from 'react';
import { ChevronRight } from "lucide-react";
import UserTable from './UserTable';

interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  registeredAt: string;
  [key: string]: any;
}

interface DashboardContentProps {
  users: User[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    activeDoctors: number;
    appointments: number;
    revenue: number;
  };
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  onViewUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onViewAllUsers: () => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  users,
  stats,
  formatDate,
  formatCurrency,
  onViewUser,
  onDeleteUser,
  onViewAllUsers
}) => {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm">Total Users</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            <span className="text-sm text-green-600">+12%</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm">Active Doctors</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">{stats?.activeDoctors || 0}</p>
            <span className="text-sm text-green-600">+5%</span>
          </div>
        </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm">Appointments</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">{(stats?.appointments || 0).toLocaleString()}</p>
            <span className="text-sm text-green-600">+18%</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm">Revenue</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenue || 0)}</p>
            <span className="text-sm text-green-600">+8%</span>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Users</h2>
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            onClick={onViewAllUsers}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <UserTable
          users={users}
          formatDate={formatDate}
          onViewUser={onViewUser}
          onDeleteUser={onDeleteUser}
          isCompact={true}
        />
      </div>
    </>
  );
};

export default DashboardContent;
