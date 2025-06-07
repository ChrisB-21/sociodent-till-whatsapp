import React from 'react';
import { cn } from "@/lib/utils";
import { 
  BarChart, Users, User, Shield, Settings, 
  Database, FileText, ShoppingBag, BadgeHelp
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: <BarChart className="w-5 h-5 mr-2" /> },
    { id: "users", name: "User Management", icon: <Users className="w-5 h-5 mr-2" /> },
    { id: "doctors", name: "Doctors", icon: <User className="w-5 h-5 mr-2" /> },
    { id: "verifications", name: "Doctor Verifications", icon: <BadgeHelp className="w-5 h-5 mr-2" /> },
    { id: "products", name: "Products", icon: <ShoppingBag className="w-5 h-5 mr-2" /> },
    { id: "reports", name: "Reports", icon: <FileText className="w-5 h-5 mr-2" /> },
    { id: "database", name: "Database", icon: <Database className="w-5 h-5 mr-2" /> },
    { id: "security", name: "Security", icon: <Shield className="w-5 h-5 mr-2" /> },
    { id: "settings", name: "Settings", icon: <Settings className="w-5 h-5 mr-2" /> }
  ];

  return (
    <div className="lg:w-64 bg-white rounded-lg shadow-sm p-4 h-fit sticky top-20">
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
