"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { NotificationItem } from './notification-item';
import { useNotifications } from '@/contexts/notification-context';
import { ScrollArea } from './scroll-area';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotifications();

  // Filter notifications into unread and read
  const unreadNotifications = notifications.filter(notification => !notification.read);
  const readNotifications = notifications.filter(notification => notification.read);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg" side="right">
        <SheetHeader className="flex flex-row justify-between items-center mb-6">
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  markAllAsRead();
                }}
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  clearNotifications();
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[calc(100vh-170px)]">
              {unreadNotifications.length > 0 ? (
                <div className="space-y-2 p-1">
                  {unreadNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No unread notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[calc(100vh-170px)]">
              {notifications.length > 0 ? (
                <div className="space-y-2 p-1">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
} 