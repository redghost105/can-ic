"use client";

import React, { useState } from 'react';
import { Bell, Check, Trash, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications, Notification, NotificationType } from '@/contexts/notification-context';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAllNotifications 
  } = useNotifications();

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening if there are unread notifications
      markAllAsRead();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Handle navigation if link exists
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 text-green-500">
          <Check className="h-5 w-5" />
        </div>;
      case 'error':
        return <div className="flex items-center justify-center h-9 w-9 rounded-full bg-red-100 text-red-500">
          <X className="h-5 w-5" />
        </div>;
      case 'warning':
        return <div className="flex items-center justify-center h-9 w-9 rounded-full bg-yellow-100 text-yellow-500">
          <Bell className="h-5 w-5" />
        </div>;
      default:
        return <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 text-blue-500">
          <Bell className="h-5 w-5" />
        </div>;
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto shadow-lg z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                title="Mark all as read"
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications}
                title="Clear all notifications"
                className="h-8 w-8 p-0"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <button 
                        className="text-gray-400 hover:text-gray-600" 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 