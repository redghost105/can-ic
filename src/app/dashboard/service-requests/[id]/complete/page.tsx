"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SignaturePad } from '@/components/ui/signature-pad';
import { get, put } from '@/utils/api';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ServiceCompletionForm {
  notes: string;
  finalPrice: string;
  signature: string;
}

export default function ServiceCompletePage() {
  const router = useRouter();
  const params = useParams();
  const serviceRequestId = params.id as string;
  
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ServiceCompletionForm>({
    notes: '',
    finalPrice: '',
    signature: ''
  });
  
  useEffect(() => {
    const fetchServiceRequest = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await get(`/service-request/${serviceRequestId}`);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch service request details');
        }
        
        // Check if service request is in a valid state to be completed
        const status = response.data?.status;
        
        if (!status || !['in_progress', 'at_shop'].includes(status)) {
          throw new Error(`This service request cannot be completed from its current status: ${status}`);
        }
        
        setServiceRequest(response.data);
        
        // Pre-fill the price if available
        if (response.data?.price) {
          setFormData(prev => ({
            ...prev,
            finalPrice: response.data.price.toString()
          }));
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSignatureCapture = (signatureDataUrl: string) => {
    setFormData(prev => ({
      ...prev,
      signature: signatureDataUrl
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.notes.trim()) {
        throw new Error('Please provide service notes');
      }
      
      if (!formData.finalPrice.trim() || isNaN(parseFloat(formData.finalPrice))) {
        throw new Error('Please provide a valid final price');
      }
      
      if (!formData.signature) {
        throw new Error('Customer signature is required to complete the service');
      }
      
      // Create completion payload
      const completionPayload = {
        serviceRequestId,
        newStatus: 'completed',
        notes: formData.notes,
        price: parseFloat(formData.finalPrice),
        customerSignature: formData.signature,
        completedAt: new Date().toISOString()
      };
      
      // Submit the completion request
      const response = await put(`/status-update`, completionPayload);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to complete service request');
      }
      
      setSuccess(true);
      
      // Navigate back to service request after a delay
      setTimeout(() => {
        router.push(`/dashboard/service-requests/${serviceRequestId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error completing service request:', err);
      setError(err.message || 'Failed to complete service request');
    } finally {
      setIsSubmitting(false);
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
              <h2 className="text-xl font-semibold">Unable to Complete Service</h2>
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
              <h2 className="text-2xl font-bold text-center">Service Completed Successfully</h2>
              <p className="text-gray-600 text-center mt-2">
                The service request has been marked as completed and is now ready for payment.
              </p>
              <Button 
                onClick={() => router.push(`/dashboard/service-requests/${serviceRequestId}`)} 
                className="mt-6"
              >
                View Service Request
              </Button>
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
        <h1 className="text-3xl font-bold">Complete Service</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Vehicle</h3>
              <p className="text-gray-700">
                {serviceRequest?.vehicle_make} {serviceRequest?.vehicle_model} ({serviceRequest?.vehicle_year})
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Service Type</h3>
              <p className="text-gray-700">{serviceRequest?.service_type}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Requested Services</h3>
              <p className="text-gray-700">{serviceRequest?.description}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Notes</label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Describe the work performed, parts replaced, etc."
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Final Price ($)</label>
              <Input
                type="text"
                name="finalPrice"
                value={formData.finalPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the final price including parts and labor
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Sign-Off</CardTitle>
          </CardHeader>
          <CardContent>
            <SignaturePad
              onSignatureCapture={handleSignatureCapture}
              label="Customer Signature"
            />
            <p className="text-xs text-gray-500 mt-2">
              By signing above, the customer acknowledges that the service has been completed satisfactorily.
            </p>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? 'Processing...' : 'Complete Service'}
          </Button>
        </div>
      </form>
    </div>
  );
} 