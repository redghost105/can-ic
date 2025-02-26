"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Navigation, RefreshCw } from 'lucide-react';

// Declare global Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        Marker: any;
        LatLngBounds: any;
        DirectionsService: any;
        DirectionsRenderer: any;
        DirectionsResult: any;
        DirectionsStatus: string;
        SymbolPath: {
          CIRCLE: any;
        };
        TravelMode: {
          DRIVING: any;
        };
      };
    };
  }
}

interface DriverLocationMapProps {
  serviceRequestId: string;
  destination?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
  driverName?: string;
  driverPhone?: string;
  refreshInterval?: number; // in milliseconds
}

interface DriverLocation {
  user_id: string;
  current_location: {
    latitude: number;
    longitude: number;
    last_updated: string;
  };
  updated_at: string;
}

export function DriverLocationMap({
  serviceRequestId,
  destination,
  estimatedArrival,
  driverName = 'Your Driver',
  driverPhone,
  refreshInterval = 15000 // default to 15 seconds
}: DriverLocationMapProps) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load the Google Maps API script
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        fetchDriverLocation();
      };
      
      return () => {
        document.head.removeChild(script);
      };
    } else {
      fetchDriverLocation();
    }
    
    // Set up the refresh interval
    refreshTimerRef.current = setInterval(fetchDriverLocation, refreshInterval);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [serviceRequestId, refreshInterval]);

  useEffect(() => {
    if (driverLocation && window.google && mapContainerRef.current) {
      initializeMap();
    }
  }, [driverLocation]);

  const fetchDriverLocation = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/location?service_request_id=${serviceRequestId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch driver location');
      }
      
      setDriverLocation(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching driver location:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching driver location');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!driverLocation || !driverLocation.current_location || !window.google) {
      return;
    }
    
    const { latitude, longitude } = driverLocation.current_location;
    const driverLatLng = { lat: latitude, lng: longitude };
    
    if (!mapRef.current) {
      // Initialize the map
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: driverLatLng,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
    }
    
    // Update or create the driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(driverLatLng);
    } else {
      driverMarkerRef.current = new window.google.maps.Marker({
        position: driverLatLng,
        map: mapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `${driverName} - Current Location`
      });
    }
    
    // Add or update destination marker if provided
    if (destination) {
      const destinationLatLng = { lat: destination.latitude, lng: destination.longitude };
      
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setPosition(destinationLatLng);
      } else {
        destinationMarkerRef.current = new window.google.maps.Marker({
          position: destinationLatLng,
          map: mapRef.current,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
          title: 'Destination'
        });
      }
      
      // Create a bounds object to include both markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(driverLatLng);
      bounds.extend(destinationLatLng);
      
      // Fit the map to include both markers
      mapRef.current.fitBounds(bounds);
      
      // Draw a route between the driver and destination
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true, // We already have markers
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5
        }
      });
      
      directionsService.route({
        origin: driverLatLng,
        destination: destinationLatLng,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (response: any, status: string) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        }
      });
    } else {
      // If no destination, just center on the driver
      mapRef.current.setCenter(driverLatLng);
    }
  };

  const formatTimeSince = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      const diffMinutes = Math.floor(diffSeconds / 60);
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffSeconds / 3600);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
  };

  const handleRefresh = () => {
    fetchDriverLocation();
  };

  const handleCall = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Driver Location</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-medium">{driverName}</span>
              </div>
              
              <div className="flex space-x-2">
                {driverPhone && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCall}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                )}
                
                {destination && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      if (destination) {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`, '_blank');
                      }
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                )}
              </div>
            </div>
            
            {estimatedArrival && (
              <div className="bg-blue-50 p-3 rounded-md mb-4">
                <p className="text-blue-700">
                  <span className="font-medium">Estimated arrival:</span> {estimatedArrival}
                </p>
              </div>
            )}
            
            <div
              ref={mapContainerRef}
              className="w-full h-64 rounded-md overflow-hidden bg-slate-100"
            ></div>
            
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-2 text-right">
                Last updated: {formatTimeSince(lastUpdated)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 