// To update in AdminPortal.tsx - Reports tab section
import React from 'react';
import { Button } from 'react-bootstrap'; // Using React Bootstrap instead
import { FileText } from 'lucide-react';

interface AdminPortalReportsUpdateProps {
  activeTab: string;
  navigate: (path: string) => void;
}

const AdminPortalReportsUpdate: React.FC<AdminPortalReportsUpdateProps> = ({ activeTab, navigate }) => {
  return (
    <>
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">User Reports Management</h2>
      <div className="text-sm text-gray-500">
        All user reports are now available in dedicated reports view
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Enhanced Reports Management</h3>
      <p className="mt-2 text-sm text-gray-500">
        Access all user reports in one centralized location for better organization.
      </p>
      <Button 
        onClick={() => navigate('/admin/reports')}
        className="mt-2 bg-[#1669AE] hover:bg-[#135a94]"
      >
        <FileText className="mr-2 h-4 w-4" />
        View All User Reports
      </Button>
    </div>
  </div>
      )}
    </>
  );
};

export default AdminPortalReportsUpdate;
