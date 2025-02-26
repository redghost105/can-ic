"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from '@/components/ui/search';
import Link from 'next/link';
import { get } from '@/utils/api';
import { ServiceRequest, ServiceRequestStatus } from '@/types/models';
import { requireAuth } from '@/lib/auth';
import { fetchServiceRequests } from '@/lib/data-fetchers';
import { formatDate } from '@/lib/utils';

// Type for pagination information
interface Pagination {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default async function ServiceRequests({ 
  searchParams 
}: { 
  searchParams: { filter?: string } 
}) {
  const session = await requireAuth();
  const filter = searchParams.filter || 'all';
  
  // Fetch service requests with optional filter
  const requests = await fetchServiceRequests(session.user.id, session.user.role, filter);
  
  // Helper function to get the appropriate status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        
        {session.user.role === 'customer' && (
          <Link href="/dashboard/service-requests/new">
            <Button>Request New Service</Button>
          </Link>
        )}
      </div>
      
      {/* Filter tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/service-requests"
            className={`py-2 border-b-2 ${filter === 'all' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
          >
            All
          </Link>
          <Link 
            href="/dashboard/service-requests?filter=active"
            className={`py-2 border-b-2 ${filter === 'active' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
          >
            Active
          </Link>
          <Link 
            href="/dashboard/service-requests?filter=pending"
            className={`py-2 border-b-2 ${filter === 'pending' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
          >
            Pending
          </Link>
          <Link 
            href="/dashboard/service-requests?filter=completed"
            className={`py-2 border-b-2 ${filter === 'completed' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
          >
            Completed
          </Link>
        </div>
      </div>
      
      {/* Service request list */}
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 md:p-6 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{request.vehicle_name}</h3>
                      <p className="text-sm text-gray-500">{request.service_type}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm">{formatDate(request.created_at)}</p>
                    </div>
                    
                    {request.shop_name && (
                      <div>
                        <p className="text-xs text-gray-500">Shop</p>
                        <p className="text-sm">{request.shop_name}</p>
                      </div>
                    )}
                    
                    {request.price && (
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-sm">${request.price.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t md:border-t-0 md:border-l border-gray-200 p-4 flex md:flex-col justify-center gap-2">
                  <Link href={`/dashboard/service-requests/${request.id}`}>
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                  
                  {request.status === 'pending_approval' && session.user.role === 'customer' && (
                    <Link href={`/dashboard/service-requests/${request.id}/approve`}>
                      <Button className="w-full">Approve</Button>
                    </Link>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <Link href={`/dashboard/service-requests/${request.id}/track`}>
                      <Button variant="outline" className="w-full">Track Status</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500">No service requests found</p>
            {session.user.role === 'customer' && (
              <Link href="/dashboard/service-requests/new">
                <Button className="mt-4">Request New Service</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 