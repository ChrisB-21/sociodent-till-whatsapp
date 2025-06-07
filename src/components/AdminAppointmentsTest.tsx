// This is a testing tool for the admin portal appointment confirmation issue
import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminAppointmentsManager from './AdminAppointmentsManager';
import { toast } from '@/hooks/use-toast'; // The hook for showing toast notifications
import { Toaster } from '@/components/ui/toaster'; // The actual component that's exported

// Create a simple wrapper component
const TestApp = () => {
  return (
    <>
      <Toaster />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Appointments Test</h1>
        <AdminAppointmentsManager />
      </div>
    </>
  );
};

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<TestApp />);
}
