import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Shop interface
interface Shop {
  id?: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  email?: string;
  website?: string;
  description?: string;
  services?: string[];
  hours_of_operation?: Record<string, string>;
  rating?: number;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET - Retrieve shops (all or specific one)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const shopId = url.searchParams.get('id');
    const city = url.searchParams.get('city');
    const state = url.searchParams.get('state');
    const service = url.searchParams.get('service');
    const verified = url.searchParams.get('verified') === 'true';
    
    let query = supabaseAdmin.from('shops').select('*');
    
    // Apply filters based on query parameters
    if (shopId) {
      query = query.eq('id', shopId);
    }
    
    if (city) {
      query = query.eq('city', city);
    }
    
    if (state) {
      query = query.eq('state', state);
    }
    
    if (service) {
      query = query.contains('services', [service]);
    }
    
    if (verified) {
      query = query.eq('is_verified', true);
    }
    
    const { data: shops, error: shopsError } = await query;
    
    if (shopsError) {
      return NextResponse.json(
        { error: 'Failed to fetch shops', details: shopsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: shops },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new shop (requires mechanic role)
export async function POST(request: NextRequest) {
  try {
    // Extract the session token from the request cookies
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }
    
    // Get user info to verify role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData || userData.role !== 'mechanic') {
      return NextResponse.json(
        { error: 'Only mechanics can create shops' },
        { status: 403 }
      );
    }
    
    // Check if the mechanic already has a shop
    const { data: existingShops, error: existingShopsError } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('owner_id', user.id);
      
    if (existingShops && existingShops.length > 0) {
      return NextResponse.json(
        { error: 'Mechanic already has a shop registered' },
        { status: 409 }
      );
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'address', 'city', 'state', 'zip_code', 'phone_number'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Prepare shop data
    const shopData: Shop = {
      owner_id: user.id,
      name: requestData.name,
      address: requestData.address,
      city: requestData.city,
      state: requestData.state,
      zip_code: requestData.zip_code,
      phone_number: requestData.phone_number,
      email: requestData.email,
      website: requestData.website,
      description: requestData.description,
      services: requestData.services || [],
      hours_of_operation: requestData.hours_of_operation || {},
      is_verified: false, // New shops are not verified by default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert new shop
    const { data: newShop, error: insertError } = await supabaseAdmin
      .from('shops')
      .insert([shopData])
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create shop', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: newShop },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update an existing shop
export async function PUT(request: NextRequest) {
  try {
    // Extract the session token from the request cookies
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }
    
    // Get user info to verify role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Validate shop ID
    if (!requestData.id) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the shop exists
    const { data: existingShop, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('id', requestData.id)
      .single();
      
    if (fetchError || !existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update the shop
    let hasPermission = false;
    
    if (userData.role === 'admin') {
      hasPermission = true;
    } else if (userData.role === 'mechanic' && existingShop.owner_id === user.id) {
      hasPermission = true;
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to update this shop' },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: Partial<Shop> = {
      updated_at: new Date().toISOString()
    };
    
    // Add fields that are being updated
    if (requestData.name) updateData.name = requestData.name;
    if (requestData.address) updateData.address = requestData.address;
    if (requestData.city) updateData.city = requestData.city;
    if (requestData.state) updateData.state = requestData.state;
    if (requestData.zip_code) updateData.zip_code = requestData.zip_code;
    if (requestData.phone_number) updateData.phone_number = requestData.phone_number;
    if ('email' in requestData) updateData.email = requestData.email;
    if ('website' in requestData) updateData.website = requestData.website;
    if ('description' in requestData) updateData.description = requestData.description;
    if ('services' in requestData) updateData.services = requestData.services;
    if ('hours_of_operation' in requestData) updateData.hours_of_operation = requestData.hours_of_operation;
    
    // Only admins can update verification status
    if (userData.role === 'admin' && 'is_verified' in requestData) {
      updateData.is_verified = requestData.is_verified;
    }
    
    // Update the shop
    const { data: updatedShop, error: updateError } = await supabaseAdmin
      .from('shops')
      .update(updateData)
      .eq('id', requestData.id)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update shop', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: updatedShop },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating shop:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shop (only admins or shop owner)
export async function DELETE(request: NextRequest) {
  try {
    // Extract the session token from the request cookies
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }
    
    // Get user info to verify role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get shop ID from URL
    const url = new URL(request.url);
    const shopId = url.searchParams.get('id');
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the shop exists
    const { data: existingShop, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();
      
    if (fetchError || !existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete the shop
    let hasPermission = false;
    
    if (userData.role === 'admin') {
      hasPermission = true;
    } else if (userData.role === 'mechanic' && existingShop.owner_id === user.id) {
      hasPermission = true;
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this shop' },
        { status: 403 }
      );
    }
    
    // Check if the shop has any service requests
    const { data: relatedRequests, error: relatedRequestsError } = await supabaseAdmin
      .from('service_requests')
      .select('id')
      .eq('shop_id', shopId)
      .limit(1);
      
    if (relatedRequests && relatedRequests.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete shop because it has associated service requests' },
        { status: 409 }
      );
    }
    
    // Delete the shop
    const { error: deleteError } = await supabaseAdmin
      .from('shops')
      .delete()
      .eq('id', shopId);
      
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete shop', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Shop deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting shop:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 