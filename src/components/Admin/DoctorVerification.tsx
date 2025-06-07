import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DoctorVerificationData {
  id: string;
  doctorId: string;
  fullName: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  documents?: {
    licenseDoc?: string;
    degreeDoc?: string;
    identityDoc?: string;
    [key: string]: any;
  };
  comments?: string;
  profilePicture?: string;
  [key: string]: any;
}

interface DoctorVerificationProps {
  verificationRequests: DoctorVerificationData[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  formatDate: (date: string) => string;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
  onViewDoctorProfile: (doctorId: string) => void;
}

export const DoctorVerification: React.FC<DoctorVerificationProps> = ({
  verificationRequests,
  searchTerm,
  onSearchChange,
  formatDate,
  onApproveRequest,
  onRejectRequest,
  onViewDoctorProfile
}) => {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<DoctorVerificationData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const filteredRequests = verificationRequests.filter(req => {
    if (activeTab !== "all" && req.status !== activeTab) {
      return false;
    }
    if (!searchTerm) {
      return true;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (req.fullName || "").toLowerCase().includes(searchTermLower) ||
      (req.email || "").toLowerCase().includes(searchTermLower) ||
      (req.licenseNumber || "").toLowerCase().includes(searchTermLower) ||
      (req.specialization || "").toLowerCase().includes(searchTermLower)
    );
  });

  const handleViewDetails = (request: DoctorVerificationData) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleRejectWithReason = () => {
    if (selectedRequest && rejectionReason.trim()) {
      onRejectRequest(selectedRequest.id, rejectionReason);
      setShowDetailsModal(false);
      setRejectionReason("");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Doctor Verification Requests</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and process verification requests from healthcare professionals
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                className="px-10 py-2 border rounded-md text-sm w-64"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                {verificationRequests.filter(req => req.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All Requests</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Doctor</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">License</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Specialization</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.profilePicture || ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-800">
                              {request.fullName?.charAt(0).toUpperCase() || "D"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.fullName || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{request.email || request.phone || "No contact"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono">{request.licenseNumber || "Not provided"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span>{request.specialization || "Not specified"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getStatusBadgeClass(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {formatDate(request.submittedAt) || "Unknown"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onApproveRequest(request.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center">No verification requests found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verification Request Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedRequest.profilePicture || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                    {selectedRequest.fullName?.charAt(0).toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold text-lg">{selectedRequest.fullName || "Unknown Doctor"}</h3>
                  <p className="text-sm text-gray-600">{selectedRequest.email || selectedRequest.phone || "No contact"}</p>
                  <Badge className={getStatusBadgeClass(selectedRequest.status)}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">License Number</p>
                  <p className="text-sm font-mono">{selectedRequest.licenseNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Specialization</p>
                  <p className="text-sm">{selectedRequest.specialization || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted On</p>
                  <p className="text-sm">{formatDate(selectedRequest.submittedAt) || "Unknown"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-2">Uploaded Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRequest.documents?.licenseDoc && (
                    <Button variant="outline" className="text-sm flex items-center justify-between" onClick={() => window.open(selectedRequest.documents?.licenseDoc, '_blank')}>
                      License Document
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {selectedRequest.documents?.degreeDoc && (
                    <Button variant="outline" className="text-sm flex items-center justify-between" onClick={() => window.open(selectedRequest.documents?.degreeDoc, '_blank')}>
                      Degree Certificate
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {selectedRequest.documents?.identityDoc && (
                    <Button variant="outline" className="text-sm flex items-center justify-between" onClick={() => window.open(selectedRequest.documents?.identityDoc, '_blank')}>
                      Identity Document
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
              
              {selectedRequest.status === "pending" && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Rejection Reason (if applicable)</p>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                    placeholder="Provide reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
              
              {selectedRequest.status === "rejected" && selectedRequest.comments && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rejection Reason</p>
                  <p className="text-sm bg-red-50 p-2 rounded">{selectedRequest.comments}</p>
                </div>
              )}

              <DialogFooter className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => onViewDoctorProfile(selectedRequest.doctorId)}
                >
                  View Doctor Profile
                </Button>
                
                <div className="flex gap-2">
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => {
                          onApproveRequest(selectedRequest.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleRejectWithReason}
                        disabled={!rejectionReason.trim()}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedRequest.status !== "pending" && (
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default DoctorVerification;
