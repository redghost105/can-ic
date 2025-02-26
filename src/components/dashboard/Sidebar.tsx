"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  Car, 
  User,
  Truck,
  LogOut,
  CreditCard,
  Settings,
  Menu,
  X,
  Calendar,
  MessageSquare,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@/types/auth";

interface SidebarProps {
  user: Session;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    {
      label: "Dashboard",
      href: `/dashboard/${user.role}`,
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: "Service Requests",
      href: "/dashboard/service-requests",
      icon: <Package className="w-5 h-5" />,
      roles: ["customer", "admin", "shop"],
    },
    {
      label: "Available Jobs",
      href: "/dashboard/available-jobs",
      icon: <Truck className="w-5 h-5" />,
      roles: ["driver"],
    },
    {
      label: "My Assignments",
      href: "/dashboard/my-assignments",
      icon: <Package className="w-5 h-5" />,
      roles: ["driver", "shop"],
    },
    {
      label: "Vehicles",
      href: "/dashboard/vehicles",
      icon: <Car className="w-5 h-5" />,
      roles: ["customer"],
    },
    {
      label: "Schedule",
      href: "/dashboard/schedule",
      icon: <Calendar className="w-5 h-5" />,
      roles: ["shop", "driver"],
    },
    {
      label: "Messaging",
      href: "/dashboard/messaging",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      label: "Earnings",
      href: "/dashboard/earnings",
      icon: <CreditCard className="w-5 h-5" />,
      roles: ["driver", "shop"],
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: <User className="w-5 h-5" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            MechanicOnDemand
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile menu button - displayed in Header component */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-200 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleMobileMenu}
        ></div>

        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-30 transform transition-transform duration-200 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              MechanicOnDemand
            </h1>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <nav className="overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      pathname === item.href
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3">Sign Out</span>
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
} 