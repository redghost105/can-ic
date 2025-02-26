import { requireRole } from '@/lib/auth';
import { fetchDriverDashboardData } from '@/lib/data-fetchers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function DriverDashboard() {
  // Ensure user is a driver
  const session = await requireRole('driver');
  
  // Fetch driver dashboard data
  const data = await fetchDriverDashboardData(session.user.id);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Driver Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.todayTrips}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.availableJobs}</div>
            {data.stats.availableJobs > 0 && (
              <Link href="/dashboard/available-jobs">
                <Button variant="link" className="px-0 h-auto font-normal text-sm">View jobs</Button>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.stats.todayEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Current Assignment */}
      {data.currentAssignment ? (
        <section>
          <h2 className="text-xl font-semibold mb-4">Current Assignment</h2>
          <Card className="border-2 border-blue-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{data.currentAssignment.vehicleName}</h3>
                  <p className="text-sm text-gray-500">{data.currentAssignment.serviceId}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {data.currentAssignment.status}
                </Badge>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-sm text-gray-600">{data.currentAssignment.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Dropoff Location</p>
                    <p className="text-sm text-gray-600">{data.currentAssignment.dropoffAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Scheduled Time</p>
                    <p className="text-sm text-gray-600">{data.currentAssignment.scheduledTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Fare</p>
                    <p className="text-sm text-gray-600">${data.currentAssignment.fare.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link href={`/dashboard/driver/active-service/${data.currentAssignment.id}`}>
                  <Button className="w-full">View Details</Button>
                </Link>
                <Link href={`/dashboard/driver/active-service/${data.currentAssignment.id}/navigate`}>
                  <Button variant="outline" className="w-full">Navigate</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section>
          <h2 className="text-xl font-semibold mb-4">Current Assignment</h2>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No active assignment</p>
              <Link href="/dashboard/available-jobs">
                <Button className="mt-4">Find Available Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
      
      {/* Upcoming Assignments */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Assignments</h2>
          <Link href="/dashboard/my-assignments">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {data.upcomingAssignments.length > 0 ? (
            data.upcomingAssignments.map((assignment) => (
              <Card key={assignment.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{assignment.vehicleName}</h3>
                      <p className="text-sm text-gray-500">{assignment.scheduledTime}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Scheduled
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">
                    <span className="text-gray-500">Pickup: </span>
                    {assignment.pickupAddress}
                  </p>
                  <p className="text-sm mb-4">
                    <span className="text-gray-500">Dropoff: </span>
                    {assignment.dropoffAddress}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/my-assignments/${assignment.id}`}>
                      <Button size="sm" variant="outline">Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500">No upcoming assignments</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 