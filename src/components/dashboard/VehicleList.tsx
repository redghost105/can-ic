import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, Plus, Wrench } from "lucide-react";
import Image from "next/image";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  thumbnail?: string;
  last_service_date?: string;
}

interface VehicleListProps {
  vehicles: Vehicle[];
}

export function VehicleList({ vehicles }: VehicleListProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't added any vehicles yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/vehicles/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Vehicles</CardTitle>
        <Button size="sm" asChild>
          <Link href="/dashboard/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video relative bg-gray-100">
                {vehicle.thumbnail ? (
                  <Image
                    src={vehicle.thumbnail}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Car className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-500">
                  License: {vehicle.license_plate}
                </p>
                {vehicle.last_service_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last serviced: {vehicle.last_service_date}
                  </p>
                )}
              </div>
              <div className="flex border-t bg-gray-50">
                <Link
                  href={`/dashboard/vehicles/${vehicle.id}`}
                  className="flex-1 py-2 text-center text-sm text-gray-600 hover:bg-gray-100"
                >
                  Details
                </Link>
                <Link
                  href={`/dashboard/service-requests/new?vehicle=${vehicle.id}`}
                  className="flex-1 py-2 text-center text-sm text-blue-600 hover:bg-blue-50 border-l flex items-center justify-center"
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 justify-center">
        <Link
          href="/dashboard/vehicles"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Manage all vehicles
        </Link>
      </CardFooter>
    </Card>
  );
} 