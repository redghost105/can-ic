export interface ServiceNotes {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleInfo: string;
  serviceType: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  scheduledTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedMechanicId: string | null;
  shopId: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial';
  rating: number | null;
  notes: string | null;
}

export interface Payment {
  id: string;
  serviceRequestId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund';
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'wallet';
  transactionId: string;
  date: Date;
  currency: string;
  fees: {
    platform: number;
    shop: number;
    mechanic: number;
    driver?: number;
    tax: number;
    total: number;
  };
  customerId: string;
  recipientId: string;
  recipientType: 'platform' | 'shop' | 'mechanic' | 'driver';
  refunds?: {
    id: string;
    amount: number;
    reason: string;
    date: Date;
    status: 'pending' | 'completed' | 'failed';
  }[];
}

export interface TransactionHistory {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'adjustment';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  relatedId: string; // Could be paymentId, refundId, etc.
  description: string;
  date: Date;
  fromAccount: string;
  toAccount: string;
  currency: string;
} 