import { ServiceRequestSummary } from '@/components/dashboard/ServiceRequestSummary';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { VehicleList } from '@/components/dashboard/VehicleList';
import { requireRole } from '@/lib/auth';
import { fetchCustomerDashboardData } from '@/lib/data-fetchers';

export default async function CustomerDashboard() {
  // Ensure user is a customer
  const session = await requireRole('customer');
  
  // Fetch dashboard data
  const data = await fetchCustomerDashboardData(session.user.id);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Service Request Summary Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Service Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ServiceRequestSummary data={data.serviceRequests} />
        </div>
      </section>
      
      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        <UpcomingAppointments appointments={data.upcomingAppointments} />
      </section>
      
      {/* Vehicles */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Vehicles</h2>
        <VehicleList vehicles={data.vehicles} />
      </section>
    </div>
  );
} 