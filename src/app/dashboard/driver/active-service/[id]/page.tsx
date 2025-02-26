"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Car, Navigation, Phone, Clock, ArrowLeft, Circle, Send } from 'lucide-react';

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
}

interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'accepted': ['on_the_way', 'cancelled'],
  'on_the_way': ['arrived', 'cancelled'],
  'arrived': ['in_progress', 'cancelled'],
  'in_progress': ['completed', 'cancelled'],
};

export default function DriverActiveServicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coords | null>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [nextAvailableStatuses, setNextAvailableStatuses] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const fetchServiceRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/service-requests/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch service request');
      }
      
      setServiceRequest(data.data);
      setError(null);
      
      // Determine next available statuses
      if (data.data.status in VALID_STATUS_TRANSITIONS) {
        setNextAvailableStatuses(VALID_STATUS_TRANSITIONS[data.data.status]);
      } else {
        setNextAvailableStatuses([]);
      }
    } catch (error) {
      console.error('Error fetching service request:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching service request data');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    fetchServiceRequest();
  }, [params.id, fetchServiceRequest]);

  useEffect(() => {
    if (isTrackingEnabled && navigator.geolocation) {
      const success = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy });
        updateDriverLocation(latitude, longitude);
      };
      
      const error = (err: GeolocationPositionError) => {
        console.error('Geolocation error:', err);
        toast({
          title: 'Location Error',
          description: `Could not get your location: ${err.message}`,
          variant: 'error',
        });
        setIsTrackingEnabled(false);
      };
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      const id = navigator.geolocation.watchPosition(success, error, options);
      setWatchId(id);
      
      return () => {
        if (id !== null) {
          navigator.geolocation.clearWatch(id);
        }
      };
    } else if (!isTrackingEnabled && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [isTrackingEnabled, toast]);

  const updateDriverLocation = async (latitude: number, longitude: number) => {
    if (!serviceRequest) return;
    
    try {
      setIsUpdatingLocation(true);
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          service_request_id: serviceRequest.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to update location:', data.error);
        // Don't show toasts for every location update failure
      }
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const toggleLocationTracking = () => {
    if (!isTrackingEnabled) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setCurrentLocation({ latitude, longitude, accuracy });
            setIsTrackingEnabled(true);
            toast({
              title: 'Location Tracking Enabled',
              description: 'Your location is now being shared with the customer',
              variant: 'success',
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: 'Location Error',
              description: `Could not get your location: ${error.message}`,
              variant: 'error',
            });
          },
          { enableHighAccuracy: true }
        );
      } else {
        toast({
          title: 'Location Not Supported',
          description: 'Geolocation is not supported by your browser',
          variant: 'error',
        });
      }
    } else {
      setIsTrackingEnabled(false);
      toast({
        title: 'Location Tracking Disabled',
        description: 'Your location is no longer being shared',
        variant: 'default',
      });
    }
  };

  const updateServiceStatus = async (newStatus: string) => {
    if (!serviceRequest) return;
    
    try {
      setIsUpdatingStatus(true);
      
      const response = await fetch(`/api/service-requests/${serviceRequest.id}/status-updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }
      
      toast({
        title: 'Status Updated',
        description: `Service status has been updated to ${newStatus.replace('_', ' ')}`,
        variant: 'success',
      });
      
      setNotes('');
      
      // Refresh the service request data
      fetchServiceRequest();
      
      // If completed, redirect to completion page
      if (newStatus === 'completed') {
        router.push(`/dashboard/driver`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'An error occurred while updating status',
        variant: 'error',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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

  const getStatusName = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'on_the_way': return 'On The Way';
      case 'arrived': return 'Arrived';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status.replace('_', ' ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'on_the_way':
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Active Service</h1>
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
          <h1 className="text-2xl font-bold">Active Service</h1>
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
        <h1 className="text-2xl font-bold">Active Service</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Service Details</CardTitle>
              <Badge className={getStatusColor(serviceRequest.status)}>
                {getStatusName(serviceRequest.status)}
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
              
              <div>
                <h3 className="font-medium text-gray-500">Customer</h3>
                <div className="flex items-center mt-1">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-medium">
                      {serviceRequest.customer.name.substring(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{serviceRequest.customer.name}</p>
                    {serviceRequest.customer.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-1" />
                        <a href={`tel:${serviceRequest.customer.phone}`}>{serviceRequest.customer.phone}</a>
                      </div>
                    )}
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
          </CardContent>
          <CardFooter className="flex justify-end pt-0">
            <Button
              variant="outline"
              onClick={() => {
                if (serviceRequest.location.latitude && serviceRequest.location.longitude) {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${serviceRequest.location.latitude},${serviceRequest.location.longitude}`,
                    '_blank'
                  );
                }
              }}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Location Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Share Your Location</h3>
                  <p className="text-sm text-gray-500">Enable location sharing so the customer can track your arrival</p>
                </div>
                <Button
                  variant={isTrackingEnabled ? "destructive" : "default"}
                  onClick={toggleLocationTracking}
                >
                  {isTrackingEnabled ? (
                    <>
                      <Circle className="h-4 w-4 mr-2 animate-pulse" fill="white" />
                      Stop Sharing
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Share Location
                    </>
                  )}
                </Button>
              </div>
              
              {currentLocation && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-blue-700 text-sm">
                    <span className="font-medium">Current coordinates:</span>{' '}
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    {currentLocation.accuracy && (
                      <span className="block text-xs mt-1">
                        Accuracy: {Math.round(currentLocation.accuracy)} meters
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Add Notes (Optional)</h3>
                <Textarea
                  placeholder="Add any notes about the service..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Update Service Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {nextAvailableStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={status === 'cancelled' ? 'destructive' : 'default'}
                      onClick={() => updateServiceStatus(status)}
                      disabled={isUpdatingStatus}
                      className="w-full"
                    >
                      {isUpdatingStatus ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {getStatusName(status)}
                    </Button>
                  ))}
                </div>
                
                {nextAvailableStatuses.length === 0 && (
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <p className="text-yellow-700 text-sm">
                      No status updates available for the current service status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 