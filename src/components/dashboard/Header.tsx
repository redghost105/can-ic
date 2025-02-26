"use client";

import { useState } from "react";
import { Menu, BellIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Session } from "@/types/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface HeaderProps {
  user: Session;
}

export function Header({ user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    
    // This would normally be implemented by dispatching an event or using a context
    // to communicate with the Sidebar component, but for simplicity we'll just
    // use a global DOM event
    const event = new CustomEvent('toggle-mobile-menu');
    window.dispatchEvent(event);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="mr-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 md:flex-none">
          {/* Page title could go here */}
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-4 py-2 text-sm font-medium border-b">
                {user.name || user.email}
                <div className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </div>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action="/api/auth/signout" method="post" className="w-full">
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 