"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { 
  Notification as NotificationType,
  useNotifications 
} from '@/contexts/notification-context';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: NotificationType;
  onDismiss: () => void;
}) {
  const { markAsRead } = useNotifications();

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getFormattedDate = () => {
    const date = notification.createdAt;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={cn(
        "p-4 border-b border-gray-100 flex items-start",
        !notification.isRead && "bg-gray-50"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-grow">
        {notification.link ? (
          <Link href={notification.link} className="block">
            <p className="text-sm font-medium">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{getFormattedDate()}</p>
          </Link>
        ) : (
          <>
            <p className="text-sm font-medium">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{getFormattedDate()}</p>
          </>
        )}
      </div>
      <button
        className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const dismissNotification = (id: string) => {
    // Instead of directly using dismissNotification from context,
    // we'll use a local function that marks as read for now
    // This can be replaced once the API endpoint is implemented
    console.log("Dismissing notification", id);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={toggleOpen}
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white z-50 max-h-[500px] flex flex-col">
            <div className="border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllAsRead()}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => dismissNotification(notification.id)}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No notifications</p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 p-3">
              <Link 
                href="/dashboard/settings/notifications" 
                className="text-xs text-blue-500 hover:text-blue-700"
                onClick={() => setIsOpen(false)}
              >
                Notification settings
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function NotificationBanner({ 
  message, 
  type = 'info', 
  onDismiss 
}: { 
  message: string; 
  type?: 'info' | 'success' | 'warning' | 'error'; 
  onDismiss?: () => void; 
}) {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`px-4 py-3 rounded border ${styles[type]} flex items-center`}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

const iconMap = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
};

const bgColorMap = {
  success: 'bg-green-50 border-green-100',
  error: 'bg-red-50 border-red-100',
  info: 'bg-blue-50 border-blue-100',
  warning: 'bg-yellow-50 border-yellow-100',
};

const textColorMap = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
  warning: 'text-yellow-800',
};

export function Notification({
  type,
  title,
  message,
  onClose,
  className,
}: NotificationProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 shadow-md transition-all',
        bgColorMap[type],
        className
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{iconMap[type]}</div>
        <div className="ml-3 flex-1">
          <h3 className={cn('text-sm font-medium', textColorMap[type])}>
            {title}
          </h3>
          {message && (
            <div className={cn('mt-1 text-sm', textColorMap[type])}>
              {message}
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 max-w-md">
      {children}
    </div>
  );
} 