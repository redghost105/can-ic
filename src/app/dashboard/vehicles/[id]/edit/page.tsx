"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoUploader } from '@/components/vehicle/PhotoUploader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema } from '@/lib/validation';
import { fetchVehicleById, updateVehicle } from '@/lib/actions';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FormValues = {
  make: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
  vin?: string;
  mileage?: string;
};

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const vehicle = await fetchVehicleById(params.id);
        
        if (!vehicle) {
          setError('Vehicle not found');
          return;
        }
        
        reset({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year.toString(),
          color: vehicle.color || '',
          license_plate: vehicle.license_plate,
          vin: vehicle.vin || '',
          mileage: vehicle.mileage ? vehicle.mileage.toString() : '',
        });
        
        setPhotoUrl(vehicle.thumbnail_url || null);
      } catch (err) {
        setError('Failed to load vehicle details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVehicle();
  }, [params.id, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert year and mileage to numbers
      const formattedData = {
        ...data,
        id: params.id,
        year: parseInt(data.year),
        mileage: data.mileage ? parseInt(data.mileage) : undefined,
        thumbnail_url: photoUrl,
      };
      
      // Submit the data to the server
      const result = await updateVehicle(formattedData);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to the vehicle details page
        router.push(`/dashboard/vehicles/${params.id}`);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPhotoUploaded = (url: string) => {
    setPhotoUrl(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/dashboard/vehicles/${params.id}`} className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Vehicle</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="make">Make <span className="text-red-500">*</span></Label>
                  <Input
                    id="make"
                    placeholder="e.g. Toyota"
                    {...register('make')}
                    error={!!errors.make}
                  />
                  {errors.make && (
                    <p className="text-sm text-red-500 mt-1">{errors.make.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="model">Model <span className="text-red-500">*</span></Label>
                  <Input
                    id="model"
                    placeholder="e.g. Camry"
                    {...register('model')}
                    error={!!errors.model}
                  />
                  {errors.model && (
                    <p className="text-sm text-red-500 mt-1">{errors.model.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="year">Year <span className="text-red-500">*</span></Label>
                  <Input
                    id="year"
                    placeholder="e.g. 2020"
                    {...register('year')}
                    error={!!errors.year}
                  />
                  {errors.year && (
                    <p className="text-sm text-red-500 mt-1">{errors.year.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="color">Color <span className="text-red-500">*</span></Label>
                  <Input
                    id="color"
                    placeholder="e.g. Silver"
                    {...register('color')}
                    error={!!errors.color}
                  />
                  {errors.color && (
                    <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="license_plate">License Plate <span className="text-red-500">*</span></Label>
                  <Input
                    id="license_plate"
                    placeholder="e.g. ABC123"
                    {...register('license_plate')}
                    error={!!errors.license_plate}
                  />
                  {errors.license_plate && (
                    <p className="text-sm text-red-500 mt-1">{errors.license_plate.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
                  <Input
                    id="vin"
                    placeholder="e.g. 1HGCM82633A123456"
                    {...register('vin')}
                    error={!!errors.vin}
                  />
                  {errors.vin && (
                    <p className="text-sm text-red-500 mt-1">{errors.vin.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    placeholder="e.g. 50000"
                    {...register('mileage')}
                    error={!!errors.mileage}
                  />
                  {errors.mileage && (
                    <p className="text-sm text-red-500 mt-1">{errors.mileage.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Label>Vehicle Photo</Label>
              <PhotoUploader onPhotoUploaded={onPhotoUploaded} initialImageUrl={photoUrl || undefined} />
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href={`/dashboard/vehicles/${params.id}`}>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 