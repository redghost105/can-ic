import { NextRequest, NextResponse } from 'next/server';

// Generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Local Vehicle interface for this endpoint
export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number | string;
  vin?: string;
  license_plate?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Mock database - now exported for use in the [id] route
export let vehicles: Vehicle[] = [
  {
    id: '1',
    customer_id: 'user123',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    vin: 'ABC123456789012345',
    license_plate: 'ABC-1234',
    color: 'Blue',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    customer_id: 'user123',
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    vin: 'DEF123456789012345',
    license_plate: 'XYZ-9876',
    color: 'Red',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    customer_id: 'user123',
    make: 'Ford',
    model: 'F-150',
    year: 2021,
    vin: 'GHI123456789012345',
    license_plate: 'LMN-5678',
    color: 'Black',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * GET /api/vehicles
 * Returns a list of vehicles for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // In a real app, we would authenticate the user and filter by user_id
    // For demo purposes, we'll just return all mock vehicles
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    
    let filteredVehicles = vehicles;
    
    // Filter vehicles if search parameter is present
    if (search) {
      filteredVehicles = vehicles.filter(vehicle => {
        const searchText = `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.license_plate || ''}`.toLowerCase();
        return searchText.includes(search);
      });
    }
    
    return NextResponse.json({
      success: true,
      data: filteredVehicles
    });
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vehicles',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vehicles
 * Creates a new vehicle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.make || !body.model || !body.year) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: 'Make, model, and year are required'
        },
        { status: 400 }
      );
    }
    
    // In a real app, we would authenticate the user and use their user_id
    const newVehicle: Vehicle = {
      id: generateId(),
      customer_id: 'user123', // In a real app, this would be the authenticated user's ID
      make: body.make,
      model: body.model,
      year: parseInt(body.year) || body.year,
      vin: body.vin || undefined,
      license_plate: body.license_plate || undefined,
      color: body.color || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Add to mock database
    vehicles.push(newVehicle);
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      data: newVehicle
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create vehicle',
        details: error.message
      },
      { status: 500 }
    );
  }
} 