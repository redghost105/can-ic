"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { get, put, post } from '@/utils/api';
import { ServiceRequest } from '@/types/models';
import { Search } from '@/components/ui/search';
import { MapPin, Calendar, Clock, Car, Info } from 'lucide-react';

export default function AvailableJobsPage() {
  const router = useRouter();
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAvailableJobs();
  }, []);
  
  // Fetch jobs when search query changes
  useEffect(() => {
    fetchAvailableJobs();
  }, [searchQuery]);
  
  const fetchAvailableJobs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the dedicated API endpoint for available jobs
      const response = await get<ServiceRequest[]>('/available-jobs', { 
        search: searchQuery 
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch available jobs');
      }
      
      setAvailableJobs(response.data || []);
    } catch (err: any) {
      console.error('Error fetching available jobs:', err);
      setError(err.message || 'Failed to load available jobs');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptJob = async (jobId: string) => {
    setAcceptingJobId(jobId);
    
    try {
      // Use the driver-accept API endpoint
      const response = await post('/driver-accept', {
        serviceRequestId: jobId
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to accept job');
      }
      
      // Remove the accepted job from the list of available jobs
      setAvailableJobs(prev => prev.filter(job => job.id !== jobId));
      
      // Navigate to job details
      router.push(`/dashboard/service-requests/${jobId}`);
    } catch (err: any) {
      console.error('Error accepting job:', err);
      setError(err.message || 'Failed to accept job');
    } finally {
      setAcceptingJobId(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Available Jobs</h1>
          <p className="text-gray-600">Browse and accept available transport jobs</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={fetchAvailableJobs}
          variant="outline"
        >
          Refresh Jobs
        </Button>
      </div>
      
      <div className="mb-6">
        <Search 
          onSearch={setSearchQuery} 
          placeholder="Search by location, vehicle, or service type..."
          className="w-full"
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : availableJobs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-8 rounded-lg text-center">
          <p className="text-lg mb-4">
            {searchQuery
              ? "No jobs match your search criteria"
              : "No jobs are currently available"}
          </p>
          <Button onClick={fetchAvailableJobs} variant="outline">
            Refresh Jobs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableJobs.map((job) => (
            <Card key={job.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{job.service_type}</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Pickup Location</p>
                      <p className="text-gray-600">{job.pickup_address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Pickup Date</p>
                      <p className="text-gray-600">{formatDate(job.pickup_date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Pickup Time</p>
                      <p className="text-gray-600">{job.pickup_time_slot}</p>
                    </div>
                  </div>
                  
                  {job.vehicles && (
                    <div className="flex items-start space-x-2">
                      <Car className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Vehicle</p>
                        <p className="text-gray-600">{job.vehicles.make} {job.vehicles.model} ({job.vehicles.year})</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-2">
                    <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Job Details</p>
                      <p className="text-gray-600 line-clamp-2">{job.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleAcceptJob(job.id)}
                    disabled={acceptingJobId === job.id}
                  >
                    {acceptingJobId === job.id ? 'Accepting...' : 'Accept Job'}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/service-requests/${job.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 