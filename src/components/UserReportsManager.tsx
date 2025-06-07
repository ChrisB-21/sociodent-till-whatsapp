import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { fetchUserReports } from '@/utils/reportUtils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Report = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileType: string;
  fileSize?: number;
  fileCategory?: string;
};

const UserReportsManager = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const userReports = await fetchUserReports();
        setReports(userReports);
      } catch (error) {
        console.error('Error loading reports:', error);
        toast({
          title: "Error",
          description: "Failed to load user reports",
          variant: "destructive"
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
      title: "Download Started",
      description: `Downloading ${fileName}`
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Uploaded Reports</h2>
        <div className="text-sm text-gray-500">
          {reports.length} files uploaded
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1669AE]"></div>
          <span className="ml-2 text-gray-500">Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">
            When users upload files, they will appear here.
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
                    <span className={cn("px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs")}>
                      {report.fileType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs")}>
                      {report.fileCategory || 'Report'}
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

export default UserReportsManager;
