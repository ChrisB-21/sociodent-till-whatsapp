import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DebugInfoProps {
  showDebug: boolean;
  databaseStructure: any;
  allUsers: any[];
  onAddTestUser: () => void;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({
  showDebug,
  databaseStructure,
  allUsers,
  onAddTestUser
}) => {
  if (!showDebug) return null;

  return (
    <>
      {/* Debug Controls */}
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={onAddTestUser}>
          Add Test User
        </Button>
        <Badge variant="outline" className="text-xs bg-yellow-100">
          Debug Mode: {allUsers.length} users loaded
        </Badge>
      </div>

      {/* Debug Information Panel */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
        <h3 className="font-bold mb-2">Database Structure</h3>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(databaseStructure ? Object.keys(databaseStructure) : {}, null, 2)}
        </pre>
        <h3 className="font-bold mt-4 mb-2">First User (if available)</h3>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(allUsers.length > 0 ? allUsers[0] : "No users", null, 2)}
        </pre>
      </div>
    </>
  );
};

export default DebugInfo;
