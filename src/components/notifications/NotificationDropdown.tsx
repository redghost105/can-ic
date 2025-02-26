"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { 
  getUserNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead 
} from '@/utils/notification-service';
import { Notification, NotificationType } from '@/types/models';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  CreditCard, 
  MessageSquare, 
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationsViewed: () => void;
}

export default function NotificationDropdown({ 
  onClose, 
  onNotificationsViewed 
}: NotificationDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      setLoading(true);
      const userNotifications = await getUserNotifications(user.id);
      setNotifications(userNotifications);
      setLoading(false);
    };
    
    fetchNotifications();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    await markAllNotificationsAsRead(user.id);
    
    // Update notifications in state
    setNotifications(notifications.map(notification => ({
      ...notification,
      is_read: true
    })));
    
    onNotificationsViewed();
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    
    // Update in state
    setNotifications(
      notifications.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );
    
    // Navigate based on notification type and related_id
    if (notification.related_id) {
      switch (notification.type) {
        case 'service_request_status':
          router.push(`/dashboard/service-requests/${notification.related_id}`);
          break;
        case 'payment_status':
          router.push(`/dashboard/service-requests/${notification.related_id}/payment`);
          break;
        case 'driver_assigned':
        case 'mechanic_assigned':
        case 'vehicle_ready':
          router.push(`/dashboard/service-requests/${notification.related_id}`);
          break;
        case 'review_request':
          router.push(`/dashboard/service-requests/${notification.related_id}/review`);
          break;
        default:
          // For system notifications, just close the dropdown
          break;
      }
    }
    
    onClose();
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'service_request_status':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'payment_status':
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'driver_assigned':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'mechanic_assigned':
        return <Settings className="h-5 w-5 text-orange-500" />;
      case 'vehicle_ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'review_request':
        return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50"
    >
      <div className="flex justify-between items-center p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-700">Notifications</h3>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div 
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex">
                    <div className="mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <p className={`font-medium ${!notification.is_read ? 'text-blue-700' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                  </div>
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 bg-gray-50 text-center">
        <Button 
          variant="link" 
          className="text-sm"
          onClick={() => {
            router.push('/dashboard/settings#notifications');
            onClose();
          }}
        >
          Notification Settings
        </Button>
      </div>
    </div>
  );
} 