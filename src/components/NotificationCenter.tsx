import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getNotificationsForUser, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/lib/notifications';

interface NotificationCenterProps {
  userId: string;
  userType: 'doctor' | 'patient' | 'admin';
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userType }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications on component mount and when userId changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const userNotifications = await getNotificationsForUser(userId);
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up polling to check for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.id || notification.isRead) return;
    
    try {
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Handle navigation based on notification type
      if (notification.relatedTo?.type === 'appointment') {
        // Navigate to appointment details
        // This will depend on your routing setup
        // history.push(`/appointments/${notification.relatedTo.id}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await markAllNotificationsAsRead(userId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Helper function to format relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Notification type to icon/color mapping
  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'appointment_assigned':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'appointment_confirmed':
        return { color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'appointment_cancelled':
        return { color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'appointment_reminder':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button 
        className="p-2 rounded-full hover:bg-gray-100 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-sociodent-600 hover:text-sociodent-700"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => {
                const style = getNotificationStyle(notification.type);
                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className={`rounded-full p-2 mr-3 ${style.bgColor}`}>
                        <Bell className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium ${!notification.isRead ? 'text-black' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 text-center border-t">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-sm text-sociodent-600 hover:text-sociodent-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
