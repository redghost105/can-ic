"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DriverLocationMap } from '@/components/maps/DriverLocationMap';
import { RatingDisplay } from '@/components/reviews/RatingDisplay';
import { Clock, Car, User, Phone, ArrowLeft, MapPin } from 'lucide-react';

interface ServiceRequest {
  id: string;
  status: string;
  service_type: string;
  description: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  created_at: string;
  price: number;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
    estimated_arrival?: string;
  };
  shop?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
}

export default function TrackServicePage() {
  const params = useParams();
  const router = useRouter();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<{ status: string; timestamp: string }[]>([]);

  useEffect(() => {
    if (!params.id) return;
    
    const fetchServiceRequest = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/service-requests/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch service request');
        }
        
        setServiceRequest(data.data);
        
        // Fetch status updates
        const updatesResponse = await fetch(`/api/service-requests/${params.id}/status-updates`);
        const updatesData = await updatesResponse.json();
        
        if (updatesResponse.ok) {
          setStatusUpdates(updatesData.data || []);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching service request:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching service request data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceRequest();
    
    // Set up polling for updates every 30 seconds
    const intervalId = setInterval(fetchServiceRequest, 30000);
    
    return () => clearInterval(intervalId);
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'in progress':
        return 'bg-purple-100 text-purple-800';
      case 'on_the_way':
      case 'on the way':
        return 'bg-indigo-100 text-indigo-800';
      case 'arrived':
        return 'bg-teal-100 text-teal-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Waiting for driver';
      case 'accepted':
        return 'Driver assigned';
      case 'in_progress':
      case 'in progress':
        return 'Service in progress';
      case 'on_the_way':
      case 'on the way':
        return 'Driver on the way';
      case 'arrived':
        return 'Driver arrived';
      case 'completed':
        return 'Service completed';
      case 'cancelled':
        return 'Service cancelled';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  const renderStatusTimeline = () => {
    if (!statusUpdates || statusUpdates.length === 0) return null;
    
    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-medium">Service Timeline</h3>
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
          {statusUpdates.map((update, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[25px] mt-1.5 w-4 h-4 rounded-full bg-blue-500"></div>
              <div>
                <p className="font-medium">{getStatusText(update.status)}</p>
                <p className="text-sm text-gray-500">{formatDate(update.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Tracking Service</h1>
        </div>
        <Card>
          <CardContent className="p-8 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-2">Loading service details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !serviceRequest) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Tracking Service</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              {error || 'Unable to load service request details'}
            </div>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center space-x-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Tracking Service</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Service Details</CardTitle>
                <Badge className={getStatusColor(serviceRequest.status)}>
                  {getStatusText(serviceRequest.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500">Service Type</h3>
                  <p className="text-lg font-medium">{serviceRequest.service_type}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500">Description</h3>
                  <p>{serviceRequest.description || 'No description provided'}</p>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-500">Location</h3>
                    <div className="flex items-start mt-1">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p>{serviceRequest.location.address}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-500">Requested</h3>
                    <div className="flex items-center mt-1">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <p>{formatDate(serviceRequest.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                {serviceRequest.price && (
                  <div>
                    <h3 className="font-medium text-gray-500">Price</h3>
                    <p className="text-lg font-medium">${serviceRequest.price.toFixed(2)}</p>
                  </div>
                )}
              </div>
              
              {renderStatusTimeline()}
            </CardContent>
          </Card>
          
          {serviceRequest.driver && (
            <DriverLocationMap 
              serviceRequestId={serviceRequest.id}
              driverName={serviceRequest.driver.name}
              driverPhone={serviceRequest.driver.phone}
              estimatedArrival={serviceRequest.driver.estimated_arrival}
              destination={{
                address: serviceRequest.location.address,
                latitude: serviceRequest.location.latitude,
                longitude: serviceRequest.location.longitude
              }}
            />
          )}
        </div>
        
        <div className="space-y-6">
          {serviceRequest.driver && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                      <Car className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">{serviceRequest.driver.name}</h3>
                      {serviceRequest.driver.phone && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          <a href={`tel:${serviceRequest.driver.phone}`}>{serviceRequest.driver.phone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {serviceRequest.driver.id && (
                    <div>
                      <RatingDisplay 
                        driverId={serviceRequest.driver.id} 
                        size="medium" 
                        showCount={true} 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {serviceRequest.shop && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Repair Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{serviceRequest.shop.name}</h3>
                    <p className="text-sm text-gray-500">{serviceRequest.shop.address}</p>
                    {serviceRequest.shop.phone && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        <a href={`tel:${serviceRequest.shop.phone}`}>{serviceRequest.shop.phone}</a>
                      </div>
                    )}
                  </div>
                  
                  {serviceRequest.shop.id && (
                    <div>
                      <RatingDisplay 
                        shopId={serviceRequest.shop.id} 
                        size="medium" 
                        showCount={true} 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                If you have any issues with your service request, our support team is here to help.
              </p>
              <Button className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 