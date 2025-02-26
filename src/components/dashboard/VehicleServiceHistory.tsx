import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  status: string;
  shop_name: string;
  cost: number;
  description: string;
  mileage?: number;
}

interface VehicleServiceHistoryProps {
  serviceHistory: ServiceRecord[];
}

export default function VehicleServiceHistory({ serviceHistory }: VehicleServiceHistoryProps) {
  if (serviceHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No service history available</p>
        <Link href="/dashboard/service-requests/new">
          <Button>Schedule Service</Button>
        </Link>
      </div>
    );
  }

  // Helper to get the appropriate status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="space-y-6">
      {serviceHistory.map((record) => (
        <div 
          key={record.id}
          className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <div>
              <p className="font-medium">{formatDate(record.service_date)}</p>
              <p className="text-sm text-gray-500">{record.shop_name}</p>
            </div>
            <Badge className={getStatusColor(record.status)}>
              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
            </Badge>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p>{record.service_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost</p>
                <p>{formatCurrency(record.cost)}</p>
              </div>
              {record.mileage && (
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                  <p>{record.mileage.toLocaleString()} miles</p>
                </div>
              )}
            </div>
            
            {record.description && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm mt-1">{record.description}</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <Link href={`/dashboard/service-requests/${record.id}`}>
              <Button variant="ghost" size="sm" className="flex items-center">
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
} 