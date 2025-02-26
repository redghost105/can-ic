/**
 * Type definitions for the scheduling system
 */

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export type AppointmentCategory = 'pickup' | 'delivery' | 'service' | 'consultation';

export interface TimeSlot {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  available: boolean;
  driverId?: string; // If assigned to a driver
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  active: boolean;
  rating: number;
  totalTrips: number;
  workingHours: {
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  }[];
  serviceAreas: string[]; // ZIP codes or area names
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdated: string; // ISO date string
  };
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  vin?: string;
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  notes?: string;
  type: 'home' | 'work' | 'shop' | 'custom';
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceType: string;
  description: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  estimatedCompletionDate?: string; // ISO date string
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number; // In minutes
  color: string;
}

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export interface Appointment {
  id: string;
  title: string;
  timeSlotId: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  type: AppointmentCategory;
  status: AppointmentStatus;
  customerId: string;
  driverId?: string;
  mechanicId?: string;
  vehicleId: string;
  serviceRequestId?: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  appointmentTypeId: string;
  color?: string;
  readableTime?: string; // Formatted time for display
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  type: AppointmentCategory;
  color?: string;
  appointmentId: string;
  driverId?: string;
  customerId: string;
  vehicleId: string;
  allDay?: boolean;
}

export interface ScheduleManagerProps {
  userRole: 'admin' | 'customer' | 'driver' | 'mechanic';
  userId: string;
  onCreateAppointment: (appointment: Partial<Appointment>) => Promise<void>;
  onCancelAppointment: (appointmentId: string) => Promise<void>;
  onRescheduleAppointment: (appointmentId: string, newTimeSlotId: string) => Promise<void>;
}

export interface SchedulerViewState {
  viewMode: 'day' | 'week' | 'month' | 'list';
  currentDate: Date;
  filterByType?: string[];
  filterByStatus?: AppointmentStatus[];
  filterByDriver?: string[];
  filterByMechanic?: string[];
  filterByCustomer?: string[];
}

export interface TimeSlotWithAvailability extends TimeSlot {
  is_booked?: boolean;
  appointment_id?: string;
  service_request_id?: string;
}

export interface AvailabilitySettings {
  driver_id: string;
  weekdays: {
    monday: TimeRange[];
    tuesday: TimeRange[];
    wednesday: TimeRange[];
    thursday: TimeRange[];
    friday: TimeRange[];
    saturday: TimeRange[];
    sunday: TimeRange[];
  }
}

export interface TimeRange {
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
}

export interface TimeSlotRequest {
  driver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface AppointmentRequest {
  service_request_id: string;
  time_slot_id: string;
  appointment_type: AppointmentCategory;
  notes?: string;
} 