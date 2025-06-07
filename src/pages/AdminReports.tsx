import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminReportsView from '@/components/Admin/AdminReportsView';
import { useToast } from '@/hooks/use-toast';

const AdminReports: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication and role
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const role = localStorage.getItem('userRole') || '';
    setIsAuthenticated(authStatus);
    setUserRole(role);
    
    if (!authStatus || role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to access this page",
        variant: "destructive"
      });
      navigate('/auth?mode=login&role=admin', { replace: true });
    }
  }, [navigate, toast]);

  // Render content only if authenticated and correct role
  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Access Denied. Please log in as admin.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-20 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Admin Report Management</h1>
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center text-[#1669AE] hover:text-[#135a94] text-sm font-medium"
            >
              Back to Admin Portal
            </button>
          </div>
          <AdminReportsView />
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
