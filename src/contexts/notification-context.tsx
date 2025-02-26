"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Notification types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Notification model
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => string;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Context provider
interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 10
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate a unique ID for notifications
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      ...notification,
      isRead: false,
      createdAt: new Date()
    };

    setNotifications(prev => {
      // Limit the number of notifications
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    return id;
  }, [maxNotifications]);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(unreadCount);
  }, [notifications]);

  // Auto-dismiss expired notifications
  useEffect(() => {
    const checkForExpiredNotifications = () => {
      const now = new Date();
      setNotifications(prev =>
        prev.filter(notification => {
          return !notification.expiresAt || notification.expiresAt > now;
        })
      );
    };

    const intervalId = setInterval(checkForExpiredNotifications, 1000 * 60); // Check every minute
    return () => clearInterval(intervalId);
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        // Convert string dates back to Date objects
        const processedNotifications = parsedNotifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
        }));
        setNotifications(processedNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage', error);
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage', error);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        dismissNotification,
        markAsRead,
        markAllAsRead,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 