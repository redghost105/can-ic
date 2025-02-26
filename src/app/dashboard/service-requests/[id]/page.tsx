"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { get, put } from '@/utils/api';
import { ServiceRequest, ServiceRequestStatus } from '@/types/models';
import { AlertCircle, CheckCircle, Truck, Clock, MapPin, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { requireAuth } from '@/lib/auth';
import { fetchServiceRequestById } from '@/lib/data-fetchers';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { formatDate, formatTime } from '@/lib/utils';
import RequestStatusTimeline from '@/components/service/RequestStatusTimeline';
import ServiceQuote from '@/components/service/ServiceQuote';
import { redirect } from 'next/navigation';

// Extended status type to handle all the possible statuses in our system
type ExtendedServiceRequestStatus = ServiceRequestStatus | 
  'driver_assigned_pickup' | 'in_transit_to_shop' | 'at_shop' | 
  'driver_assigned_return' | 'in_transit_to_owner' | 'delivered' |
  'pending_payment' | 'paid';

// Add shops interface
interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
}

// Update ServiceRequest interface to include shops
interface ExtendedServiceRequest extends ServiceRequest {
  shops?: Shop;
}

export default async function ServiceRequestDetailsPage({ params }: { params: { id: string } }) {
  // Verify user is authenticated
  const session = await requireAuth();
  
  // Fetch service request details
  const request = await fetchServiceRequestById(params.id);
  
  // Redirect if request not found or doesn't belong to user (unless admin)
  if (!request || (request.customer_id !== session.user.id && session.user.role !== 'admin')) {
    redirect('/dashboard/service-requests');
  }
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
        return "bg-blue-100 text-blue-800";
      case 'in_progress':
        return "bg-purple-100 text-purple-800";
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Format service type for display
  const formatServiceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/service-requests">Service Requests</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Request #{request.id.substring(0, 8)}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Service Request: {formatServiceType(request.service_type)}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-500">Submitted on {formatDate(request.created_at)}</p>
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          {request.status === 'pending' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/service-requests/${request.id}/edit`}>
                Edit Request
              </Link>
            </Button>
          )}
          
          {request.status === 'pending' && (
            <form action="/api/service-requests/cancel" method="POST" className="inline">
              <input type="hidden" name="id" value={request.id} />
              <Button variant="destructive" size="sm" type="submit">
                Cancel Request
              </Button>
            </form>
          )}
          
          {request.status === 'approved' && request.quote && (
            <Button size="sm" asChild>
              <Link href={`/dashboard/service-requests/${request.id}/payment`}>
                Make Payment
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Problem Description</h3>
                <p className="text-gray-600">{request.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Service Type</h3>
                  <p className="text-gray-600">{formatServiceType(request.service_type)}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Urgency Level</h3>
                  <p className="text-gray-600 capitalize">{request.urgency}</p>
                </div>
                
                {request.preferred_date && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Preferred Date</h3>
                    <p className="text-gray-600 flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                      {formatDate(request.preferred_date)}
                    </p>
                  </div>
                )}
                
                {request.preferred_time && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Preferred Time</h3>
                    <p className="text-gray-600 flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      {formatTime(request.preferred_time)}
                    </p>
                  </div>
                )}
                
                {request.pickup_required && (
                  <div className="sm:col-span-2">
                    <h3 className="font-medium text-gray-700 mb-2">Pickup Address</h3>
                    <p className="text-gray-600 flex items-start">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-1" />
                      {request.pickup_address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestStatusTimeline requestId={request.id} />
            </CardContent>
          </Card>
          
          {/* Quote Information (if available) */}
          {request.quote && (
            <ServiceQuote quote={request.quote} requestStatus={request.status} />
          )}
        </div>
        
        {/* Vehicle Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <Car className="h-5 w-5 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">
                    {request.vehicle.year} {request.vehicle.make} {request.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-500">
                    License: {request.vehicle.license_plate}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <Link href={`/dashboard/vehicles/${request.vehicle.id}`}>
                  <Button variant="outline" className="w-full">
                    View Vehicle Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Shop Information (if assigned) */}
          {request.shop && (
            <Card>
              <CardHeader>
                <CardTitle>Service Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="font-medium">{request.shop.name}</p>
                  {request.shop.address && (
                    <p className="text-sm text-gray-500 flex items-start mt-2">
                      <MapPin className="h-4 w-4 mr-1 mt-1" />
                      {request.shop.address}
                    </p>
                  )}
                  {request.shop.phone && (
                    <p className="text-sm text-gray-500 mt-2">
                      Phone: {request.shop.phone}
                    </p>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <Link href={`/dashboard/messages?shop=${request.shop.id}`}>
                    <Button variant="outline" className="w-full">
                      Contact Shop
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Important Notice */}
          {request.status === 'pending' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-700">Awaiting Shop Assignment</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Your service request is being processed. A service provider will be assigned shortly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 