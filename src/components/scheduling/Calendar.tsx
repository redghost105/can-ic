import React, { useState, useEffect } from 'react';
import { addDays, format, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/types/scheduling';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  viewMode?: 'week' | 'day';
  initialDate?: Date;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function Calendar({
  events = [],
  onEventClick,
  onDateClick,
  viewMode = 'week',
  initialDate = new Date(),
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState<'week' | 'day'>(viewMode);
  
  // Navigate to today
  const goToToday = () => setCurrentDate(new Date());
  
  // Navigate between weeks/days
  const goToPrevious = () => {
    if (currentView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  const goToNext = () => {
    if (currentView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };
  
  // Change view mode
  const toggleView = () => {
    setCurrentView(currentView === 'week' ? 'day' : 'week');
  };
  
  // Generate days for the current view
  const getDaysForView = () => {
    if (currentView === 'day') {
      return [currentDate];
    }
    
    // For week view, start from Sunday of the current week
    const startDate = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };
  
  // Get events for a specific day and hour
  const getEventsForTimeSlot = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDay = new Date(event.start);
      return isSameDay(eventDay, day) && eventDay.getHours() === hour;
    });
  };
  
  // Render header with day names
  const renderHeader = () => {
    const days = getDaysForView();
    
    return (
      <div className="flex">
        <div className="w-20 flex-shrink-0"></div>
        {days.map((day, index) => (
          <div 
            key={index} 
            className="flex-1 text-center font-medium py-2 border-b"
            onClick={() => onDateClick && onDateClick(day)}
          >
            <div>{format(day, 'EEE')}</div>
            <div className={isSameDay(day, new Date()) ? "rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center mx-auto" : ""}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render time grid
  const renderTimeGrid = () => {
    const days = getDaysForView();
    
    return (
      <div className="flex flex-col">
        {HOURS.map(hour => (
          <div key={hour} className="flex border-b min-h-[100px]">
            <div className="w-20 flex-shrink-0 text-right pr-2 pt-2 text-sm text-muted-foreground">
              {hour % 12 === 0 ? "12" : hour % 12}:00 {hour < 12 ? "AM" : "PM"}
            </div>
            
            {days.map((day, dayIndex) => {
              const dayEvents = getEventsForTimeSlot(day, hour);
              
              return (
                <div 
                  key={dayIndex} 
                  className="flex-1 border-l relative p-1"
                  onClick={() => {
                    if (onDateClick) {
                      const clickedDate = new Date(day);
                      clickedDate.setHours(hour);
                      onDateClick(clickedDate);
                    }
                  }}
                >
                  {dayEvents.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {dayEvents.map((event, eventIndex) => (
                        <TooltipProvider key={eventIndex}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`
                                  p-1 rounded text-xs cursor-pointer
                                  ${event.type === 'pickup' ? 'bg-blue-100 border-blue-300 border' : ''}
                                  ${event.type === 'delivery' ? 'bg-green-100 border-green-300 border' : ''}
                                  ${event.type === 'service' ? 'bg-amber-100 border-amber-300 border' : ''}
                                  ${event.type === 'available' ? 'bg-emerald-100 border-emerald-300 border' : ''}
                                  ${event.type === 'unavailable' ? 'bg-gray-100 border-gray-300 border' : ''}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEventClick && onEventClick(event);
                                }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="truncate">
                                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="max-w-xs">
                                <div className="font-bold">{event.title}</div>
                                <div>{format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</div>
                                {event.customerName && <div>Customer: {event.customerName}</div>}
                                {event.vehicleInfo && <div>Vehicle: {event.vehicleInfo}</div>}
                                {event.address && <div>Address: {event.address}</div>}
                                {event.status && (
                                  <div className="mt-1">
                                    Status: <Badge variant="outline">{event.status}</Badge>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Schedule</CardTitle>
            <Badge variant="outline">
              {currentView === 'week' ? 'Week View' : 'Day View'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleView}>
              {currentView === 'week' ? 'Day' : 'Week'}
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentView === 'week' 
            ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
            : format(currentDate, 'MMMM d, yyyy')
          }
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {renderHeader()}
            {renderTimeGrid()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 