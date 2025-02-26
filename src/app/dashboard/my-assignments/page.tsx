"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { get, put } from '@/utils/api';
import { ServiceRequest, ServiceRequestStatus } from '@/types/models';
import { Search } from '@/components/ui/search';
import { MapPin, Calendar, Clock, Car, Truck, ArrowRight } from 'lucide-react';

export default function MyAssignmentsPage() {
  const router = useRouter();
  const [myAssignments, setMyAssignments] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchMyAssignments();
  }, []);

  // Fetch assignments when search query changes
  useEffect(() => {
    fetchMyAssignments();
  }, [searchQuery]);

  const fetchMyAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all service requests assigned to the driver with search parameter
      const response = await get<ServiceRequest[]>('/service-requests', {
        search: searchQuery
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assignments');
      }

      setMyAssignments(response.data || []);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: ServiceRequestStatus) => {
    setUpdatingStatus(jobId);

    try {
      const response = await put('/status-update', {
        serviceRequestId: jobId,
        newStatus
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update status');
      }

      // Update the local state with the new status
      setMyAssignments(prev =>
        prev.map(assignment =>
          assignment.id === jobId
            ? { ...assignment, status: newStatus }
            : assignment
        )
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getNextStatusOptions = (currentStatus: ServiceRequestStatus) => {
    // Define the valid status transitions for drivers
    const transitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
      'driver_assigned_pickup': ['in_transit_to_shop'],
      'in_transit_to_shop': ['at_shop'],
      'completed': ['driver_assigned_return'],
      'driver_assigned_return': ['in_transit_to_owner'],
      'in_transit_to_owner': ['delivered'],
      // All other statuses have no transitions for drivers
      'pending': [],
      'accepted': [],
      'in_progress': [],
      'at_shop': [],
      'pending_payment': [],
      'paid': [],
      'cancelled': [],
      'delivered': []
    };

    return transitions[currentStatus] || [];
  };

  const renderStatusButton = (assignment: ServiceRequest) => {
    const nextStatuses = getNextStatusOptions(assignment.status as ServiceRequestStatus);

    if (nextStatuses.length === 0) {
      return null;
    }

    const nextStatus = nextStatuses[0];
    const statusLabels: Record<ServiceRequestStatus, string> = {
      'in_transit_to_shop': 'Start Pickup',
      'at_shop': 'Arrived at Shop',
      'driver_assigned_return': 'Start Return Trip',
      'in_transit_to_owner': 'Start Delivery',
      'delivered': 'Deliver to Owner',
      // Other statuses (not shown to drivers)
      'pending': '',
      'accepted': '',
      'driver_assigned_pickup': '',
      'in_progress': '',
      'completed': '',
      'pending_payment': '',
      'paid': '',
      'cancelled': ''
    };

    return (
      <Button
        className="w-full mb-2"
        onClick={() => handleUpdateStatus(assignment.id, nextStatus)}
        disabled={updatingStatus === assignment.id}
      >
        {updatingStatus === assignment.id ? 'Updating...' : statusLabels[nextStatus]}
      </Button>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: ServiceRequestStatus) => {
    const statusStyles: Record<ServiceRequestStatus, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      'accepted': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'driver_assigned_pickup': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'in_transit_to_shop': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      'at_shop': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'in_progress': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'completed': 'bg-green-100 text-green-800 hover:bg-green-100',
      'pending_payment': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      'paid': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      'driver_assigned_return': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'in_transit_to_owner': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      'delivered': 'bg-green-100 text-green-800 hover:bg-green-100',
      'cancelled': 'bg-red-100 text-red-800 hover:bg-red-100'
    };

    const statusLabels: Record<ServiceRequestStatus, string> = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'driver_assigned_pickup': 'Pickup Assigned',
      'in_transit_to_shop': 'In Transit to Shop',
      'at_shop': 'At Shop',
      'in_progress': 'In Progress',
      'completed': 'Service Completed',
      'pending_payment': 'Payment Pending',
      'paid': 'Paid',
      'driver_assigned_return': 'Return Assigned',
      'in_transit_to_owner': 'In Transit to Owner',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };

    return (
      <Badge className={statusStyles[status]}>
        {statusLabels[status]}
      </Badge>
    );
  };

  const getAssignmentType = (assignment: ServiceRequest) => {
    const pickupStatuses: ServiceRequestStatus[] = [
      'driver_assigned_pickup',
      'in_transit_to_shop',
      'at_shop'
    ];

    const returnStatuses: ServiceRequestStatus[] = [
      'driver_assigned_return',
      'in_transit_to_owner',
      'delivered'
    ];

    if (pickupStatuses.includes(assignment.status as ServiceRequestStatus)) {
      return 'Pickup Assignment';
    } else if (returnStatuses.includes(assignment.status as ServiceRequestStatus)) {
      return 'Return Assignment';
    } else {
      return 'Assignment';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Assignments</h1>
          <p className="text-gray-600">Manage your active transport assignments</p>
        </div>
        <Button
          className="mt-4 md:mt-0"
          onClick={() => {
            setSearchQuery('');
            fetchMyAssignments();
          }}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      <div className="mb-6">
        <Search
          onSearch={setSearchQuery}
          placeholder="Search assignments..."
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
      ) : myAssignments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-8 rounded-lg text-center">
          <p className="text-lg mb-4">
            {searchQuery
              ? "No assignments match your search criteria"
              : "You don't have any assignments yet"}
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-center">
            <Button 
              onClick={() => {
                setSearchQuery('');
                fetchMyAssignments();
              }} 
              variant="outline"
            >
              Clear Search
            </Button>
            <Button onClick={() => router.push('/dashboard/available-jobs')}>
              Find Available Jobs
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myAssignments.map((assignment) => (
            <Card key={assignment.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{assignment.service_type}</CardTitle>
                  {getStatusBadge(assignment.status as ServiceRequestStatus)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {getAssignmentType(assignment)}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{assignment.pickup_address}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-gray-600">{formatDate(assignment.pickup_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-gray-600">{assignment.pickup_time_slot}</p>
                    </div>
                  </div>

                  {assignment.vehicles && (
                    <div className="flex items-start space-x-2">
                      <Car className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Vehicle</p>
                        <p className="text-gray-600">{assignment.vehicles.make} {assignment.vehicles.model} ({assignment.vehicles.year})</p>
                      </div>
                    </div>
                  )}

                  {assignment.shops && (
                    <div className="flex items-start space-x-2">
                      <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Shop</p>
                        <p className="text-gray-600">{assignment.shops.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full space-y-2">
                  {renderStatusButton(assignment)}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/service-requests/${assignment.id}`)}
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