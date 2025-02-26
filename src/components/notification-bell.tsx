'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, BellRingIcon, CheckIcon, XIcon } from 'lucide-react';
import { useNotifications, NotificationType } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    
    if (link) {
      router.push(link);
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XIcon className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <BellRingIcon className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <BellIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRingIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`
                      flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                      ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                    onClick={() => handleNotificationClick(notification.id, notification.link)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      {notification.title && (
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      aria-label="Dismiss"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 