"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car, Calendar as CalendarIcon, Clock, MapPin, User, Phone, ClipboardCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { format, parse, addMinutes, isAfter, isBefore, isSameDay } from 'date-fns';

import {
  Appointment,
  TimeSlot,
  TimeSlotWithAvailability,
  AppointmentType,
  CalendarEvent,
} from '@/types/scheduling';

import CalendarView from './Calendar';

interface ScheduleManagerProps {
  userRole: 'admin' | 'customer' | 'driver' | 'mechanic';
  userId: string;
  onCreateAppointment?: (appointment: Partial<Appointment>) => Promise<void>;
  onCancelAppointment?: (appointmentId: string) => Promise<void>;
  onRescheduleAppointment?: (appointmentId: string, newTimeSlotId: string) => Promise<void>;
}

export default function ScheduleManager({
  userRole,
  userId,
  onCreateAppointment,
  onCancelAppointment,
  onRescheduleAppointment
}: ScheduleManagerProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithAvailability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotWithAvailability | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isReschedulingDialogOpen, setIsReschedulingDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const [newAppointment, setNewAppointment] = useState({
    serviceRequestId: '',
    appointmentType: 'pickup' as AppointmentType,
    notes: ''
  });
  
  const [serviceRequests, setServiceRequests] = useState([
    { 
      id: 'sr-1', 
      customerName: 'John Smith', 
      vehicleInfo: '2018 Toyota Camry', 
      status: 'pending',
      serviceType: 'Brake Repair',
      location: '123 Main St, Anytown, USA'
    },
    { 
      id: 'sr-2', 
      customerName: 'Sarah Jones', 
      vehicleInfo: '2020 Honda Civic', 
      status: 'pending',
      serviceType: 'Oil Change',
      location: '456 Oak Ave, Othertown, USA'
    },
    { 
      id: 'sr-3', 
      customerName: 'Mike Wilson', 
      vehicleInfo: '2019 Ford F-150', 
      status: 'assigned',
      serviceType: 'Alternator Replacement',
      location: '789 Pine St, Somewhere, USA'
    }
  ]);

  // Generate mock time slots and appointments for demonstration
  useEffect(() => {
    // Generate time slots for the selected date
    const mockTimeSlots: TimeSlotWithAvailability[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const slotDuration = 60; // 60 minutes per slot
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      
      const isAvailable = Math.random() > 0.3; // 70% chance of being available
      
      mockTimeSlots.push({
        id: `ts-${selectedDate.toISOString().split('T')[0]}-${hour}`,
        driver_id: 'driver-1',
        date: selectedDate.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        is_available: isAvailable,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_booked: !isAvailable && Math.random() > 0.5
      });
    }
    
    setTimeSlots(mockTimeSlots);
    
    // Generate mock appointments
    const mockAppointments: Appointment[] = [];
    
    // Add some booked appointments
    mockTimeSlots.forEach(slot => {
      if (!slot.is_available && slot.is_booked) {
        const appointmentType = Math.random() > 0.5 ? 'pickup' : 'delivery';
        const serviceRequestId = ['sr-1', 'sr-2', 'sr-3'][Math.floor(Math.random() * 3)];
        
        mockAppointments.push({
          id: `app-${slot.id}`,
          service_request_id: serviceRequestId,
          time_slot_id: slot.id,
          appointment_type: appointmentType as AppointmentType,
          notes: `Mock ${appointmentType} appointment`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        // Update time slot to link to this appointment
        slot.appointment_id = `app-${slot.id}`;
        slot.service_request_id = serviceRequestId;
      }
    });
    
    setAppointments(mockAppointments);
    
    // Generate calendar events
    const events: CalendarEvent[] = mockTimeSlots.map(slot => {
      const startDate = new Date(`${slot.date}T${slot.start_time}`);
      const endDate = new Date(`${slot.date}T${slot.end_time}`);
      const appointment = mockAppointments.find(app => app.time_slot_id === slot.id);
      const serviceRequest = appointment ? 
        serviceRequests.find(sr => sr.id === appointment.service_request_id) : 
        undefined;
      
      let eventType: 'available' | 'unavailable' | AppointmentType = slot.is_available ? 
        'available' : 
        (appointment ? appointment.appointment_type : 'unavailable');
      
      return {
        id: slot.id,
        title: appointment ? 
          `${appointment.appointment_type.charAt(0).toUpperCase() + appointment.appointment_type.slice(1)}: ${serviceRequest?.customerName || 'Unknown'}` : 
          (slot.is_available ? 'Available' : 'Unavailable'),
        start: startDate,
        end: endDate,
        type: eventType,
        timeSlotId: slot.id,
        appointmentId: appointment?.id,
        serviceRequestId: appointment?.service_request_id,
        customerName: serviceRequest?.customerName,
        vehicleInfo: serviceRequest?.vehicleInfo,
        address: serviceRequest?.location,
        status: serviceRequest?.status
      };
    });
    
    setCalendarEvents(events);
  }, [selectedDate]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handleTimeSlotSelect = (timeSlot: TimeSlotWithAvailability) => {
    if (timeSlot.is_available) {
      setSelectedTimeSlot(timeSlot);
      setIsBookingDialogOpen(true);
    } else if (timeSlot.is_booked) {
      const appointment = appointments.find(app => app.time_slot_id === timeSlot.id);
      if (appointment) {
        setSelectedAppointment(appointment);
        setIsDetailsDialogOpen(true);
      }
    }
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'available') {
      const timeSlot = timeSlots.find(ts => ts.id === event.timeSlotId);
      if (timeSlot) {
        setSelectedTimeSlot(timeSlot);
        setIsBookingDialogOpen(true);
      }
    } else if (event.type === 'pickup' || event.type === 'delivery' || event.type === 'service') {
      const appointment = appointments.find(app => app.id === event.appointmentId);
      if (appointment) {
        setSelectedAppointment(appointment);
        setIsDetailsDialogOpen(true);
      }
    }
  };
  
  const handleBookingSubmit = async () => {
    if (!selectedTimeSlot || !newAppointment.serviceRequestId) return;
    
    const appointmentData: Partial<Appointment> = {
      serviceRequestId: newAppointment.serviceRequestId,
      timeSlotId: selectedTimeSlot.id,
      type: newAppointment.appointmentType,
      notes: newAppointment.notes
    };
    
    if (onCreateAppointment) {
      try {
        await onCreateAppointment(appointmentData);
        
        // Update local state (this would be replaced by a refetch in a real app)
        const newAppointmentId = `app-${Date.now()}`;
        const newAppointmentObj: Appointment = {
          id: newAppointmentId,
          ...appointmentData as Omit<Appointment, 'id'>,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setAppointments(prev => [...prev, newAppointmentObj]);
        
        // Update the time slot
        setTimeSlots(prev => prev.map(ts => {
          if (ts.id === selectedTimeSlot.id) {
            return {
              ...ts,
              is_available: false,
              is_booked: true,
              appointment_id: newAppointmentId,
              service_request_id: newAppointment.serviceRequestId
            };
          }
          return ts;
        }));
        
        // Update calendar events
        const serviceRequest = serviceRequests.find(sr => sr.id === newAppointment.serviceRequestId);
        setCalendarEvents(prev => prev.map(event => {
          if (event.timeSlotId === selectedTimeSlot.id) {
            return {
              ...event,
              title: `${newAppointment.appointmentType.charAt(0).toUpperCase() + newAppointment.appointmentType.slice(1)}: ${serviceRequest?.customerName || 'Unknown'}`,
              type: newAppointment.appointmentType,
              appointmentId: newAppointmentId,
              serviceRequestId: newAppointment.serviceRequestId,
              customerName: serviceRequest?.customerName,
              vehicleInfo: serviceRequest?.vehicleInfo,
              address: serviceRequest?.location
            };
          }
          return event;
        }));
        
        // Reset and close dialog
        setNewAppointment({
          serviceRequestId: '',
          appointmentType: 'pickup',
          notes: ''
        });
        setIsBookingDialogOpen(false);
      } catch (error) {
        console.error('Failed to create appointment:', error);
      }
    }
  };
  
  const handleRescheduleClick = () => {
    if (selectedAppointment) {
      setIsDetailsDialogOpen(false);
      setIsReschedulingDialogOpen(true);
    }
  };
  
  const handleRescheduleSubmit = async (newTimeSlotId: string) => {
    if (!selectedAppointment || !onRescheduleAppointment) return;
    
    try {
      await onRescheduleAppointment(selectedAppointment.id, newTimeSlotId);
      
      // Update local state (this would be replaced by a refetch in a real app)
      const oldTimeSlotId = selectedAppointment.time_slot_id;
      
      // Update appointment
      setAppointments(prev => prev.map(app => {
        if (app.id === selectedAppointment.id) {
          return {
            ...app,
            time_slot_id: newTimeSlotId,
            updated_at: new Date().toISOString()
          };
        }
        return app;
      }));
      
      // Update time slots
      setTimeSlots(prev => prev.map(ts => {
        if (ts.id === oldTimeSlotId) {
          return {
            ...ts,
            is_available: true,
            is_booked: false,
            appointment_id: undefined,
            service_request_id: undefined
          };
        }
        if (ts.id === newTimeSlotId) {
          return {
            ...ts,
            is_available: false,
            is_booked: true,
            appointment_id: selectedAppointment.id,
            service_request_id: selectedAppointment.service_request_id
          };
        }
        return ts;
      }));
      
      // Update calendar events
      const serviceRequest = serviceRequests.find(sr => sr.id === selectedAppointment.service_request_id);
      setCalendarEvents(prev => prev.map(event => {
        if (event.timeSlotId === oldTimeSlotId) {
          return {
            ...event,
            title: 'Available',
            type: 'available',
            appointmentId: undefined,
            serviceRequestId: undefined,
            customerName: undefined,
            vehicleInfo: undefined,
            address: undefined,
            status: undefined
          };
        }
        if (event.timeSlotId === newTimeSlotId) {
          return {
            ...event,
            title: `${selectedAppointment.appointment_type.charAt(0).toUpperCase() + selectedAppointment.appointment_type.slice(1)}: ${serviceRequest?.customerName || 'Unknown'}`,
            type: selectedAppointment.appointment_type,
            appointmentId: selectedAppointment.id,
            serviceRequestId: selectedAppointment.service_request_id,
            customerName: serviceRequest?.customerName,
            vehicleInfo: serviceRequest?.vehicleInfo,
            address: serviceRequest?.location,
            status: serviceRequest?.status
          };
        }
        return event;
      }));
      
      setIsReschedulingDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
    }
  };
  
  const handleCancelClick = async () => {
    if (!selectedAppointment || !onCancelAppointment) return;
    
    try {
      await onCancelAppointment(selectedAppointment.id);
      
      // Update local state (this would be replaced by a refetch in a real app)
      const timeSlotId = selectedAppointment.time_slot_id;
      
      // Remove appointment
      setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id));
      
      // Update time slot
      setTimeSlots(prev => prev.map(ts => {
        if (ts.id === timeSlotId) {
          return {
            ...ts,
            is_available: true,
            is_booked: false,
            appointment_id: undefined,
            service_request_id: undefined
          };
        }
        return ts;
      }));
      
      // Update calendar event
      setCalendarEvents(prev => prev.map(event => {
        if (event.timeSlotId === timeSlotId) {
          return {
            ...event,
            title: 'Available',
            type: 'available',
            appointmentId: undefined,
            serviceRequestId: undefined,
            customerName: undefined,
            vehicleInfo: undefined,
            address: undefined,
            status: undefined
          };
        }
        return event;
      }));
      
      setIsDetailsDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };
  
  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getAppointmentTypeBadge = (type: AppointmentType) => {
    switch (type) {
      case 'pickup':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Pickup</Badge>;
      case 'delivery':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Delivery</Badge>;
      case 'service':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Service</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Schedule Manager</h2>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-md bg-white p-2">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="p-0"
            />
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="pt-4">
          <div className="border rounded-md overflow-hidden h-[600px]">
            <CalendarView 
              events={calendarEvents}
              onEventClick={handleEventClick}
              viewMode="day"
              initialDate={selectedDate}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="pt-4">
          <div className="border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Time Slots</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-100 border border-green-400 mr-1"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-400 mr-1"></div>
                  <span className="text-sm">Unavailable</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-400 mr-1"></div>
                  <span className="text-sm">Booked</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeSlots.map(slot => {
                const startTime = format(parse(slot.start_time, 'HH:mm:ss', new Date()), 'h:mm a');
                const endTime = format(parse(slot.end_time, 'HH:mm:ss', new Date()), 'h:mm a');
                
                return (
                  <div 
                    key={slot.id}
                    className={`
                      p-3 rounded-md border cursor-pointer transition-colors
                      ${slot.is_available 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : slot.is_booked 
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                          : 'bg-gray-50 border-gray-200'}
                    `}
                    onClick={() => handleTimeSlotSelect(slot)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{startTime} - {endTime}</span>
                      <Badge variant={slot.is_available ? "outline" : "secondary"}>
                        {slot.is_available 
                          ? 'Available' 
                          : slot.is_booked
                            ? 'Booked'
                            : 'Unavailable'}
                      </Badge>
                    </div>
                    
                    {slot.is_booked && slot.service_request_id && (
                      <div className="mt-2 text-sm">
                        {getAppointmentTypeBadge(
                          appointments.find(a => a.time_slot_id === slot.id)?.appointment_type || 'pickup'
                        )}
                        <div className="mt-1">
                          <span className="font-medium">
                            {serviceRequests.find(sr => sr.id === slot.service_request_id)?.customerName || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="appointments" className="pt-4">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map(appointment => {
                  const timeSlot = timeSlots.find(ts => ts.id === appointment.time_slot_id);
                  const serviceRequest = serviceRequests.find(sr => sr.id === appointment.service_request_id);
                  
                  if (!timeSlot || !serviceRequest) return null;
                  
                  const date = new Date(`${timeSlot.date}T${timeSlot.start_time}`);
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{format(date, 'MMM d, yyyy')}</div>
                        <div className="text-sm text-gray-500">
                          {format(date, 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAppointmentTypeBadge(appointment.appointment_type)}
                      </TableCell>
                      <TableCell>{serviceRequest.customerName}</TableCell>
                      <TableCell>{serviceRequest.vehicleInfo}</TableCell>
                      <TableCell>
                        {getAppointmentStatusBadge(serviceRequest.status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No appointments scheduled
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTimeSlot && (
              <div className="flex items-center space-x-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(`${selectedTimeSlot.date}T${selectedTimeSlot.start_time}`), 'MMMM d, yyyy')} at{' '}
                  {format(parse(selectedTimeSlot.start_time, 'HH:mm:ss', new Date()), 'h:mm a')} - {' '}
                  {format(parse(selectedTimeSlot.end_time, 'HH:mm:ss', new Date()), 'h:mm a')}
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="service-request">Service Request</Label>
              <Select 
                value={newAppointment.serviceRequestId} 
                onValueChange={(value) => setNewAppointment({...newAppointment, serviceRequestId: value})}
              >
                <SelectTrigger id="service-request">
                  <SelectValue placeholder="Select a service request" />
                </SelectTrigger>
                <SelectContent>
                  {serviceRequests.map(request => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.customerName} - {request.vehicleInfo} ({request.serviceType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointment-type">Appointment Type</Label>
              <Select 
                value={newAppointment.appointmentType} 
                onValueChange={(value: AppointmentType) => setNewAppointment({...newAppointment, appointmentType: value})}
              >
                <SelectTrigger id="appointment-type">
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Vehicle Pickup</SelectItem>
                  <SelectItem value="delivery">Vehicle Delivery</SelectItem>
                  <SelectItem value="service">On-Site Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Additional notes for this appointment"
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleBookingSubmit}>
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedAppointment && (() => {
              const timeSlot = timeSlots.find(ts => ts.id === selectedAppointment.time_slot_id);
              const serviceRequest = serviceRequests.find(sr => sr.id === selectedAppointment.service_request_id);
              
              if (!timeSlot || !serviceRequest) return null;
              
              const startTime = format(new Date(`${timeSlot.date}T${timeSlot.start_time}`), 'MMMM d, yyyy h:mm a');
              const endTime = format(new Date(`${timeSlot.date}T${timeSlot.end_time}`), 'h:mm a');
              
              return (
                <>
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-lg">
                      {getAppointmentTypeBadge(selectedAppointment.appointment_type)}
                    </div>
                    <div>
                      {getAppointmentStatusBadge(serviceRequest.status)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-4 items-start">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <div>{startTime} - {endTime}</div>
                    
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="font-medium">{serviceRequest.customerName}</div>
                    
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>{serviceRequest.vehicleInfo}</div>
                    
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>{serviceRequest.location}</div>
                    
                    <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                    <div>{serviceRequest.serviceType}</div>
                    
                    {selectedAppointment.notes && (
                      <>
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        <div>{selectedAppointment.notes}</div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-end">
            <div className="flex space-x-2">
              {onCancelAppointment && (
                <Button variant="destructive" onClick={handleCancelClick}>
                  Cancel Appointment
                </Button>
              )}
              
              {onRescheduleAppointment && (
                <Button variant="outline" onClick={handleRescheduleClick}>
                  Reschedule
                </Button>
              )}
            </div>
            
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rescheduling Dialog */}
      <Dialog open={isReschedulingDialogOpen} onOpenChange={setIsReschedulingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground mb-2">
              Select a new available time slot:
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {timeSlots
                .filter(slot => slot.is_available)
                .map(slot => {
                  const startTime = format(parse(slot.start_time, 'HH:mm:ss', new Date()), 'h:mm a');
                  const endTime = format(parse(slot.end_time, 'HH:mm:ss', new Date()), 'h:mm a');
                  
                  return (
                    <div 
                      key={slot.id}
                      className="p-3 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer"
                      onClick={() => handleRescheduleSubmit(slot.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {format(new Date(`${slot.date}T${slot.start_time}`), 'MMM d')} · {startTime} - {endTime}
                        </span>
                        <CheckCircle className="h-5 w-5 text-green-500 opacity-0 hover:opacity-100" />
                      </div>
                    </div>
                  );
                })}
              
              {timeSlots.filter(slot => slot.is_available).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No available time slots on this date. Please select a different date.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsReschedulingDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 