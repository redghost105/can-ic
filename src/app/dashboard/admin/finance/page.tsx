"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, DollarSign, TrendingUp, CreditCard, Percent, Calendar as CalendarIcon, Users, BarChart4 } from 'lucide-react';
import { format } from 'date-fns';
import PaymentHistory from '@/components/payments/PaymentHistory';
import FeeSplitter from '@/components/payments/FeeSplitter';
import PayoutManager from '@/components/payments/PayoutManager';

// Mock payment data
const mockPayments = [
  {
    id: 'pmt_1',
    amount: 259.99,
    status: 'completed',
    date: new Date(2023, 6, 15),
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    paymentMethod: {
      type: 'credit_card',
      last4: '4242',
      brand: 'visa'
    },
    serviceId: 'srv_123',
    serviceName: 'Brake Replacement',
    mechanicId: 'mech_1',
    mechanicName: 'Mike Smith',
    shopId: 'shop_1',
    shopName: 'Quick Fix Auto',
    fees: {
      platform: 12.99,
      shop: 182.00,
      mechanic: 52.00,
      tax: 13.00
    }
  },
  {
    id: 'pmt_2',
    amount: 89.99,
    status: 'pending',
    date: new Date(2023, 6, 17),
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    paymentMethod: {
      type: 'credit_card',
      last4: '1234',
      brand: 'mastercard'
    },
    serviceId: 'srv_124',
    serviceName: 'Oil Change',
    mechanicId: 'mech_2',
    mechanicName: 'Dave Wilson',
    shopId: 'shop_2',
    shopName: 'Pro Auto Care',
    fees: {
      platform: 4.50,
      shop: 63.00,
      mechanic: 18.00,
      tax: 4.49
    }
  },
  {
    id: 'pmt_3',
    amount: 549.99,
    status: 'refunded',
    date: new Date(2023, 6, 10),
    customerName: 'Michael Brown',
    customerEmail: 'michael@example.com',
    paymentMethod: {
      type: 'paypal',
      email: 'michael@example.com'
    },
    serviceId: 'srv_125',
    serviceName: 'Transmission Repair',
    mechanicId: 'mech_3',
    mechanicName: 'Alex Rodriguez',
    shopId: 'shop_1',
    shopName: 'Quick Fix Auto',
    fees: {
      platform: 27.50,
      shop: 385.00,
      mechanic: 110.00,
      tax: 27.49
    },
    refundDetails: {
      date: new Date(2023, 6, 12),
      reason: 'Customer dissatisfied',
      amount: 549.99,
      processedBy: 'Admin User'
    }
  },
  {
    id: 'pmt_4',
    amount: 229.99,
    status: 'partial_refund',
    date: new Date(2023, 6, 5),
    customerName: 'Emily Wilson',
    customerEmail: 'emily@example.com',
    paymentMethod: {
      type: 'credit_card',
      last4: '5678',
      brand: 'amex'
    },
    serviceId: 'srv_126',
    serviceName: 'Battery Replacement',
    mechanicId: 'mech_2',
    mechanicName: 'Dave Wilson',
    shopId: 'shop_3',
    shopName: 'City Garage',
    fees: {
      platform: 11.50,
      shop: 161.00,
      mechanic: 46.00,
      tax: 11.49
    },
    refundDetails: {
      date: new Date(2023, 6, 7),
      reason: 'Partial work completed',
      amount: 114.99,
      processedBy: 'Admin User'
    }
  }
];

// Mock transaction data
const mockTransactions = [
  {
    id: 'txn_1',
    type: 'payment',
    amount: 259.99,
    date: new Date(2023, 6, 15),
    status: 'completed',
    relatedId: 'pmt_1',
    description: 'Payment for Brake Replacement service'
  },
  {
    id: 'txn_2',
    type: 'fee',
    amount: -12.99,
    date: new Date(2023, 6, 15),
    status: 'completed',
    relatedId: 'pmt_1',
    description: 'Platform fee for payment pmt_1'
  },
  {
    id: 'txn_3',
    type: 'payout',
    amount: -182.00,
    date: new Date(2023, 6, 16),
    status: 'completed',
    relatedId: 'shop_1',
    description: 'Payout to Quick Fix Auto for service srv_123'
  },
  {
    id: 'txn_4',
    type: 'payout',
    amount: -52.00,
    date: new Date(2023, 6, 16),
    status: 'completed',
    relatedId: 'mech_1',
    description: 'Payout to Mike Smith for service srv_123'
  },
  {
    id: 'txn_5',
    type: 'payment',
    amount: 89.99,
    date: new Date(2023, 6, 17),
    status: 'pending',
    relatedId: 'pmt_2',
    description: 'Payment for Oil Change service'
  },
  {
    id: 'txn_6',
    type: 'payment',
    amount: 549.99,
    date: new Date(2023, 6, 10),
    status: 'completed',
    relatedId: 'pmt_3',
    description: 'Payment for Transmission Repair service'
  },
  {
    id: 'txn_7',
    type: 'refund',
    amount: -549.99,
    date: new Date(2023, 6, 12),
    status: 'completed',
    relatedId: 'pmt_3',
    description: 'Refund for payment pmt_3'
  },
  {
    id: 'txn_8',
    type: 'payment',
    amount: 229.99,
    date: new Date(2023, 6, 5),
    status: 'completed',
    relatedId: 'pmt_4',
    description: 'Payment for Battery Replacement service'
  },
  {
    id: 'txn_9',
    type: 'refund',
    amount: -114.99,
    date: new Date(2023, 6, 7),
    status: 'completed',
    relatedId: 'pmt_4',
    description: 'Partial refund for payment pmt_4'
  }
];

// Types for TypeScript
interface Payment {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded' | 'partial_refund';
  date: Date;
  customerName: string;
  customerEmail: string;
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
    email?: string;
  };
  serviceId: string;
  serviceName: string;
  mechanicId: string;
  mechanicName: string;
  shopId: string;
  shopName: string;
  fees: {
    platform: number;
    shop: number;
    mechanic: number;
    tax: number;
  };
  refundDetails?: {
    date: Date;
    reason: string;
    amount: number;
    processedBy: string;
  };
}

interface TransactionHistory {
  id: string;
  type: string;
  amount: number;
  date: Date;
  status: string;
  relatedId: string;
  description: string;
}

type FinanceStats = {
  totalRevenue: number;
  pendingPayments: number;
  processingFees: number;
  activeServices: number;
  averageTicket: number;
  refundRate: number;
};

export default function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('month');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  
  // Calculate statistics
  const calculateStats = (): FinanceStats => {
    const completedPayments = mockPayments.filter(
      p => p.status === 'completed' || p.status === 'partial_refund'
    );
    
    const totalRevenue = mockTransactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const pendingPayments = mockPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const processingFees = mockTransactions
      .filter(t => t.type === 'fee' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const refundedAmount = mockTransactions
      .filter(t => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const totalProcessed = totalRevenue + refundedAmount;
    
    return {
      totalRevenue,
      pendingPayments,
      processingFees,
      activeServices: mockPayments.filter(p => p.status === 'pending').length,
      averageTicket: completedPayments.length ? totalRevenue / completedPayments.length : 0,
      refundRate: totalProcessed > 0 ? (refundedAmount / totalProcessed) * 100 : 0
    };
  };
  
  const stats = calculateStats();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percent / 100);
  };
  
  // Default fee rates for the platform
  const defaultFeeRates = {
    platform: 5,
    shop: 70,
    mechanic: 20,
    driver: 0,
    tax: 5
  };

  const handleCreatePayout = async (payoutData: any) => {
    console.log('Creating payout:', payoutData);
    // In a real implementation, this would call an API endpoint
    return new Promise<void>((resolve) => {
      // Simulate API delay
      setTimeout(resolve, 1500);
    });
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Manage payments, process refunds, and configure fee rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(new Date(), 'MMMM yyyy')}
          </Button>
          <Button onClick={() => setActiveTab('payouts')}>
            <DollarSign className="mr-2 h-4 w-4" />
            Manage Payouts
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="fees">Fee Config</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</div>
                <p className="text-xs text-muted-foreground">
                  {mockPayments.filter(p => p.status === 'pending').length} pending transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.processingFees)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(stats.processingFees / stats.totalRevenue * 100)} of revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeServices}</div>
                <p className="text-xs text-muted-foreground">
                  Services awaiting completion
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
                <BarChart4 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(stats.refundRate)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(mockTransactions
                    .filter(t => t.type === 'refund' && t.status === 'completed')
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0))} refunded
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Distribution of revenue across services</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Chart Placeholder
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Payment Trends</CardTitle>
                <CardDescription>Monthly payment volume over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Chart Placeholder
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View and manage all payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentHistory 
                payments={mockPayments as Payment[]} 
                transactions={mockTransactions as TransactionHistory[]}
                userType="admin"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>Process payouts to shops and mechanics</CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutManager onCreatePayout={handleCreatePayout} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Configuration</CardTitle>
              <CardDescription>
                Set and manage fee rates for platform, shops, mechanics and drivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeeSplitter 
                initialRates={defaultFeeRates}
                canEdit={true}
                onSave={(rates) => {
                  console.log('Saving new rates:', rates);
                  // Here you would typically call an API to update the rates
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and download financial reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Revenue Report</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Detailed breakdown of all revenue streams
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button variant="outline" className="w-full">Generate Report</Button>
                  </div>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Payout Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Summary of all payouts to shops and mechanics
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button variant="outline" className="w-full">Generate Report</Button>
                  </div>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tax Statement</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Tax collected and remitted for accounting purposes
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button variant="outline" className="w-full">Generate Report</Button>
                  </div>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Refund Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Analysis of refunds and their causes
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button variant="outline" className="w-full">Generate Report</Button>
                  </div>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Service Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Financial performance by service type
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button variant="outline" className="w-full">Generate Report</Button>
                  </div>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Custom Report</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Create a custom financial report
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button variant="outline" className="w-full">Create Custom Report</Button>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 