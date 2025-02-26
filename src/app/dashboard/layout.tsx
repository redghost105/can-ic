"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, redirect } from "next/navigation";
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
  X
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify user is authenticated
  const session = await getSession();
  
  if (!session) {
    return redirect('/login');
  }

  return (
    <div className="h-screen flex">
      <Sidebar user={session} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session} />
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
} 