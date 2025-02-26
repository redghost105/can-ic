"use client";

import { useState, useEffect } from 'react';
import { 
  Car, Users, Wrench, CalendarDays, DollarSign, BarChart, 
  UserCog, Settings, LifeBuoy, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireRole } from '@/lib/auth';
import { fetchAdminDashboardData } from '@/lib/data-fetchers';
import { Bar, Pie } from 'react-chartjs-2';
import Link from 'next/link';

interface DashboardStat {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
}

export default async function AdminDashboard() {
  // Ensure user is an admin
  const session = await requireRole('admin');
  
  // Fetch admin dashboard data
  const data = await fetchAdminDashboardData();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-bold">{data.stats.totalUsers}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <Wrench className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Services</p>
              <h3 className="text-2xl font-bold">{data.stats.activeServices}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <Car className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registered Vehicles</p>
              <h3 className="text-2xl font-bold">{data.stats.totalVehicles}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <CreditCard className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <h3 className="text-2xl font-bold">${data.stats.monthlyRevenue.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/admin/users">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/shops">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <Wrench className="h-6 w-6" />
              <span>Manage Shops</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/requests">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <Car className="h-6 w-6" />
              <span>Service Requests</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/finance">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span>Financial Overview</span>
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Alerts & Issues */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Alerts & Issues</h2>
        
        {data.alerts.length > 0 ? (
          <div className="space-y-4">
            {data.alerts.map((alert, index) => (
              <Card key={index} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4 flex items-start gap-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">{alert.title}</h3>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                    <div className="mt-2">
                      <Link href={alert.actionLink}>
                        <Button size="sm" variant="ghost">{alert.actionText}</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No active alerts</p>
            </CardContent>
          </Card>
        )}
      </section>
      
      {/* Key Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {/* Replace with actual chart component */}
              <div className="bg-gray-100 h-full rounded flex items-center justify-center">
                <p className="text-gray-500">Service Requests Chart</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {/* Replace with actual chart component */}
              <div className="bg-gray-100 h-full rounded flex items-center justify-center">
                <p className="text-gray-500">Revenue Chart</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 