import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchUserReports } from '@/utils/reportUtils';

interface Report {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileType: string;
  fileCategory?: string;
}

export const AdminReportsView: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const reportsList = await fetchUserReports();
        setReports(reportsList);
      } catch (error) {
        console.error('Error loading reports:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reports. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [toast]);

  // Handle download report
  const handleDownloadReport = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: `Downloading ${fileName}`,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">User Reports Management</h2>
        <div className="text-sm text-gray-500">
          {reports.length} files uploaded
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1669AE] mx-auto"></div>
          <h3 className="mt-3 text-sm font-medium text-gray-900">Loading reports...</h3>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">When users upload files, they will
            appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">File Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Upload Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4">{report.userName}</td>
                  <td className="px-4 py-4">{report.userEmail}</td>
                  <td className="px-4 py-4">{report.fileName}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                      {report.fileType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      {report.fileCategory || 'Document'}
                    </span>
                  </td>
                  <td className="px-4 py-4">{report.uploadDate}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleDownloadReport(report.fileUrl, report.fileName)}
                      className="flex items-center text-[#1669AE] hover:text-[#135a94] text-sm font-medium"
                    >
                      <Download className="mr-1" size={14} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReportsView;
