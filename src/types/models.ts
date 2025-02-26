/**
 * Core model definitions for the Mechanic-on-Demand application
 */

// User Types
export type UserRole = 'customer' | 'driver' | 'shop' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  profile_image?: string;
  created_at: string;
  updated_at?: string;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  license_plate?: string;
  color?: string;
  created_at: string;
  updated_at?: string;
}

// Shop Types
export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  open_hours: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

// Service Request Types
export type ServiceRequestStatus = 
  'pending' | 
  'accepted' | 
  'dispatched' | 
  'pickup_in_progress' | 
  'picked_up' |
  'at_shop' |
  'in_progress' | 
  'ready_for_delivery' |
  'delivery_in_progress' |
  'delivered' |
  'completed' | 
  'cancelled' |
  'pending_payment' |
  'paid';

export interface ServiceRequest {
  id: string;
  customer_id: string;
  vehicle_id: string;
  service_type_id: string;
  service_type?: string;
  description: string;
  status: ServiceRequestStatus;
  pickup_date: string;
  pickup_time_slot: string;
  pickup_address: string;
  preferred_shop_id?: string;
  driver_id?: string;
  mechanic_id?: string;
  price?: number;
  created_at: string;
  updated_at?: string;
  vehicles?: Vehicle;
}

// Driver Types
export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | string;
  vehicle_color: string;
  vehicle_license_plate: string;
  max_distance: number; // Maximum distance in miles driver is willing to travel
  is_available: boolean;
  current_location?: {
    latitude: number;
    longitude: number;
    last_updated: string;
  };
  rating?: number;
  jobs_completed?: number;
  earnings_to_date?: number;
  created_at?: string;
  updated_at?: string;
}

// Payment Types
export interface Payment {
  id: string;
  service_request_id: string;
  customer_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  updated_at?: string;
}

// Driver Earnings Types
export interface DriverEarnings {
  id: string;
  driver_id: string;
  service_request_id: string;
  amount: number;
  job_type: 'pickup' | 'delivery' | 'both';
  customer_name: string;
  shop_name: string;
  vehicle_info: string;
  date: string;
  status: 'pending' | 'paid';
  payout_id?: string;
  created_at: string;
  updated_at: string;
}

// For API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Service Type model
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_hours: number;
  active: boolean;
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Review model
export interface Review {
  id: string;
  service_request_id: string;
  customer_id: string;
  shop_id?: string;
  mechanic_id?: string;
  driver_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
}

// Notification Types
export type NotificationType = 
  'service_request_status' | 
  'payment_status' | 
  'driver_assigned' | 
  'mechanic_assigned' | 
  'vehicle_ready' | 
  'review_request' | 
  'system';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  service_request_status: NotificationChannel[];
  payment_status: NotificationChannel[];
  driver_assigned: NotificationChannel[];
  mechanic_assigned: NotificationChannel[];
  vehicle_ready: NotificationChannel[];
  review_request: NotificationChannel[];
  system: NotificationChannel[];
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string; // Can be service_request_id, payment_id, etc.
  is_read: boolean;
  channel: NotificationChannel;
  created_at: string;
  updated_at?: string;
} 