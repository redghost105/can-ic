"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

// These components would be separated into their own files in a real application
const CustomerDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Car Owner Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">Request New Service</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Need maintenance or repairs for your vehicle? Request a new service now.
        </p>
        <Link href="/dashboard/service-requests/new">
          <Button>Request Service</Button>
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">Ongoing Services</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You have <span className="font-bold text-blue-600">2</span> ongoing service requests.
        </p>
        <Link href="/dashboard/service-requests">
          <Button variant="outline">View Details</Button>
        </Link>
      </div>
    </div>
  </div>
);

const MechanicDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Mechanic Shop Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">New Requests</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You have <span className="font-bold text-blue-600">5</span> new service requests.
        </p>
        <Link href="/dashboard/active-jobs">
          <Button>View Requests</Button>
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">Shop Performance</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your shop has completed <span className="font-bold text-blue-600">28</span> jobs this month.
        </p>
        <Link href="/dashboard/shop">
          <Button variant="outline">View Analytics</Button>
        </Link>
      </div>
    </div>
  </div>
);

const DriverDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Driver Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">Available Jobs</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          There are <span className="font-bold text-blue-600">8</span> available transport jobs in your area.
        </p>
        <Link href="/dashboard/available-jobs">
          <Button>Find Jobs</Button>
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">Your Earnings</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You've earned <span className="font-bold text-blue-600">$320</span> this week.
        </p>
        <Link href="/dashboard/earnings">
          <Button variant="outline">View Details</Button>
        </Link>
      </div>
    </div>
  </div>
);

export default async function Dashboard() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Redirect to role-specific dashboard
  const { user } = session;
  
  switch (user.role) {
    case 'customer':
      redirect('/dashboard/customer');
    case 'shop':
      redirect('/dashboard/shop');
    case 'driver':
      redirect('/dashboard/driver');
    case 'admin':
      redirect('/dashboard/admin');
    default:
      redirect('/dashboard/customer');
  }
} 