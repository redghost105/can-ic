"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Your service request has been approved", read: false },
    { id: 2, message: "Mechanic is on the way to your location", read: false },
    { id: 3, message: "Your vehicle is ready for pickup", read: false },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(unreadCount - 1);
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 border-b last:border-0 cursor-pointer ${
                  notification.read ? "bg-gray-50" : "bg-blue-50"
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div>
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">Just now</p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 