"use client";

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, setHours, setMinutes, parseISO } from 'date-fns';
import { Plus, Save, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Calendar from '@/components/scheduling/Calendar';
import { CalendarEvent, TimeSlot, TimeSlotRequest } from '@/types/scheduling';
import { useAuth } from '@/contexts/auth-context';

export default function DriverAvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedWeekday, setSelectedWeekday] = useState<string>("monday");
  const [weekdayTimeSlots, setWeekdayTimeSlots] = useState<{ [day: string]: { startTime: string, endTime: string }[]}>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  
  // Fetch existing time slots for the logged-in driver
  useEffect(() => {
    if (!user || user.role !== 'driver') return;
    
    const fetchTimeSlots = async () => {
      try {
        setIsLoading(true);
        
        // Fetch time slots for the next 30 days
        const today = new Date();
        const endDate = addDays(today, 30);
        
        const response = await fetch(`/api/time-slots?driver_id=${user.id}&start_date=${format(today, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTimeSlots(data.data);
          
          // Convert time slots to calendar events
          const events: CalendarEvent[] = data.data.map((slot: TimeSlot) => {
            const startDate = new Date(`${slot.date}T${slot.start_time}`);
            const endDate = new Date(`${slot.date}T${slot.end_time}`);
            
            return {
              id: slot.id,
              title: slot.is_available ? 'Available' : 'Unavailable',
              start: startDate,
              end: endDate,
              type: slot.is_available ? 'available' : 'unavailable',
              timeSlotId: slot.id
            };
          });
          
          setCalendarEvents(events);
        } else {
          toast({
            title: "Error",
            description: "Failed to load your availability slots",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        toast({
          title: "Error",
          description: "Failed to load your availability slots",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [user, toast]);
  
  // Add a new time slot to the week pattern
  const addTimeSlotToPattern = (day: string) => {
    setWeekdayTimeSlots(prev => {
      const updatedDaySlots = [...prev[day], { startTime: "09:00", endTime: "17:00" }];
      return { ...prev, [day]: updatedDaySlots };
    });
  };
  
  // Remove a time slot from the week pattern
  const removeTimeSlotFromPattern = (day: string, index: number) => {
    setWeekdayTimeSlots(prev => {
      const updatedDaySlots = [...prev[day]];
      updatedDaySlots.splice(index, 1);
      return { ...prev, [day]: updatedDaySlots };
    });
  };
  
  // Update a time slot in the week pattern
  const updateTimeSlotInPattern = (day: string, index: number, field: 'startTime' | 'endTime', value: string) => {
    setWeekdayTimeSlots(prev => {
      const updatedDaySlots = [...prev[day]];
      updatedDaySlots[index] = { 
        ...updatedDaySlots[index], 
        [field]: value 
      };
      return { ...prev, [day]: updatedDaySlots };
    });
  };
  
  // Add a single time slot to the selected day
  const addSingleTimeSlot = async () => {
    if (!user) return;
    
    try {
      const formattedDate = format(selectedDay, 'yyyy-MM-dd');
      
      const newTimeSlot: TimeSlotRequest = {
        driver_id: user.id,
        date: formattedDate,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true
      };
      
      const response = await fetch('/api/time-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTimeSlot)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new time slot to our state
        setTimeSlots(prev => [...prev, data.data]);
        
        // Add a new calendar event
        const startDate = new Date(`${data.data.date}T${data.data.start_time}`);
        const endDate = new Date(`${data.data.date}T${data.data.end_time}`);
        
        const newEvent: CalendarEvent = {
          id: data.data.id,
          title: 'Available',
          start: startDate,
          end: endDate,
          type: 'available',
          timeSlotId: data.data.id
        };
        
        setCalendarEvents(prev => [...prev, newEvent]);
        
        toast({
          title: "Success",
          description: "Time slot added successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add time slot",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding time slot:", error);
      toast({
        title: "Error",
        description: "Failed to add time slot",
        variant: "destructive",
      });
    }
  };
  
  // Generate time slots for the entire week based on pattern
  const generateWeeklySchedule = async () => {
    if (!user) return;
    
    try {
      // Start from the current week
      const startOfCurrentWeek = startOfWeek(new Date());
      const weekdayMap: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };
      
      // Generate time slots for all configured days
      const newTimeSlots: TimeSlotRequest[] = [];
      
      Object.entries(weekdayTimeSlots).forEach(([day, slots]) => {
        if (slots.length === 0) return;
        
        // Get the date for this weekday
        const dayOfWeek = weekdayMap[day];
        const dayDate = addDays(startOfCurrentWeek, dayOfWeek);
        const formattedDate = format(dayDate, 'yyyy-MM-dd');
        
        // Create time slots for each time range
        slots.forEach(slot => {
          newTimeSlots.push({
            driver_id: user.id,
            date: formattedDate,
            start_time: `${slot.startTime}:00`,
            end_time: `${slot.endTime}:00`,
            is_available: true,
            is_recurring: true,
            recurrence_pattern: 'weekly'
          });
        });
      });
      
      // Submit all new time slots
      const promises = newTimeSlots.map(slot => 
        fetch('/api/time-slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(slot)
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      const successful = results.filter(result => result.success);
      
      if (successful.length > 0) {
        // Refresh the time slots
        const today = new Date();
        const endDate = addDays(today, 30);
        
        const response = await fetch(`/api/time-slots?driver_id=${user.id}&start_date=${format(today, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTimeSlots(data.data);
          
          // Convert time slots to calendar events
          const events: CalendarEvent[] = data.data.map((slot: TimeSlot) => {
            const startDate = new Date(`${slot.date}T${slot.start_time}`);
            const endDate = new Date(`${slot.date}T${slot.end_time}`);
            
            return {
              id: slot.id,
              title: slot.is_available ? 'Available' : 'Unavailable',
              start: startDate,
              end: endDate,
              type: slot.is_available ? 'available' : 'unavailable',
              timeSlotId: slot.id
            };
          });
          
          setCalendarEvents(events);
        }
        
        toast({
          title: "Success",
          description: `Generated ${successful.length} time slots for your weekly schedule`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate weekly schedule",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating weekly schedule:", error);
      toast({
        title: "Error",
        description: "Failed to generate weekly schedule",
        variant: "destructive",
      });
    }
  };
  
  // Handle event click on the calendar
  const handleEventClick = (event: CalendarEvent) => {
    // For now, just show details or allow editing
    console.log("Event clicked:", event);
  };
  
  // Handle date click on the calendar
  const handleDateClick = (date: Date) => {
    setSelectedDay(date);
  };
  
  if (!user || user.role !== 'driver') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only drivers can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="calendar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Availability Management</h1>
            <p className="text-muted-foreground">Set your availability for service requests</p>
          </div>
          <TabsList className="mt-4 md:mt-0">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Pattern</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Availability</CardTitle>
                <Button size="sm" onClick={addSingleTimeSlot}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <Calendar 
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                  onDateClick={handleDateClick}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Weekly Availability Pattern</CardTitle>
                <Button onClick={generateWeeklySchedule}>
                  <Save className="mr-2 h-4 w-4" />
                  Generate Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <Button 
                      key={day} 
                      variant={selectedWeekday === day ? "default" : "outline"}
                      onClick={() => setSelectedWeekday(day)}
                      className="capitalize"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium capitalize">{selectedWeekday}</h3>
                    <Button size="sm" variant="outline" onClick={() => addTimeSlotToPattern(selectedWeekday)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Time Slot
                    </Button>
                  </div>
                  
                  {weekdayTimeSlots[selectedWeekday].length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No time slots configured for this day.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weekdayTimeSlots[selectedWeekday].map((slot, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                              <Label>Start Time</Label>
                              <Select
                                value={slot.startTime}
                                onValueChange={(value) => updateTimeSlotInPattern(selectedWeekday, index, 'startTime', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }).map((_, hour) => (
                                    <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                      {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>End Time</Label>
                              <Select
                                value={slot.endTime}
                                onValueChange={(value) => updateTimeSlotInPattern(selectedWeekday, index, 'endTime', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select end time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }).map((_, hour) => (
                                    <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                      {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeSlotFromPattern(selectedWeekday, index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 