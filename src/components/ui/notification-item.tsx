"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Card } from './card';
import { Button } from './button';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Notification, NotificationType } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const { id, type, title, message, timestamp, read, link } = notification;

  const getIcon = () => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case NotificationType.WARNING:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case NotificationType.INFO:
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleClick = () => {
    if (!read) {
      onMarkAsRead(id);
    }
  };

  const formattedTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const content = (
    <Card 
      className={cn(
        "flex items-start p-4 mb-2 transition-colors duration-200 cursor-pointer",
        !read ? "bg-blue-50 dark:bg-blue-950" : "",
        "hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mr-3 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {message}
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          {formattedTime}
        </span>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6 ml-2 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </Card>
  );

  if (link) {
    return (
      <Link href={link} className="block" onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return content;
} 