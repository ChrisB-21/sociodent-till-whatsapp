import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Mail, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DoctorPendingApproval = () => {
  const navigate = useNavigate();
  const { logout, user, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('DoctorPendingApproval: Refreshing user data...');
      await refreshUserData();
      console.log('DoctorPendingApproval: User data refreshed, new user state:', user);
      
      // Give a small delay to ensure state has updated
      setTimeout(() => {
        // If status is now approved, the parent component should re-render
        if (user?.status === 'approved') {
          console.log('DoctorPendingApproval: Status is now approved, component should re-render');
        }
      }, 100);
      
    } catch (error) {
      console.error('DoctorPendingApproval: Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-100 p-4 rounded-full">
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Application Under Review
        </h1>
        
        {/* Debug info - can be removed in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4 text-left text-xs">
            <strong>Debug Info:</strong><br/>
            Status: {user?.status || 'undefined'}<br/>
            Role: {user?.role}<br/>
            UID: {user?.uid}<br/>
            Name: {user?.name}
          </div>
        )}
        
          <p className="text-gray-600 mb-6 leading-relaxed">
          Thank you for registering, <span className="font-semibold text-[#1669AE]">{user?.name}</span>! 
          Your doctor application is currently being reviewed by our admin team.
        </p>
        
        {user?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">
              Your application has been rejected. Please contact support for more information.
            </p>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Email Notification</span>
          </div>
          <p className="text-blue-700 text-sm">
            You'll receive an email notification once your account is approved. 
            This process typically takes 1-2 business days.
          </p>
        </div>
          <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking Status...' : 'Check Approval Status'}
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#1669AE] text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default DoctorPendingApproval;
