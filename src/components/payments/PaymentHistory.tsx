"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Search, Download, Filter, ArrowUpDown, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Payment, TransactionHistory } from '@/types/service';
import { cn } from '@/lib/utils';

interface PaymentHistoryProps {
  payments: Payment[];
  transactions?: TransactionHistory[];
  userType: 'customer' | 'shop' | 'mechanic' | 'admin';
}

export default function PaymentHistory({
  payments,
  transactions = [],
  userType
}: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment | '';
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc',
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewType, setViewType] = useState<'payments' | 'transactions'>('payments');

  // Filter payments based on search and filters
  const filteredPayments = payments.filter(payment => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      payment.id.toLowerCase().includes(searchLower) ||
      payment.serviceRequestId.toLowerCase().includes(searchLower) ||
      payment.transactionId.toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(searchLower);

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || payment.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = payment.date > sevenDaysAgo;
    } else if (dateFilter === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = payment.date > thirtyDaysAgo;
    } else if (dateFilter === 'last90days') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      matchesDate = payment.date > ninetyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.relatedId.toLowerCase().includes(searchLower) ||
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower);

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || transaction.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = transaction.date > sevenDaysAgo;
    } else if (dateFilter === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = transaction.date > thirtyDaysAgo;
    } else if (dateFilter === 'last90days') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      matchesDate = transaction.date > ninetyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortConfig.key === '') return 0;
    
    const aValue = a[sortConfig.key as keyof Payment];
    const bValue = b[sortConfig.key as keyof Payment];
    
    if (aValue === bValue) return 0;
    
    if (sortConfig.key === 'date') {
      // Handle date sorting
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === 'amount') {
      // Handle number sorting
      return sortConfig.direction === 'asc'
        ? (a.amount - b.amount)
        : (b.amount - a.amount);
    } else {
      // Handle string sorting
      const stringA = String(aValue).toLowerCase();
      const stringB = String(bValue).toLowerCase();
      return sortConfig.direction === 'asc'
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    }
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Default sort by date, newest first
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const handleSort = (key: keyof Payment) => {
    setSortConfig(prevConfig => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const closeDialog = () => {
    setSelectedPayment(null);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
      case 'refunded':
      case 'partial_refund':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      case 'refund':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      case 'payout':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400';
      case 'fee':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle between payments and transactions (admin only) */}
      {userType === 'admin' && (
        <div className="flex space-x-2">
          <Button
            variant={viewType === 'payments' ? 'default' : 'outline'}
            onClick={() => setViewType('payments')}
          >
            Payments
          </Button>
          <Button
            variant={viewType === 'transactions' ? 'default' : 'outline'}
            onClick={() => setViewType('transactions')}
          >
            All Transactions
          </Button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${viewType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              {viewType === 'payments' && (
                <SelectItem value="partial_refund">Partial Refund</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      {viewType === 'payments' && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('id')}
                    className="flex items-center justify-start h-auto p-0 font-semibold text-sm"
                  >
                    ID
                    {sortConfig.key === 'id' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </Button>
                </TableHead>
                
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="flex items-center justify-start h-auto p-0 font-semibold text-sm"
                  >
                    Date
                    {sortConfig.key === 'date' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </Button>
                </TableHead>
                
                <TableHead>Description</TableHead>
                
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('amount')}
                    className="flex items-center justify-start h-auto p-0 font-semibold text-sm"
                  >
                    Amount
                    {sortConfig.key === 'amount' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </Button>
                </TableHead>
                
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="flex items-center justify-start h-auto p-0 font-semibold text-sm"
                  >
                    Status
                    {sortConfig.key === 'status' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </Button>
                </TableHead>
                
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {sortedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No payments found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                sortedPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    onClick={() => handleRowClick(payment)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {payment.id.substring(0, 8)}...
                    </TableCell>
                    
                    <TableCell>
                      {format(payment.date, 'MMM d, yyyy')}
                      <div className="text-xs text-muted-foreground">
                        {format(payment.date, 'h:mm a')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      Service Request #{payment.serviceRequestId.substring(0, 6)}
                    </TableCell>
                    
                    <TableCell className={payment.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={cn("font-normal", getStatusColor(payment.status))}>
                        {payment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="capitalize">
                      {payment.method.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Transactions Table (admin only) */}
      {viewType === 'transactions' && userType === 'admin' && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No transactions found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {transaction.id.substring(0, 8)}...
                    </TableCell>
                    
                    <TableCell>
                      {format(transaction.date, 'MMM d, yyyy')}
                      <div className="text-xs text-muted-foreground">
                        {format(transaction.date, 'h:mm a')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={cn("font-normal", getTransactionTypeColor(transaction.type))}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>{transaction.description}</TableCell>
                    
                    <TableCell>{transaction.fromAccount}</TableCell>
                    
                    <TableCell>{transaction.toAccount}</TableCell>
                    
                    <TableCell className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={cn("font-normal", getStatusColor(transaction.status))}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Transaction ID: {selectedPayment?.transactionId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-muted-foreground">Date</h4>
                  <p>{format(selectedPayment.date, 'PPP')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedPayment.date, 'h:mm a')}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-muted-foreground">Amount</h4>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Status
                </h4>
                <Badge className={cn("text-sm font-normal", getStatusColor(selectedPayment.status))}>
                  {selectedPayment.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Payment Method
                </h4>
                <p className="capitalize">{selectedPayment.method.replace('_', ' ')}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Fee Breakdown</h4>
                <div className="rounded-md border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>
                      {formatCurrency(selectedPayment.fees.platform, selectedPayment.currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shop Fee</span>
                    <span>
                      {formatCurrency(selectedPayment.fees.shop, selectedPayment.currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Mechanic Fee</span>
                    <span>
                      {formatCurrency(selectedPayment.fees.mechanic, selectedPayment.currency)}
                    </span>
                  </div>
                  
                  {selectedPayment.fees.driver !== undefined && (
                    <div className="flex justify-between">
                      <span>Driver Fee</span>
                      <span>
                        {formatCurrency(selectedPayment.fees.driver, selectedPayment.currency)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>
                      {formatCurrency(selectedPayment.fees.tax, selectedPayment.currency)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Fees</span>
                    <span>
                      {formatCurrency(selectedPayment.fees.total, selectedPayment.currency)}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedPayment.refunds && selectedPayment.refunds.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Refunds</h4>
                  <div className="rounded-md border divide-y">
                    {selectedPayment.refunds.map((refund) => (
                      <div key={refund.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{formatCurrency(refund.amount, selectedPayment.currency)}</p>
                            <p className="text-sm text-muted-foreground">{format(refund.date, 'PPP')}</p>
                          </div>
                          <Badge className={cn("font-normal", getStatusColor(refund.status))}>
                            {refund.status}
                          </Badge>
                        </div>
                        {refund.reason && (
                          <p className="text-sm mt-1">Reason: {refund.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {userType === 'admin' && selectedPayment.status !== 'refunded' && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Download Receipt</Button>
                  <Button variant="destructive">Process Refund</Button>
                </div>
              )}
              
              {userType !== 'admin' && (
                <div className="flex justify-end">
                  <Button variant="outline">Download Receipt</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 