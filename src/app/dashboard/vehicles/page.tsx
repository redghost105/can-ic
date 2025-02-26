"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { get } from '@/utils/api';
import { Vehicle } from '@/types/models';
import { CarFront, Search, PlusCircle, ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { fetchUserVehicles } from '@/lib/data-fetchers';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

export default async function VehiclesPage() {
  // Verify user is authenticated
  const session = await requireAuth();
  
  // Fetch user's vehicles
  const vehicles = await fetchUserVehicles(session.user.id);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Your Vehicles</h1>
        
        <Link href="/dashboard/vehicles/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>
      
      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No vehicles yet</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Add your first vehicle to request services and track maintenance.
            </p>
            <Link href="/dashboard/vehicles/new">
              <Button>
                Add Your First Vehicle
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="aspect-[16/9] relative bg-gray-100">
                {vehicle.thumbnail_url ? (
                  <Image
                    src={vehicle.thumbnail_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Car className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
                  </div>
                  
                  {vehicle.needs_maintenance && (
                    <div className="flex items-center text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Maintenance Due
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 my-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">VIN</span>
                    <span className="font-mono">{vehicle.vin || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Service</span>
                    <span>{vehicle.last_service_date ? formatDate(vehicle.last_service_date) : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Service</span>
                    <span>{vehicle.next_service_date ? formatDate(vehicle.next_service_date) : 'Not scheduled'}</span>
                  </div>
                </div>
                
                <div className="flex mt-4 gap-2">
                  <Link href={`/dashboard/vehicles/${vehicle.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/service-requests/new?vehicle=${vehicle.id}`} className="flex-1">
                    <Button className="w-full">
                      Request Service
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 