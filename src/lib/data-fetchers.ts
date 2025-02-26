// This is a mock implementation - in a real app, this would be fetching from your API/database

import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchCustomerDashboardData(userId: string) {
  try {
    // In a real implementation, these would be actual database queries
    
    // Fetch service requests
    const { data: serviceRequests, error: serviceRequestsError } = await supabase
      .from('service_requests')
      .select('*, vehicles(*)')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });
    
    if (serviceRequestsError) throw serviceRequestsError;
    
    // Fetch upcoming appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*, shops(*), vehicles(*)')
      .eq('customer_id', userId)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(5);
      
    if (appointmentsError) throw appointmentsError;
    
    // Fetch vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', userId);
      
    if (vehiclesError) throw vehiclesError;
    
    // Process service requests into categories
    const active = serviceRequests.filter(req => 
      ['approved', 'in_progress', 'scheduled', 'in_transit', 'at_shop'].includes(req.status)
    ).map(req => ({
      id: req.id,
      status: req.status,
      vehicle_name: `${req.vehicles.year} ${req.vehicles.make} ${req.vehicles.model}`,
      service_type: req.service_type,
      created_at: req.created_at,
      shop_name: req.shop_name || undefined,
      price: req.price || undefined,
    }));
    
    const pending = serviceRequests.filter(req => 
      ['pending_approval', 'awaiting_quote'].includes(req.status)
    ).map(req => ({
      id: req.id,
      status: req.status,
      vehicle_name: `${req.vehicles.year} ${req.vehicles.make} ${req.vehicles.model}`,
      service_type: req.service_type,
      created_at: req.created_at,
    }));
    
    const completed = serviceRequests.filter(req => 
      ['completed', 'cancelled', 'declined'].includes(req.status)
    ).map(req => ({
      id: req.id,
      status: req.status,
      vehicle_name: `${req.vehicles.year} ${req.vehicles.make} ${req.vehicles.model}`,
      service_type: req.service_type,
      created_at: req.created_at,
      shop_name: req.shop_name || undefined,
    }));
    
    // Process appointments data
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      time: apt.time_slot,
      shop_name: apt.shops.name,
      address: `${apt.shops.address}, ${apt.shops.city}`,
      vehicle_name: `${apt.vehicles.year} ${apt.vehicles.make} ${apt.vehicles.model}`,
      service_type: apt.service_type || 'General Service',
    }));
    
    // Process vehicle data
    const formattedVehicles = vehicles.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      license_plate: v.license_plate,
      thumbnail: v.thumbnail_url,
      last_service_date: v.last_service_date,
    }));
    
    return {
      serviceRequests: {
        active,
        pending,
        completed
      },
      upcomingAppointments: formattedAppointments,
      vehicles: formattedVehicles
    };
    
  } catch (error) {
    console.error('Error fetching customer dashboard data:', error);
    // Return empty data as fallback
    return {
      serviceRequests: { active: [], pending: [], completed: [] },
      upcomingAppointments: [],
      vehicles: []
    };
  }
}

// Add additional data fetcher functions for other dashboard types
export async function fetchShopDashboardData(shopId: string) {
  // Implementation for shop dashboard data
}

export async function fetchDriverDashboardData(driverId: string) {
  // Implementation for driver dashboard data  
}

export async function fetchAdminDashboardData() {
  // Implementation for admin dashboard data
} 