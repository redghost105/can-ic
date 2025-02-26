"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { get } from '@/utils/api';
import { Vehicle } from '@/types/models';
import { ArrowLeft, Edit, Trash2, CarFront } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { requireAuth } from '@/lib/auth';
import { fetchVehicleById, fetchVehicleServiceHistory } from '@/lib/data-fetchers';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import VehicleServiceHistory from '@/components/dashboard/VehicleServiceHistory';

export default async function VehicleDetailsPage({ params }: { params: { id: string } }) {
  // Verify user is authenticated
  const session = await requireAuth();
  
  // Fetch vehicle details
  const vehicle = await fetchVehicleById(params.id);
  
  // Redirect if vehicle not found or doesn't belong to user
  if (!vehicle || vehicle.owner_id !== session.user.id) {
    redirect('/dashboard/vehicles');
  }
  
  // Fetch vehicle service history
  const serviceHistory = await fetchVehicleServiceHistory(params.id);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-gray-500">License Plate: {vehicle.license_plate}</p>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/service-requests/new?vehicle=${vehicle.id}`}>
            <Button size="sm">
              <Wrench className="h-4 w-4 mr-2" />
              Request Service
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video relative">
                {vehicle.thumbnail_url ? (
                  <Image
                    src={vehicle.thumbnail_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded-t-lg">
                    <Car className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-lg mb-2">Vehicle Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Make</dt>
                      <dd>{vehicle.make}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Model</dt>
                      <dd>{vehicle.model}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Year</dt>
                      <dd>{vehicle.year}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Color</dt>
                      <dd>{vehicle.color || 'Not specified'}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">VIN</dt>
                      <dd className="font-mono">{vehicle.vin || 'Not specified'}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Mileage</dt>
                      <dd>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not recorded'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-lg mb-2">Service Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Last Service</dt>
                      <dd>{vehicle.last_service_date ? formatDate(vehicle.last_service_date) : 'None'}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Next Service</dt>
                      <dd>{vehicle.next_service_date ? formatDate(vehicle.next_service_date) : 'Not scheduled'}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Maintenance</dt>
                      <dd className={vehicle.needs_maintenance ? 'text-amber-600' : 'text-green-600'}>
                        {vehicle.needs_maintenance ? 'Due Soon' : 'Up to Date'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                This action cannot be undone. This will permanently delete your vehicle and all associated data.
              </p>
              <form action="/api/vehicles/delete" method="POST">
                <input type="hidden" name="id" value={vehicle.id} />
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vehicle
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Service History Column */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Service History</CardTitle>
            </CardHeader>
            <CardContent>
              <VehicleServiceHistory serviceHistory={serviceHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 