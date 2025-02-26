"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Search, CreditCard, Check, Download, AlertCircle, Filter, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

// Types
interface PayoutEntity {
  id: string;
  name: string;
  type: 'shop' | 'mechanic';
  email: string;
  balance: number;
  pendingAmount: number;
  payoutMethod: {
    type: string;
    details: string;
    verified: boolean;
  };
  lastPayout?: {
    date: Date;
    amount: number;
    reference: string;
  };
  status: 'active' | 'pending' | 'suspended';
}

interface PayoutHistory {
  id: string;
  entityId: string;
  entityName: string;
  entityType: 'shop' | 'mechanic';
  amount: number;
  fee: number;
  netAmount: number;
  date: Date;
  status: 'completed' | 'processing' | 'failed';
  reference: string;
  method: {
    type: string;
    details: string;
  };
}

interface PayoutManagerProps {
  onCreatePayout?: (payoutData: any) => Promise<void>;
}

export default function PayoutManager({ onCreatePayout }: PayoutManagerProps) {
  // Mock data for payout entities (shops and mechanics)
  const mockEntities: PayoutEntity[] = [
    {
      id: 'shop_1',
      name: 'Quick Fix Auto',
      type: 'shop',
      email: 'accounting@quickfix.com',
      balance: 2570.00,
      pendingAmount: 450.00,
      payoutMethod: {
        type: 'bank_account',
        details: 'Bank of America ****1234',
        verified: true,
      },
      lastPayout: {
        date: new Date(2023, 5, 30),
        amount: 1850.00,
        reference: 'PYT-7612834'
      },
      status: 'active'
    },
    {
      id: 'shop_2',
      name: 'Pro Auto Care',
      type: 'shop',
      email: 'finance@proauto.com',
      balance: 1270.00,
      pendingAmount: 325.00,
      payoutMethod: {
        type: 'bank_account',
        details: 'Chase Bank ****5678',
        verified: true,
      },
      lastPayout: {
        date: new Date(2023, 5, 28),
        amount: 980.00,
        reference: 'PYT-7612456'
      },
      status: 'active'
    },
    {
      id: 'mech_1',
      name: 'Mike Smith',
      type: 'mechanic',
      email: 'mike.smith@example.com',
      balance: 780.00,
      pendingAmount: 120.00,
      payoutMethod: {
        type: 'paypal',
        details: 'mike.smith@example.com',
        verified: true,
      },
      lastPayout: {
        date: new Date(2023, 5, 29),
        amount: 540.00,
        reference: 'PYT-7612567'
      },
      status: 'active'
    },
    {
      id: 'mech_2',
      name: 'Dave Wilson',
      type: 'mechanic',
      email: 'dave.wilson@example.com',
      balance: 430.00,
      pendingAmount: 90.00,
      payoutMethod: {
        type: 'bank_account',
        details: 'Wells Fargo ****9012',
        verified: false,
      },
      status: 'pending'
    },
    {
      id: 'shop_3',
      name: 'City Garage',
      type: 'shop',
      email: 'accounts@citygarage.com',
      balance: 1830.00,
      pendingAmount: 270.00,
      payoutMethod: {
        type: 'bank_account',
        details: 'US Bank ****3456',
        verified: true,
      },
      lastPayout: {
        date: new Date(2023, 5, 25),
        amount: 1250.00,
        reference: 'PYT-7612098'
      },
      status: 'active'
    },
    {
      id: 'mech_3',
      name: 'Alex Rodriguez',
      type: 'mechanic',
      email: 'alex.rodriguez@example.com',
      balance: 920.00,
      pendingAmount: 180.00,
      payoutMethod: {
        type: 'paypal',
        details: 'alex.rodriguez@example.com',
        verified: true,
      },
      lastPayout: {
        date: new Date(2023, 5, 27),
        amount: 670.00,
        reference: 'PYT-7612345'
      },
      status: 'suspended'
    }
  ];

  // Mock payout history
  const mockPayoutHistory: PayoutHistory[] = [
    {
      id: 'payout_1',
      entityId: 'shop_1',
      entityName: 'Quick Fix Auto',
      entityType: 'shop',
      amount: 1850.00,
      fee: 5.00,
      netAmount: 1845.00,
      date: new Date(2023, 5, 30),
      status: 'completed',
      reference: 'PYT-7612834',
      method: {
        type: 'bank_account',
        details: 'Bank of America ****1234',
      }
    },
    {
      id: 'payout_2',
      entityId: 'mech_1',
      entityName: 'Mike Smith',
      entityType: 'mechanic',
      amount: 540.00,
      fee: 2.50,
      netAmount: 537.50,
      date: new Date(2023, 5, 29),
      status: 'completed',
      reference: 'PYT-7612567',
      method: {
        type: 'paypal',
        details: 'mike.smith@example.com',
      }
    },
    {
      id: 'payout_3',
      entityId: 'shop_2',
      entityName: 'Pro Auto Care',
      entityType: 'shop',
      amount: 980.00,
      fee: 4.00,
      netAmount: 976.00,
      date: new Date(2023, 5, 28),
      status: 'completed',
      reference: 'PYT-7612456',
      method: {
        type: 'bank_account',
        details: 'Chase Bank ****5678',
      }
    },
    {
      id: 'payout_4',
      entityId: 'mech_3',
      entityName: 'Alex Rodriguez',
      entityType: 'mechanic',
      amount: 670.00,
      fee: 3.00,
      netAmount: 667.00,
      date: new Date(2023, 5, 27),
      status: 'completed',
      reference: 'PYT-7612345',
      method: {
        type: 'paypal',
        details: 'alex.rodriguez@example.com',
      }
    },
    {
      id: 'payout_5',
      entityId: 'shop_3',
      entityName: 'City Garage',
      entityType: 'shop',
      amount: 1250.00,
      fee: 4.50,
      netAmount: 1245.50,
      date: new Date(2023, 5, 25),
      status: 'completed',
      reference: 'PYT-7612098',
      method: {
        type: 'bank_account',
        details: 'US Bank ****3456',
      }
    }
  ];

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [bulkPayoutDialogOpen, setBulkPayoutDialogOpen] = useState(false);
  const [isCreatingPayout, setIsCreatingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('balance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Computed values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const filteredEntities = mockEntities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         entity.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = entityTypeFilter === 'all' || entity.type === entityTypeFilter;
    const matchesStatus = statusFilter === 'all' || entity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedEntities = [...filteredEntities].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'balance') {
      return sortDirection === 'asc'
        ? a.balance - b.balance
        : b.balance - a.balance;
    } else if (sortBy === 'lastPayout') {
      // Handle entities without lastPayout
      if (!a.lastPayout && !b.lastPayout) return 0;
      if (!a.lastPayout) return sortDirection === 'asc' ? -1 : 1;
      if (!b.lastPayout) return sortDirection === 'asc' ? 1 : -1;
      
      return sortDirection === 'asc'
        ? a.lastPayout.date.getTime() - b.lastPayout.date.getTime()
        : b.lastPayout.date.getTime() - a.lastPayout.date.getTime();
    }
    return 0;
  });

  const totalSelectedAmount = selectedEntities.reduce((sum, id) => {
    const entity = mockEntities.find(e => e.id === id);
    return sum + (entity?.balance || 0);
  }, 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntities(filteredEntities.map(e => e.id));
    } else {
      setSelectedEntities([]);
    }
  };

  const handleSelectEntity = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEntities([...selectedEntities, id]);
    } else {
      setSelectedEntities(selectedEntities.filter(entityId => entityId !== id));
    }
  };

  const handleBulkPayout = async () => {
    setIsCreatingPayout(true);
    setPayoutSuccess(false);
    setPayoutError(null);
    
    try {
      // In a real implementation, this would call the API
      if (onCreatePayout) {
        const payoutData = {
          entities: selectedEntities.map(id => {
            const entity = mockEntities.find(e => e.id === id);
            return {
              id,
              amount: entity?.balance || 0,
              method: entity?.payoutMethod.type
            };
          }),
          totalAmount: totalSelectedAmount
        };
        
        await onCreatePayout(payoutData);
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPayoutSuccess(true);
      setSelectedEntities([]);
    } catch (error) {
      setPayoutError('Failed to process payout. Please try again.');
      console.error('Payout error:', error);
    } finally {
      setIsCreatingPayout(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="entities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entities">Payout Recipients</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entities" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shop">Shops</SelectItem>
                  <SelectItem value="mechanic">Mechanics</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedEntities.length > 0 && (
                <Dialog open={bulkPayoutDialogOpen} onOpenChange={setBulkPayoutDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay Selected ({selectedEntities.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Confirm Bulk Payout</DialogTitle>
                      <DialogDescription>
                        You are about to process payouts for {selectedEntities.length} {selectedEntities.length === 1 ? 'recipient' : 'recipients'}.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <div className="space-y-4">
                        <div className="flex justify-between font-medium">
                          <span>Total Amount:</span>
                          <span className="text-lg">{formatCurrency(totalSelectedAmount)}</span>
                        </div>
                        <Separator />
                        <div className="max-h-[200px] overflow-y-auto">
                          {selectedEntities.map(id => {
                            const entity = mockEntities.find(e => e.id === id);
                            if (!entity) return null;
                            
                            return (
                              <div key={entity.id} className="flex justify-between items-center py-2">
                                <div>
                                  <div>{entity.name}</div>
                                  <div className="text-sm text-muted-foreground">{entity.payoutMethod.type}</div>
                                </div>
                                <div>{formatCurrency(entity.balance)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {payoutSuccess && (
                        <Alert className="mt-4" variant="default">
                          <Check className="h-4 w-4" />
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>Payouts have been successfully processed.</AlertDescription>
                        </Alert>
                      )}
                      
                      {payoutError && (
                        <Alert className="mt-4" variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{payoutError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkPayoutDialogOpen(false)} disabled={isCreatingPayout}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkPayout} disabled={isCreatingPayout || payoutSuccess}>
                        {isCreatingPayout ? 'Processing...' : 'Confirm Payout'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={filteredEntities.length > 0 && selectedEntities.length === filteredEntities.length} 
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                      <div className="flex items-center">
                        Name/Email
                        {sortBy === 'name' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payout Method</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('balance')}>
                      <div className="flex items-center">
                        Balance
                        {sortBy === 'balance' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('lastPayout')}>
                      <div className="flex items-center">
                        Last Payout
                        {sortBy === 'lastPayout' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        No matching recipients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedEntities.map(entity => (
                      <TableRow key={entity.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedEntities.includes(entity.id)} 
                            onCheckedChange={(checked) => handleSelectEntity(entity.id, !!checked)}
                            disabled={entity.status !== 'active' || !entity.payoutMethod.verified}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-sm text-muted-foreground">{entity.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entity.type === 'shop' ? 'default' : 'secondary'}>
                            {entity.type === 'shop' ? 'Shop' : 'Mechanic'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            entity.status === 'active' ? 'outline' : 
                            entity.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {entity.status.charAt(0).toUpperCase() + entity.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="font-medium">
                              {entity.payoutMethod.type === 'bank_account' ? 'Bank Transfer' : 'PayPal'}
                            </div>
                            <Badge variant={entity.payoutMethod.verified ? 'outline' : 'secondary'} className="ml-2">
                              {entity.payoutMethod.verified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{entity.payoutMethod.details}</div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(entity.balance)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(entity.pendingAmount)}
                        </TableCell>
                        <TableCell>
                          {entity.lastPayout ? (
                            <>
                              <div>{format(entity.lastPayout.date, 'MMM d, yyyy')}</div>
                              <div className="text-sm text-muted-foreground">{formatCurrency(entity.lastPayout.amount)}</div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No previous payouts</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 px-2">
                                <DollarSign className="h-4 w-4" />
                                <span className="sr-only">Pay</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Process Payout</DialogTitle>
                                <DialogDescription>
                                  Send funds to {entity.name} ({entity.type === 'shop' ? 'Shop' : 'Mechanic'})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <Label htmlFor="payout-amount">Payout Amount</Label>
                                  <div className="relative mt-1">
                                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      id="payout-amount"
                                      type="number"
                                      className="pl-8"
                                      defaultValue={entity.balance.toFixed(2)}
                                    />
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">Maximum available: {formatCurrency(entity.balance)}</p>
                                </div>
                                <div>
                                  <Label>Payout Method</Label>
                                  <div className="flex items-center mt-1 p-3 border rounded-md">
                                    <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {entity.payoutMethod.type === 'bank_account' ? 'Bank Transfer' : 'PayPal'}
                                      </div>
                                      <div className="text-sm text-muted-foreground">{entity.payoutMethod.details}</div>
                                    </div>
                                    {entity.payoutMethod.verified && (
                                      <Badge variant="outline" className="ml-auto">Verified</Badge>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="payout-note">Note (Optional)</Label>
                                  <Input id="payout-note" placeholder="Add a note to this payout" className="mt-1" />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" className="mr-2">
                                  Cancel
                                </Button>
                                <Button>Process Payout</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>View all previous payouts to shops and mechanics</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayoutHistory.map(payout => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.reference}</TableCell>
                      <TableCell>{format(payout.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div>{payout.entityName}</div>
                        <div className="text-sm text-muted-foreground">{payout.entityId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payout.entityType === 'shop' ? 'default' : 'secondary'}>
                          {payout.entityType === 'shop' ? 'Shop' : 'Mechanic'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {payout.method.type === 'bank_account' ? 'Bank Transfer' : 'PayPal'}
                        </div>
                        <div className="text-sm text-muted-foreground">{payout.method.details}</div>
                      </TableCell>
                      <TableCell>{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">-{formatCurrency(payout.fee)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payout.netAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          payout.status === 'completed' ? 'outline' : 
                          payout.status === 'processing' ? 'secondary' : 'destructive'
                        }>
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 