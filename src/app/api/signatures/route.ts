import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    
    // Parse the request body
    const requestData = await request.json();
    
    // Validate required fields
    if (!requestData.serviceRequestId || !requestData.signatureData) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceRequestId and signatureData are required' },
        { status: 400 }
      );
    }
    
    // Get user role
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
    
    // Get current service request
    const { data: serviceRequest, error: serviceRequestError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', requestData.serviceRequestId)
      .single();
      
    if (serviceRequestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    // Determine if user has permission to update this service request
    let hasPermission = false;
    
    if (userData.role === 'admin') {
      hasPermission = true;
    } else if (userData.role === 'shop') {
      // Check if mechanic owns the shop associated with this request
      const { data: shopData } = await supabaseAdmin
        .from('shops')
        .select('*')
        .eq('id', serviceRequest.shop_id)
        .eq('owner_id', user.id)
        .single();
        
      if (shopData) {
        hasPermission = true;
      }
    } else if (userData.role === 'customer' && serviceRequest.customer_id === user.id) {
      // Customers can sign their own service requests
      hasPermission = true;
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to add a signature to this service request' },
        { status: 403 }
      );
    }
    
    // Store the signature data
    const { data: signature, error: signatureError } = await supabaseAdmin
      .from('signatures')
      .insert({
        service_request_id: requestData.serviceRequestId,
        signature_data: requestData.signatureData,
        signed_by: userData.role === 'customer' ? 'customer' : 'shop',
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (signatureError) {
      return NextResponse.json(
        { error: 'Failed to store signature', details: signatureError.message },
        { status: 500 }
      );
    }
    
    // If the signature was added by a shop, and this is a service completion
    // automatically update the service request status to completed
    if (userData.role === 'shop' && requestData.completeService) {
      // Update the service request status
      const { error: updateError } = await supabaseAdmin
        .from('service_requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
          ...(requestData.notes && { notes: serviceRequest.notes ? `${serviceRequest.notes}\n${requestData.notes}` : requestData.notes }),
          ...(requestData.price && { price: requestData.price }),
        })
        .eq('id', requestData.serviceRequestId);
        
      if (updateError) {
        return NextResponse.json(
          { error: 'Signature saved but failed to update service request status', details: updateError.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { success: true, data: signature },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error storing signature:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 