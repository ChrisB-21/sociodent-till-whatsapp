import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserReportsManager from '@/components/UserReportsManager';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const AdminReportsPage = () => {
  const navigate = useNavigate();
  
  // Check authentication before mounting component
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    
    if (!isAuthenticated || userRole !== 'admin') {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);
  
  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center text-[#1669AE] hover:text-[#135a94]"
          onClick={() => navigate('/admin-portal')}
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to Admin Portal
        </Button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Portal - Reports Management</h1>
        <p className="text-gray-500">View and download all user uploaded reports</p>
      </div>
      
      <UserReportsManager />
    </div>
  );
};

export default AdminReportsPage;
