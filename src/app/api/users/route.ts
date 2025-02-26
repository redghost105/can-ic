import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define user roles
type UserRole = 'customer' | 'mechanic' | 'driver' | 'admin';

// User interface
interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET - Get user profile
export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    // Admins can view any user profile, others can only view their own
    let queryUserId = user.id;
    
    if (userId) {
      // Check if current user is admin
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (userError || !userData || userData.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have permission to view other user profiles' },
          { status: 403 }
        );
      }
      
      queryUserId = userId;
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', queryUserId)
      .single();
      
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: profile },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
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
    
    // Parse request body
    const requestData = await request.json();
    
    // Check if trying to update another user's profile (admin only)
    let targetUserId = user.id;
    
    if (requestData.id && requestData.id !== user.id) {
      // Check if current user is admin
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (userError || !userData || userData.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have permission to update other user profiles' },
          { status: 403 }
        );
      }
      
      targetUserId = requestData.id;
    }
    
    // Prepare update data
    const updateData: Partial<User> = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that are allowed to be updated
    if (requestData.first_name) updateData.first_name = requestData.first_name;
    if (requestData.last_name) updateData.last_name = requestData.last_name;
    if ('phone_number' in requestData) updateData.phone_number = requestData.phone_number;
    if ('address' in requestData) updateData.address = requestData.address;
    if ('city' in requestData) updateData.city = requestData.city;
    if ('state' in requestData) updateData.state = requestData.state;
    if ('zip_code' in requestData) updateData.zip_code = requestData.zip_code;
    if ('profile_image_url' in requestData) updateData.profile_image_url = requestData.profile_image_url;
    
    // Only admin can change user role
    if (targetUserId !== user.id && 'role' in requestData) {
      updateData.role = requestData.role;
    }
    
    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', targetUserId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user profile', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: updatedProfile },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create initial user profile (called after registration)
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
    
    // Check if user profile already exists
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (existingProfile) {
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 409 }
      );
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'role'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate role
    const validRoles: UserRole[] = ['customer', 'mechanic', 'driver'];
    if (!validRoles.includes(requestData.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: customer, mechanic, driver' },
        { status: 400 }
      );
    }
    
    // Prepare user data
    const userData: User = {
      id: user.id,
      email: user.email || '',
      role: requestData.role,
      first_name: requestData.first_name,
      last_name: requestData.last_name,
      phone_number: requestData.phone_number,
      address: requestData.address,
      city: requestData.city,
      state: requestData.state,
      zip_code: requestData.zip_code,
      profile_image_url: requestData.profile_image_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert user profile
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create user profile', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: newProfile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 