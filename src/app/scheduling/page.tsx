"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ScheduleManager from "@/components/scheduling/ScheduleManager";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/types/scheduling";
import { CalendarClock, Clock, CheckCircle2, AlertCircle, Car, User, MapPin } from 'lucide-react';

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState("driver");
  const [userRole, setUserRole] = useState<'admin' | 'customer' | 'driver' | 'mechanic'>('admin');
  
  // These would be fetched from authentication in a real app
  const userId = 'admin-1';
  
  // Mock stats for dashboard cards
  const stats = {
    driver: {
      todayAppointments: 5,
      pendingPickups: 2,
      pendingDeliveries: 3,
      completedToday: 4,
      onTimeRate: 95,
      vehiclesCovered: 12
    },
    customer: {
      scheduledServices: 3,
      pendingPickups: 1,
      pendingDeliveries: 1,
      completedServices: 8
    },
    mechanic: {
      scheduledRepairs: 7,
      pendingInspections: 3,
      waitingForParts: 2,
      completedRepairs: 15
    },
    admin: {
      totalActiveAppointments: 28,
      pendingAssignments: 4,
      conflictedSchedules: 1,
      driversAvailable: 6,
      completionRate: 92
    }
  };
  
  // Handlers for ScheduleManager component
  const handleCreateAppointment = async (appointment: Partial<Appointment>) => {
    console.log('Creating appointment:', appointment);
    // This would call the API in a real app
    return Promise.resolve();
  };
  
  const handleCancelAppointment = async (appointmentId: string) => {
    console.log('Cancelling appointment:', appointmentId);
    // This would call the API in a real app
    return Promise.resolve();
  };
  
  const handleRescheduleAppointment = async (appointmentId: string, newTimeSlotId: string) => {
    console.log('Rescheduling appointment:', appointmentId, 'to timeslot:', newTimeSlotId);
    // This would call the API in a real app
    return Promise.resolve();
  };
  
  // Role selection for demo purposes
  const handleRoleChange = (role: 'admin' | 'customer' | 'driver' | 'mechanic') => {
    setUserRole(role);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Scheduling & Appointments</h1>
        
        {/* Role switcher for demo purposes */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">View as:</span>
          <div className="flex space-x-1">
            <Button 
              variant={userRole === 'admin' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleRoleChange('admin')}
            >
              Admin
            </Button>
            <Button 
              variant={userRole === 'driver' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleRoleChange('driver')}
            >
              Driver
            </Button>
            <Button 
              variant={userRole === 'mechanic' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleRoleChange('mechanic')}
            >
              Mechanic
            </Button>
            <Button 
              variant={userRole === 'customer' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleRoleChange('customer')}
            >
              Customer
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats cards based on role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userRole === 'driver' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.driver.todayAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.driver.pendingPickups} pickups, {stats.driver.pendingDeliveries} deliveries
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.driver.completedToday}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.driver.onTimeRate}% on-time rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vehicles Covered</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.driver.vehiclesCovered}</div>
                <p className="text-xs text-muted-foreground">
                  This week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.driver.onTimeRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </>
        )}
        
        {userRole === 'customer' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Services</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customer.scheduledServices}</div>
                <p className="text-xs text-muted-foreground">
                  Upcoming appointments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customer.pendingPickups}</div>
                <p className="text-xs text-muted-foreground">
                  Vehicles to be picked up
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customer.pendingDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  Vehicles to be delivered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Services</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customer.completedServices}</div>
                <p className="text-xs text-muted-foreground">
                  All-time services
                </p>
              </CardContent>
            </Card>
          </>
        )}
        
        {userRole === 'mechanic' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Repairs</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mechanic.scheduledRepairs}</div>
                <p className="text-xs text-muted-foreground">
                  Upcoming work
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mechanic.pendingInspections}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting diagnostic
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Waiting for Parts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mechanic.waitingForParts}</div>
                <p className="text-xs text-muted-foreground">
                  Orders in progress
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Repairs</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mechanic.completedRepairs}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </>
        )}
        
        {userRole === 'admin' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Appointments</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admin.totalActiveAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  System-wide scheduled events
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admin.pendingAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  Needs driver allocation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drivers Available</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admin.driversAvailable}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for assignments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admin.completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  On-time completion
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Main scheduling component */}
      <Card className="border-t">
        <CardHeader>
          <CardTitle>
            {userRole === 'driver' ? 'My Schedule' : 
             userRole === 'customer' ? 'My Appointments' : 
             userRole === 'mechanic' ? 'Shop Schedule' : 
             'Schedule Management'}
          </CardTitle>
          <CardDescription>
            {userRole === 'driver' ? 'Manage your pickup and delivery schedule' : 
             userRole === 'customer' ? 'View and schedule service appointments' : 
             userRole === 'mechanic' ? 'View upcoming vehicle services and repairs' : 
             'System-wide schedule management'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleManager
            userRole={userRole}
            userId={userId}
            onCreateAppointment={handleCreateAppointment}
            onCancelAppointment={handleCancelAppointment}
            onRescheduleAppointment={handleRescheduleAppointment}
          />
        </CardContent>
      </Card>
    </div>
  );
} 