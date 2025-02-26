"use client";

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, CreditCard, RefreshCcw, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Payment } from '@/types/service';
import { cn } from '@/lib/utils';

interface RefundProcessorProps {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefundComplete: (refundData: RefundData) => void;
  onCancel: () => void;
}

export interface RefundData {
  paymentId: string;
  amount: number;
  reason: string;
  refundMethod: 'original' | 'store_credit' | 'bank_transfer';
  fullRefund: boolean;
  notes?: string;
}

export default function RefundProcessor({
  payment,
  open,
  onOpenChange,
  onRefundComplete,
  onCancel
}: RefundProcessorProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(payment.amount);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'original' | 'store_credit' | 'bank_transfer'>('original');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number[]>([100]);

  // Reset form when payment changes
  useEffect(() => {
    setRefundType('full');
    setRefundAmount(payment.amount);
    setRefundReason('');
    setRefundMethod('original');
    setAdminNotes('');
    setProcessing(false);
    setError(null);
    setSuccess(false);
    setSliderValue([100]);
  }, [payment]);

  // Update refund amount when slider changes
  useEffect(() => {
    if (refundType === 'partial') {
      const percentage = sliderValue[0];
      const amount = (payment.amount * percentage) / 100;
      setRefundAmount(parseFloat(amount.toFixed(2)));
    } else {
      setRefundAmount(payment.amount);
    }
  }, [sliderValue, refundType, payment.amount]);

  const handleRefundTypeChange = (value: 'full' | 'partial') => {
    setRefundType(value);
    if (value === 'full') {
      setRefundAmount(payment.amount);
      setSliderValue([100]);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= payment.amount) {
      setRefundAmount(value);
      const percentage = (value / payment.amount) * 100;
      setSliderValue([percentage]);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
  };

  const validateForm = (): boolean => {
    if (refundAmount <= 0) {
      setError('Refund amount must be greater than 0');
      return false;
    }

    if (refundAmount > payment.amount) {
      setError('Refund amount cannot exceed the original payment amount');
      return false;
    }

    if (!refundReason.trim()) {
      setError('Please provide a reason for the refund');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const refundData: RefundData = {
        paymentId: payment.id,
        amount: refundAmount,
        reason: refundReason,
        refundMethod,
        fullRefund: refundType === 'full',
        notes: adminNotes.trim() || undefined
      };

      setSuccess(true);
      setTimeout(() => {
        onRefundComplete(refundData);
      }, 1000);
    } catch (err) {
      setError('Failed to process refund. Please try again.');
      console.error('Refund error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: payment.currency || 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            {payment.method.replace('_', ' ')} payment on {new Date(payment.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Refund Successfully Processed</AlertTitle>
              <AlertDescription>
                A refund of {formatCurrency(refundAmount)} has been processed. The customer will receive the funds according to their payment provider's policy.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader className="py-4">
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{payment.method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>ID: {payment.customerId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Request</p>
                  <p>#{payment.serviceRequestId}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label>Refund Type</Label>
                <RadioGroup
                  value={refundType}
                  onValueChange={(value: 'full' | 'partial') => handleRefundTypeChange(value)}
                  className="grid grid-cols-2 gap-4 pt-2"
                >
                  <div>
                    <RadioGroupItem
                      value="full"
                      id="full"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="full"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <RefreshCcw className="mb-3 h-6 w-6" />
                      Full Refund
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem
                      value="partial"
                      id="partial"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="partial"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Receipt className="mb-3 h-6 w-6" />
                      Partial Refund
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {refundType === 'partial' && (
                <div className="space-y-3">
                  <Label>Refund Amount</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Slider
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <Input
                        type="number"
                        value={refundAmount}
                        onChange={handleAmountChange}
                        min={0}
                        max={payment.amount}
                        step={0.01}
                      />
                    </div>
                    <div className="w-16 text-sm text-muted-foreground">
                      {sliderValue[0]}%
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Select
                  value={refundReason}
                  onValueChange={setRefundReason}
                >
                  <SelectTrigger id="refund-reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                    <SelectItem value="service_issue">Service Issue</SelectItem>
                    <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                    <SelectItem value="service_not_completed">Service Not Completed</SelectItem>
                    <SelectItem value="overcharge">Overcharge</SelectItem>
                    <SelectItem value="fraudulent_charge">Fraudulent Charge</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {refundReason === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-reason">Specify Reason</Label>
                  <Textarea
                    id="custom-reason"
                    placeholder="Provide details about the refund reason"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Refund Method</Label>
                <RadioGroup
                  value={refundMethod}
                  onValueChange={(value: 'original' | 'store_credit' | 'bank_transfer') => setRefundMethod(value)}
                  className="grid grid-cols-3 gap-4 pt-2"
                >
                  <div>
                    <RadioGroupItem
                      value="original"
                      id="original-method"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="original-method"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CreditCard className="mb-3 h-6 w-6" />
                      Original Method
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem
                      value="store_credit"
                      id="store-credit"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="store-credit"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Receipt className="mb-3 h-6 w-6" />
                      Store Credit
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem
                      value="bank_transfer"
                      id="bank-transfer"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="bank-transfer"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Receipt className="mb-3 h-6 w-6" />
                      Bank Transfer
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any additional information about this refund"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!success ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={processing}
                className={cn(processing && "opacity-80")}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {processing ? "Processing..." : "Process Refund"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={onCancel}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 