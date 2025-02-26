"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, DollarSign, CreditCard, Clock, RefreshCcw } from 'lucide-react';
import PaymentHistory from '@/components/payments/PaymentHistory';
import RefundProcessor, { RefundData } from '@/components/payments/RefundProcessor';
import { Payment, TransactionHistory } from '@/types/service';
import { Button } from '@/components/ui/button';

// Mock data
const mockPayments: Payment[] = [
  {
    id: 'pay_1234567890',
    serviceRequestId: 'sr_12345',
    amount: 250.75,
    status: 'completed',
    method: 'credit_card',
    transactionId: 'tx_abcdef123456',
    date: new Date('2023-06-15T14:32:00'),
    currency: 'USD',
    fees: {
      platform: 12.53,
      shop: 175.52,
      mechanic: 50.15,
      tax: 12.55,
      total: 250.75
    },
    customerId: 'cus_12345',
    recipientId: 'shop_12345',
    recipientType: 'shop'
  },
  {
    id: 'pay_0987654321',
    serviceRequestId: 'sr_67890',
    amount: 175.50,
    status: 'completed',
    method: 'debit_card',
    transactionId: 'tx_ghijkl654321',
    date: new Date('2023-06-10T09:45:00'),
    currency: 'USD',
    fees: {
      platform: 8.77,
      shop: 122.85,
      mechanic: 35.10,
      tax: 8.78,
      total: 175.50
    },
    customerId: 'cus_12345',
    recipientId: 'shop_67890',
    recipientType: 'shop'
  },
  {
    id: 'pay_5678901234',
    serviceRequestId: 'sr_54321',
    amount: 320.00,
    status: 'refunded',
    method: 'credit_card',
    transactionId: 'tx_mnopqr789012',
    date: new Date('2023-06-05T16:20:00'),
    currency: 'USD',
    fees: {
      platform: 16.00,
      shop: 224.00,
      mechanic: 64.00,
      tax: 16.00,
      total: 320.00
    },
    customerId: 'cus_12345',
    recipientId: 'shop_23456',
    recipientType: 'shop',
    refunds: [
      {
        id: 'ref_123456',
        amount: 320.00,
        reason: 'customer_request',
        date: new Date('2023-06-06T10:15:00'),
        status: 'completed'
      }
    ]
  },
  {
    id: 'pay_3456789012',
    serviceRequestId: 'sr_09876',
    amount: 475.25,
    status: 'partial_refund',
    method: 'credit_card',
    transactionId: 'tx_stuvwx345678',
    date: new Date('2023-06-02T11:10:00'),
    currency: 'USD',
    fees: {
      platform: 23.76,
      shop: 332.67,
      mechanic: 95.05,
      tax: 23.77,
      total: 475.25
    },
    customerId: 'cus_12345',
    recipientId: 'shop_34567',
    recipientType: 'shop',
    refunds: [
      {
        id: 'ref_654321',
        amount: 100.00,
        reason: 'service_issue',
        date: new Date('2023-06-03T14:30:00'),
        status: 'completed'
      }
    ]
  },
  {
    id: 'pay_7890123456',
    serviceRequestId: 'sr_13579',
    amount: 85.00,
    status: 'pending',
    method: 'bank_transfer',
    transactionId: 'tx_yzabcd901234',
    date: new Date('2023-06-16T08:00:00'),
    currency: 'USD',
    fees: {
      platform: 4.25,
      shop: 59.50,
      mechanic: 17.00,
      tax: 4.25,
      total: 85.00
    },
    customerId: 'cus_12345',
    recipientId: 'shop_45678',
    recipientType: 'shop'
  }
];

const mockTransactions: TransactionHistory[] = [
  {
    id: 'tr_12345',
    type: 'payment',
    amount: 250.75,
    status: 'completed',
    relatedId: 'pay_1234567890',
    description: 'Payment for service request #SR-12345',
    date: new Date('2023-06-15T14:32:00'),
    fromAccount: 'Customer (cus_12345)',
    toAccount: 'Platform',
    currency: 'USD'
  },
  {
    id: 'tr_23456',
    type: 'fee',
    amount: 12.53,
    status: 'completed',
    relatedId: 'pay_1234567890',
    description: 'Platform fee for service request #SR-12345',
    date: new Date('2023-06-15T14:32:01'),
    fromAccount: 'Platform',
    toAccount: 'Platform Revenue',
    currency: 'USD'
  },
  {
    id: 'tr_34567',
    type: 'payout',
    amount: 175.52,
    status: 'completed',
    relatedId: 'pay_1234567890',
    description: 'Shop payout for service request #SR-12345',
    date: new Date('2023-06-15T14:32:02'),
    fromAccount: 'Platform',
    toAccount: 'Shop (shop_12345)',
    currency: 'USD'
  },
  {
    id: 'tr_45678',
    type: 'payout',
    amount: 50.15,
    status: 'completed',
    relatedId: 'pay_1234567890',
    description: 'Mechanic payout for service request #SR-12345',
    date: new Date('2023-06-15T14:32:03'),
    fromAccount: 'Platform',
    toAccount: 'Mechanic (mech_12345)',
    currency: 'USD'
  },
  {
    id: 'tr_56789',
    type: 'refund',
    amount: -320.00,
    status: 'completed',
    relatedId: 'ref_123456',
    description: 'Refund for service request #SR-54321',
    date: new Date('2023-06-06T10:15:00'),
    fromAccount: 'Platform',
    toAccount: 'Customer (cus_12345)',
    currency: 'USD'
  }
];

// User type for demo (in a real app, this would come from an auth context)
type UserType = 'customer' | 'shop' | 'mechanic' | 'admin';

export default function PaymentsPage() {
  const [userType, setUserType] = useState<UserType>('customer');
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [transactions, setTransactions] = useState<TransactionHistory[]>(mockTransactions);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundProcessor, setShowRefundProcessor] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    completedCount: 0,
    refundedAmount: 0
  });

  // Calculate payment statistics
  useEffect(() => {
    const stats = payments.reduce(
      (acc, payment) => {
        if (payment.status === 'completed') {
          acc.totalAmount += payment.amount;
          acc.completedCount++;
        } else if (payment.status === 'pending') {
          acc.pendingAmount += payment.amount;
        }

        if (payment.status === 'refunded' || payment.status === 'partial_refund') {
          const refundedAmount = payment.refunds?.reduce((sum, refund) => sum + refund.amount, 0) || 0;
          acc.refundedAmount += refundedAmount;
        }

        return acc;
      },
      { totalAmount: 0, pendingAmount: 0, completedCount: 0, refundedAmount: 0 }
    );

    setPaymentStats(stats);
  }, [payments]);

  const handleRefundClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundProcessor(true);
  };

  const handleRefundComplete = (refundData: RefundData) => {
    // In a real app, this would call an API and then update state based on the response
    console.log('Processing refund:', refundData);

    // Update payments with the new refund
    const updatedPayments = payments.map(payment => {
      if (payment.id === refundData.paymentId) {
        const newRefund = {
          id: `ref_${Date.now()}`,
          amount: refundData.amount,
          reason: refundData.reason,
          date: new Date(),
          status: 'completed' as const
        };

        const existingRefunds = payment.refunds || [];
        const newStatus = refundData.fullRefund ? 'refunded' : 'partial_refund';

        return {
          ...payment,
          status: newStatus as 'refunded' | 'partial_refund',
          refunds: [...existingRefunds, newRefund]
        };
      }
      return payment;
    });

    // Add a new transaction for the refund
    const newTransaction: TransactionHistory = {
      id: `tr_refund_${Date.now()}`,
      type: 'refund',
      amount: -refundData.amount, // Negative to indicate money going out
      status: 'completed',
      relatedId: refundData.paymentId,
      description: `Refund for payment ${refundData.paymentId.substring(0, 8)}`,
      date: new Date(),
      fromAccount: 'Platform',
      toAccount: `Customer (${selectedPayment?.customerId || 'unknown'})`,
      currency: selectedPayment?.currency || 'USD'
    };

    setPayments(updatedPayments);
    setTransactions([newTransaction, ...transactions]);
    setSelectedPayment(null);
    setShowRefundProcessor(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Payments & Billing</h1>
      <p className="text-muted-foreground">View your payment history, transactions, and manage refunds.</p>

      {/* User Type Switcher (for demo only) */}
      <div className="flex flex-wrap gap-2 pb-4">
        <Button
          variant={userType === 'customer' ? 'default' : 'outline'}
          onClick={() => setUserType('customer')}
        >
          Customer View
        </Button>
        <Button
          variant={userType === 'shop' ? 'default' : 'outline'}
          onClick={() => setUserType('shop')}
        >
          Shop View
        </Button>
        <Button
          variant={userType === 'mechanic' ? 'default' : 'outline'}
          onClick={() => setUserType('mechanic')}
        >
          Mechanic View
        </Button>
        <Button
          variant={userType === 'admin' ? 'default' : 'outline'}
          onClick={() => setUserType('admin')}
        >
          Admin View
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paymentStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              From {paymentStats.completedCount} completed payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paymentStats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunded Amount</CardTitle>
            <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paymentStats.refundedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Total refunds processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Active payment methods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          {userType === 'admin' && (
            <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View and manage all your payment transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentHistory
                payments={payments}
                transactions={transactions}
                userType={userType}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                Payment methods management interface would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {userType === 'admin' && (
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Generate detailed financial reports for accounting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-center py-8">
                  Financial reporting interface would go here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Refund Processor Dialog */}
      {selectedPayment && (
        <RefundProcessor
          payment={selectedPayment}
          open={showRefundProcessor}
          onOpenChange={setShowRefundProcessor}
          onRefundComplete={handleRefundComplete}
          onCancel={() => {
            setSelectedPayment(null);
            setShowRefundProcessor(false);
          }}
        />
      )}
    </div>
  );
} 