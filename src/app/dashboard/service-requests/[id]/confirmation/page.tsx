"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  CheckCircle, 
  Download, 
  ArrowLeft, 
  Printer, 
  FileText, 
  Loader, 
  AlertTriangle,
  Calendar,
  Clock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";

export default function PaymentConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const serviceRequestId = params.id as string;
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    fetchServiceRequest();
  }, [user, serviceRequestId, router]);

  const fetchServiceRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the service request
      const srResponse = await fetch(`/api/service-request/${serviceRequestId}`);
      const srData = await srResponse.json();
      
      if (!srResponse.ok) {
        throw new Error(srData.error || 'Failed to fetch service request');
      }
      
      if (srData.serviceRequest) {
        setServiceRequest(srData.serviceRequest);
        
        // Now fetch the receipt
        let receiptUrl = `/api/payments/receipt?serviceRequestId=${serviceRequestId}`;
        if (paymentIntentId) {
          receiptUrl = `/api/payments/receipt?paymentIntentId=${paymentIntentId}`;
        }
        
        const receiptResponse = await fetch(receiptUrl);
        const receiptData = await receiptResponse.json();
        
        if (receiptResponse.ok && receiptData.receipt) {
          setReceipt(receiptData.receipt);
        } else {
          console.warn('Receipt not found, but continuing with confirmation page');
          // This is not a critical error, we can still show the confirmation page
        }
      } else {
        throw new Error('Service request not found');
      }
    } catch (err) {
      console.error('Error fetching service request or receipt:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'An error occurred while fetching the service request'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    // In a real app, this would generate a PDF receipt
    alert('Receipt download functionality would be implemented here');
  };
  
  const handlePrintReceipt = () => {
    window.print();
  };
  
  const handleGoBack = () => {
    router.push(`/dashboard/service-requests/${serviceRequestId}`);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/service-requests')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Service Requests
        </Button>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Error loading confirmation</h3>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8" id="receipt-container">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="print:hidden"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Service Request
        </Button>
        
        <div className="flex space-x-2 print:hidden">
          <Button variant="outline" onClick={handlePrintReceipt}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <Card className="mb-8 border-0 print:shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-4">
              Your payment has been processed successfully. You will receive a confirmation email shortly.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8 print:shadow-none print:border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Receipt</CardTitle>
            <p className="text-sm text-gray-500">
              Service Request #{serviceRequestId}
            </p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold">MechanicOnDemand</h3>
            <p className="text-sm text-gray-500">Receipt #{receipt?.id || 'N/A'}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p>{formatDate(receipt?.created_at || serviceRequest?.updated_at || '')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                <p>Credit Card {receipt?.last4 ? `(**** **** **** ${receipt.last4})` : ''}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Service Type</h3>
                <p>{serviceRequest?.service_type || 'General Service'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="text-green-600 font-medium">Paid</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Service Details</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>Service Fee</span>
                  <span>${serviceRequest?.price?.toFixed(2) || '0.00'}</span>
                </div>
                {serviceRequest?.parts_cost && (
                  <div className="flex justify-between mb-2">
                    <span>Parts</span>
                    <span>${serviceRequest.parts_cost.toFixed(2)}</span>
                  </div>
                )}
                {serviceRequest?.labor_cost && (
                  <div className="flex justify-between mb-2">
                    <span>Labor</span>
                    <span>${serviceRequest.labor_cost.toFixed(2)}</span>
                  </div>
                )}
                {serviceRequest?.tax && (
                  <div className="flex justify-between mb-2">
                    <span>Tax</span>
                    <span>${serviceRequest.tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${serviceRequest?.price?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Vehicle Information</h3>
                {serviceRequest?.vehicles ? (
                  <p>
                    {serviceRequest.vehicles.year} {serviceRequest.vehicles.make} {serviceRequest.vehicles.model}
                    {serviceRequest.vehicles.license_plate && <span className="block text-sm text-gray-500">License: {serviceRequest.vehicles.license_plate}</span>}
                  </p>
                ) : (
                  <p className="text-gray-500">Vehicle information not available</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Service Shop</h3>
                {serviceRequest?.shops ? (
                  <p>
                    {serviceRequest.shops.name}
                    <span className="block text-sm text-gray-500">{serviceRequest.shops.address}</span>
                  </p>
                ) : (
                  <p className="text-gray-500">Shop information not available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start space-y-2 text-sm text-gray-500 border-t pt-6">
          <div className="flex items-start">
            <Calendar className="h-4 w-4 mr-2 mt-0.5" />
            <span>Service Date: {formatDate(serviceRequest?.completed_at || serviceRequest?.updated_at || '')}</span>
          </div>
          {receipt?.payment_intent_id && (
            <div className="flex items-start">
              <FileText className="h-4 w-4 mr-2 mt-0.5" />
              <span>Transaction ID: {receipt.payment_intent_id}</span>
            </div>
          )}
          <div className="flex items-start">
            <Clock className="h-4 w-4 mr-2 mt-0.5" />
            <span>This receipt was generated on {formatDate(new Date().toISOString())}</span>
          </div>
          
          <div className="w-full flex justify-center mt-8 print:mt-16">
            <p className="text-center text-gray-400 text-xs">
              Thank you for choosing MechanicOnDemand for your vehicle service needs!<br />
              If you have any questions, please contact our support team.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 