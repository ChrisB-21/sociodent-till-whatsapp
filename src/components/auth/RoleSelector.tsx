
import React from 'react';
import { Link } from 'react-router-dom';
import { User, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  role: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ role }) => {
  const roleButtons = [
    { 
      name: 'User', 
      role: 'user', 
      icon: <User size={20} className="mr-2" />
    },
    { 
      name: 'Doctor', 
      role: 'doctor', 
      icon: <img src="/doc-icon.png" alt="Doctor" className="w-5 h-5 mr-2" />
    },
    { 
      name: 'Admin', 
      role: 'admin', 
      icon: <UserCog size={20} className="mr-2" />
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-3 gap-2">
        {roleButtons.map((button) => (
          <Link
            key={button.role}
            to={`/auth?mode=login&role=${button.role}`}
            className={cn(
              "flex items-center justify-center py-2 px-4 rounded-lg transition-all",
              role === button.role
                ? "bg-sociodent-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {button.icon}
            <span className="text-sm">{button.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
