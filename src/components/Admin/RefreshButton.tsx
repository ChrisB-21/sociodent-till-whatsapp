import React from 'react';
import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading
}) => {
  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={onRefresh}
      className="flex items-center gap-1"
      disabled={isLoading}
    >
      <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </Button>
  );
};

export default RefreshButton;
