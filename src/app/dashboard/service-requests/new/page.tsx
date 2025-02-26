"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { fetchUserVehicles } from '@/lib/data-fetchers';
import { createServiceRequest } from '@/lib/actions';
import { AlertCircle, ArrowLeft, Calendar, Car, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Define form schema
const serviceRequestSchema = z.object({
  vehicle_id: z.string().min(1, 'Please select a vehicle'),
  service_type: z.string().min(1, 'Please select a service type'),
  description: z.string().min(10, 'Please provide a detailed description of the issue'),
  urgency: z.enum(['low', 'medium', 'high']),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  pickup_required: z.boolean().default(false),
  pickup_address: z.string().optional(),
});

type FormValues = z.infer<typeof serviceRequestSchema>;

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  thumbnail_url?: string;
}

const SERVICE_TYPES = [
  { id: 'oil_change', name: 'Oil Change' },
  { id: 'brake_service', name: 'Brake Service' },
  { id: 'tire_service', name: 'Tire Service' },
  { id: 'engine_repair', name: 'Engine Repair' },
  { id: 'transmission', name: 'Transmission Service' },
  { id: 'battery', name: 'Battery Replacement' },
  { id: 'ac_service', name: 'A/C Service' },
  { id: 'diagnostics', name: 'Diagnostics/Check Engine Light' },
  { id: 'maintenance', name: 'Regular Maintenance' },
  { id: 'other', name: 'Other (please specify)' },
];

export default function NewServiceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle');
  
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      vehicle_id: preselectedVehicleId || '',
      service_type: '',
      description: '',
      urgency: 'medium',
      preferred_date: '',
      preferred_time: '',
      pickup_required: false,
      pickup_address: '',
    },
  });
  
  // Watch the pickup_required field to conditionally render pickup address
  const pickupRequired = watch('pickup_required');
  const selectedVehicleId = watch('vehicle_id');
  
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        // Fetch user's vehicles
        const fetchedVehicles = await fetchUserVehicles();
        setVehicles(fetchedVehicles);
        
        // Set the first vehicle as default if none preselected
        if (!preselectedVehicleId && fetchedVehicles.length > 0) {
          setValue('vehicle_id', fetchedVehicles[0].id);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
        setError('Failed to load your vehicles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVehicles();
  }, [preselectedVehicleId, setValue]);
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createServiceRequest(data);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to service request details page
        router.push(`/dashboard/service-requests/${result.id}`);
        router.refresh();
      }
    } catch (err) {
      setError('Failed to create service request. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // If no vehicles, prompt to add a vehicle first
  if (vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Request Service</h1>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              You need to add a vehicle before you can request service.
            </p>
            <Link href="/dashboard/vehicles/new">
              <Button>
                Add Your First Vehicle
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/service-requests" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Request Service</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Vehicle Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicle_id">Select Vehicle <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={(value) => setValue('vehicle_id', value)}
                >
                  <SelectTrigger
                    id="vehicle_id" 
                    className={cn(errors.vehicle_id && "border-red-500")}
                  >
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicle_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.vehicle_id.message}</p>
                )}
                
                <div className="mt-2 text-sm">
                  <Link href="/dashboard/vehicles/new" className="text-primary">
                    + Add a new vehicle
                  </Link>
                </div>
              </div>
              
              {/* Display selected vehicle info */}
              {selectedVehicle && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        License: {selectedVehicle.license_plate}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Service Type */}
            <div>
              <Label htmlFor="service_type">Service Type <span className="text-red-500">*</span></Label>
              <Select
                value={watch('service_type')}
                onValueChange={(value) => setValue('service_type', value)}
              >
                <SelectTrigger
                  id="service_type"
                  className={cn(errors.service_type && "border-red-500")}
                >
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_type && (
                <p className="text-sm text-red-500 mt-1">{errors.service_type.message}</p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue with your vehicle in detail"
                className={cn(errors.description && "border-red-500")}
                rows={4}
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Provide details about the problem, when it started, any sounds, error messages, etc.
                </p>
              )}
            </div>
            
            {/* Urgency */}
            <div>
              <Label>Urgency Level</Label>
              <RadioGroup
                defaultValue={watch('urgency')}
                onValueChange={(value) => setValue('urgency', value as 'low' | 'medium' | 'high')}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="urgency-low" />
                  <Label htmlFor="urgency-low" className="cursor-pointer">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="urgency-medium" />
                  <Label htmlFor="urgency-medium" className="cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="urgency-high" />
                  <Label htmlFor="urgency-high" className="cursor-pointer">High</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Preferred Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_date">Preferred Date (Optional)</Label>
                <div className="relative">
                  <Input
                    id="preferred_date"
                    type="date"
                    {...register('preferred_date')}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-4 w-4" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="preferred_time">Preferred Time (Optional)</Label>
                <div className="relative">
                  <Input
                    id="preferred_time"
                    type="time"
                    {...register('preferred_time')}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Pickup Required */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pickup_required"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={pickupRequired}
                  onChange={(e) => setValue('pickup_required', e.target.checked)}
                />
                <Label htmlFor="pickup_required" className="cursor-pointer">I need my vehicle picked up</Label>
              </div>
              
              {pickupRequired && (
                <div>
                  <Label htmlFor="pickup_address">Pickup Address <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="pickup_address"
                    placeholder="Enter the full address for pickup"
                    className={cn(errors.pickup_address && "border-red-500")}
                    {...register('pickup_address')}
                  />
                  {errors.pickup_address && (
                    <p className="text-sm text-red-500 mt-1">{errors.pickup_address.message}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/dashboard/service-requests">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 