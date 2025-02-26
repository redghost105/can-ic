"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { get, put } from '@/utils/api';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle, CheckCircle, ArrowLeft, Car, MapPin, Truck } from 'lucide-react';

export default function TransportStatusPage() {
  const router = useRouter();
  const params = useParams();
  const serviceRequestId = params.id as string;
  const { user } = useAuth();
  
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [nextStatus, setNextStatus] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<Array<{value: string, label: string}>>([]);
  
  useEffect(() => {
    const fetchServiceRequest = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await get(`/service-request/${serviceRequestId}`);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch service request details');
        }
        
        setServiceRequest(response.data);
        
        // Determine available next statuses based on current status
        const currentStatus = response.data?.status;
        const options: Array<{value: string, label: string}> = [];
        
        if (currentStatus === 'driver_assigned_pickup') {
          options.push({ value: 'in_transit_to_shop', label: 'Started Pickup (In Transit to Shop)' });
        } else if (currentStatus === 'in_transit_to_shop') {
          options.push({ value: 'at_shop', label: 'Arrived at Shop' });
        } else if (currentStatus === 'driver_assigned_return') {
          options.push({ value: 'in_transit_to_owner', label: 'Started Return Trip (In Transit to Owner)' });
        } else if (currentStatus === 'in_transit_to_owner') {
          options.push({ value: 'delivered', label: 'Vehicle Delivered to Owner' });
        }
        
        setStatusOptions(options);
        
        // Set default next status if options are available
        if (options.length > 0) {
          setNextStatus(options[0].value);
        }
      } catch (err: any) {
        console.error('Error fetching service request:', err);
        setError(err.message || 'Failed to load service request details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (serviceRequestId) {
      fetchServiceRequest();
    }
  }, [serviceRequestId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!nextStatus) {
        throw new Error('Please select a status update');
      }
      
      // Create status update payload
      const updatePayload = {
        serviceRequestId,
        newStatus: nextStatus,
        notes: notes.trim() ? notes : undefined
      };
      
      // Submit the status update
      const response = await put(`/status-update`, updatePayload);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update service request status');
      }
      
      setSuccess(true);
      
      // Navigate back to service request after a delay
      setTimeout(() => {
        router.push(`/dashboard/service-requests/${serviceRequestId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error updating service request status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'driver_assigned_pickup':
        return <Truck className="h-6 w-6 text-blue-500" />;
      case 'in_transit_to_shop':
        return <Car className="h-6 w-6 text-indigo-500" />;
      case 'at_shop':
        return <MapPin className="h-6 w-6 text-purple-500" />;
      case 'driver_assigned_return':
        return <Truck className="h-6 w-6 text-blue-500" />;
      case 'in_transit_to_owner':
        return <Car className="h-6 w-6 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Truck className="h-6 w-6 text-gray-500" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center text-red-500 mb-4">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold">Unable to Update Status</h2>
            </div>
            <p className="text-gray-600">{error}</p>
            
            <Button onClick={() => router.back()} className="mt-6">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-center">Status Updated Successfully</h2>
              <p className="text-gray-600 text-center mt-2">
                The service request status has been updated.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Update Transport Status</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              {getStatusIcon(serviceRequest?.status)}
              <span className="text-lg font-medium ml-2">
                {serviceRequest?.status.replace(/_/g, ' ')}
              </span>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Vehicle</h3>
              <p className="text-gray-700">
                {serviceRequest?.vehicle_make} {serviceRequest?.vehicle_model} ({serviceRequest?.vehicle_year})
              </p>
            </div>
            
            {serviceRequest?.pickup_address && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Pickup Address</h3>
                <p className="text-gray-700">{serviceRequest?.pickup_address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {statusOptions.length > 0 ? (
              <>
                <div className="space-y-4">
                  {statusOptions.map(option => (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        id={option.value}
                        name="status"
                        value={option.value}
                        checked={nextStatus === option.value}
                        onChange={() => setNextStatus(option.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor={option.value} className="ml-2 block text-sm font-medium text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any relevant details about the pickup/delivery"
                    rows={3}
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !nextStatus}
                    className="w-full"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  No status updates are available for this service request in its current state.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 