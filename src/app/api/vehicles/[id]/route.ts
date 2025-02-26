import { NextRequest, NextResponse } from 'next/server';
import { vehicles, Vehicle } from '../route';

/**
 * GET /api/vehicles/[id]
 * Returns a specific vehicle by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the vehicle in our mock database
    const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
    
    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vehicle not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: vehicle
    });
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vehicle',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vehicles/[id]
 * Updates a specific vehicle
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;
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
    
    // Find the vehicle in our mock database
    const vehicleIndex = vehicles.findIndex((v: Vehicle) => v.id === vehicleId);
    
    if (vehicleIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vehicle not found',
        },
        { status: 404 }
      );
    }
    
    // Update the vehicle
    const updatedVehicle = {
      ...vehicles[vehicleIndex],
      make: body.make,
      model: body.model,
      year: parseInt(body.year) || body.year,
      vin: body.vin || undefined,
      license_plate: body.license_plate || undefined,
      color: body.color || undefined,
      updated_at: new Date().toISOString(),
    };
    
    // Replace in mock database
    vehicles[vehicleIndex] = updatedVehicle;
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      data: updatedVehicle
    });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update vehicle',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vehicles/[id]
 * Deletes a specific vehicle
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;
    
    // Find the vehicle in our mock database
    const vehicleIndex = vehicles.findIndex((v: Vehicle) => v.id === vehicleId);
    
    if (vehicleIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vehicle not found',
        },
        { status: 404 }
      );
    }
    
    // Remove from mock database
    vehicles.splice(vehicleIndex, 1);
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete vehicle',
        details: error.message
      },
      { status: 500 }
    );
  }
} 