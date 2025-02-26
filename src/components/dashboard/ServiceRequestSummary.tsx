import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

// Define the ServiceRequest interface
interface ServiceRequest {
  id: string;
  status: string;
  vehicle_name: string;
  service_type: string;
  created_at: string;
  shop_name?: string;
  price?: number;
  estimated_completion?: string;
}

interface ServiceRequestSummaryProps {
  data: {
    active: ServiceRequest[];
    completed: ServiceRequest[];
    pending: ServiceRequest[];
  };
}

export function ServiceRequestSummary({ data }: ServiceRequestSummaryProps) {
  // Helper function to get the appropriate status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // If no service requests exist
  if (!data.active.length && !data.pending.length && !data.completed.length) {
    return (
      <Card className="col-span-3 p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-700">No Service Requests</h3>
          <p className="text-gray-500 mt-2">You don't have any service requests yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/service-requests/new">Request Service</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // Main component content with service requests
  return (
    <>
      {data.active.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Active</h3>
              <Badge className="bg-blue-500">{data.active.length}</Badge>
            </div>
            <div className="space-y-3">
              {data.active.slice(0, 2).map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{request.vehicle_name}</span>
                    <Badge className={getStatusColor(request.status)}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.service_type}
                  </p>
                  {request.shop_name && (
                    <p className="text-sm mt-2">Shop: {request.shop_name}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50 p-3">
            <Link
              href="/dashboard/service-requests?filter=active"
              className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
            >
              View all active requests
            </Link>
          </CardFooter>
        </Card>
      )}

      {data.pending.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Pending</h3>
              <Badge className="bg-yellow-500">{data.pending.length}</Badge>
            </div>
            <div className="space-y-3">
              {data.pending.slice(0, 2).map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{request.vehicle_name}</span>
                    <Badge className={getStatusColor(request.status)}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.service_type}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50 p-3">
            <Link
              href="/dashboard/service-requests?filter=pending"
              className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
            >
              View all pending requests
            </Link>
          </CardFooter>
        </Card>
      )}

      {data.completed.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Recent</h3>
              <Badge className="bg-green-500">{data.completed.length}</Badge>
            </div>
            <div className="space-y-3">
              {data.completed.slice(0, 2).map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{request.vehicle_name}</span>
                    <Badge className={getStatusColor(request.status)}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.service_type}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Completed: {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50 p-3">
            <Link
              href="/dashboard/service-requests?filter=completed"
              className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
            >
              View service history
            </Link>
          </CardFooter>
        </Card>
      )}
    </>
  );
} 