import { requireRole } from '@/lib/auth';
import { fetchShopDashboardData } from '@/lib/data-fetchers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ShopDashboard() {
  // Ensure user is a shop
  const session = await requireRole('shop');
  
  // Fetch shop dashboard data
  const data = await fetchShopDashboardData(session.user.id);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shop Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.inProgressRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.stats.todayRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Service Queue */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Service Queue</h2>
          <Link href="/dashboard/shop/queue">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {data.queue.length > 0 ? (
            data.queue.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-4 md:p-6 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{service.vehicleName}</h3>
                        <p className="text-sm text-gray-500">{service.serviceType}</p>
                      </div>
                      <Badge className={
                        service.status === 'awaiting_arrival' ? 'bg-yellow-100 text-yellow-800' :
                        service.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {service.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">Customer: {service.customerName}</p>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/service-requests/${service.id}`}>
                        <Button size="sm" variant="outline">Details</Button>
                      </Link>
                      <Link href={`/dashboard/service-requests/${service.id}/update`}>
                        <Button size="sm">Update Status</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500">No services in queue</p>
              <p className="text-sm text-gray-400 mt-1">Service requests will appear here</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Today's Schedule */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
        {/* Calendar component with today's appointments */}
        <div className="bg-white rounded-lg border p-4 max-h-96 overflow-y-auto">
          {data.todayAppointments.length > 0 ? (
            data.todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{appointment.time} - {appointment.vehicleName}</p>
                  <p className="text-sm text-gray-500">{appointment.serviceType}</p>
                </div>
                <Badge className={
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                  appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }>
                  {appointment.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 