import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  date: string;
  time: string;
  shop_name: string;
  address: string;
  vehicle_name: string;
  service_type: string;
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  if (!appointments || appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have any upcoming appointments.</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/schedule/availability">Schedule Appointment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{appointment.vehicle_name}</h3>
                <p className="text-sm text-gray-600">{appointment.service_type}</p>
              </div>
              <Link href={`/dashboard/appointments/${appointment.id}`}>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </Link>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {appointment.shop_name} - {appointment.address}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t p-4">
        <Link
          href="/dashboard/appointments"
          className="text-sm text-blue-600 hover:text-blue-800 mx-auto"
        >
          View all appointments
        </Link>
      </CardFooter>
    </Card>
  );
} 