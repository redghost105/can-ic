import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';
import { ServiceRequestStatus } from '@/types/models';
import emailService from '@/lib/email-service';

// Create a Supabase client with the service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Use the ServiceRequestStatus from the models file for type safety
type RequestStatus = ServiceRequestStatus;

// Define the allowed transitions type
type StatusTransitions = {
  [key in RequestStatus]?: RequestStatus[];
};

// Define the user groups
type UserGroup = 'shop' | 'customer' | 'driver' | 'admin';

// Valid status transitions based on user role
const allowedStatusTransitions: Record<UserGroup, StatusTransitions> = {
  shop: {
    pending: ['accepted', 'cancelled'],
    accepted: ['in_progress', 'at_shop', 'completed'],
    in_progress: ['completed'],
    at_shop: ['in_progress', 'completed'],
  },
  customer: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
    pending_payment: ['paid'],
  },
  driver: {
    accepted: ['driver_assigned_pickup', 'in_transit_to_shop'],
    in_transit_to_shop: ['at_shop'],
    completed: ['driver_assigned_return', 'in_transit_to_owner'],
    in_transit_to_owner: ['delivered'],
  },
  admin: {
    // Admin can change to any status
    pending: ['accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    accepted: ['pending', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    in_progress: ['pending', 'accepted', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    completed: ['pending', 'accepted', 'in_progress', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    driver_assigned_pickup: ['pending', 'accepted', 'in_progress', 'completed', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    in_transit_to_shop: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    at_shop: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    pending_payment: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    paid: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    cancelled: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'driver_assigned_return', 'in_transit_to_owner', 'delivered'],
    driver_assigned_return: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'in_transit_to_owner', 'delivered'],
    in_transit_to_owner: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'delivered'],
    delivered: ['pending', 'accepted', 'in_progress', 'completed', 'driver_assigned_pickup', 'in_transit_to_shop', 'at_shop', 'pending_payment', 'paid', 'cancelled', 'driver_assigned_return', 'in_transit_to_owner'],
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;
    const body = await request.json();
    
    // Validate request body
    if (!body.serviceRequestId || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceRequestId, status' },
        { status: 400 }
      );
    }
    
    // Get current service request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*, customer:customer_id(*), shop:shop_id(*)')
      .eq('id', body.serviceRequestId)
      .single();
      
    if (fetchError || !serviceRequest) {
      console.error('Error fetching service request:', fetchError);
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    const currentStatus = serviceRequest.status as RequestStatus;
    const newStatus = body.status as RequestStatus;
    
    // Check if status transition is allowed
    if (!allowedStatusTransitions[user.role][currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { 
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          allowedTransitions: allowedStatusTransitions[user.role][currentStatus]
        },
        { status: 400 }
      );
    }
    
    // Check permissions
    const userGroup = getUserGroup(user.role);
    if (!allowedStatusTransitions[userGroup][newStatus]?.includes(currentStatus)) {
      return NextResponse.json(
        { 
          error: `You don't have permission to change status to ${newStatus}`,
          allowedGroups: allowedStatusTransitions[userGroup][newStatus]
        },
        { status: 403 }
      );
    }
    
    // Check ownership/assignment based on user role
    if (!checkUserPermission(user, serviceRequest, userGroup)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this service request' },
        { status: 403 }
      );
    }
    
    // Update the service request status
    const { data: updatedServiceRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes: body.notes ? [...(serviceRequest.notes || []), {
          text: body.notes,
          added_by: user.id,
          added_by_role: user.role,
          added_at: new Date().toISOString()
        }] : serviceRequest.notes
      })
      .eq('id', body.serviceRequestId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating service request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service request' },
        { status: 500 }
      );
    }
    
    // Add record to status_history
    const { error: historyError } = await supabaseAdmin
      .from('status_history')
      .insert({
        service_request_id: body.serviceRequestId,
        previous_status: currentStatus,
        new_status: newStatus,
        changed_by: user.id,
        changed_by_role: user.role,
        notes: body.notes,
        created_at: new Date().toISOString()
      });
      
    if (historyError) {
      console.error('Error adding status history:', historyError);
      // Non-blocking error, continue processing
    }
    
    // Send notifications about the status change
    await sendStatusUpdateNotifications(
      serviceRequest,
      currentStatus,
      newStatus,
      user
    );
    
    return NextResponse.json({
      success: true,
      message: `Service request status updated to ${newStatus}`,
      serviceRequest: updatedServiceRequest
    });
  } catch (error) {
    console.error('Error in status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function getUserGroup(role: string): UserGroup {
  switch (role) {
    case 'shop':
      return 'shop';
    case 'customer':
      return 'customer';
    case 'driver':
      return 'driver';
    case 'admin':
      return 'admin';
    default:
      return 'customer';
  }
}

function checkUserPermission(user: any, serviceRequest: any, userGroup: UserGroup): boolean {
  if (userGroup === 'admin') {
    return true;
  }
  
  switch (userGroup) {
    case 'customer':
      return user.id === serviceRequest.customer_id;
    case 'shop':
      return user.id === serviceRequest.shop_id;
    case 'driver':
      return user.id === serviceRequest.pickup_driver_id || 
             user.id === serviceRequest.return_driver_id;
    default:
      return false;
  }
}

// Function to handle notifications for status updates
async function sendStatusUpdateNotifications(
  serviceRequest: any, 
  previousStatus: string, 
  newStatus: string,
  currentUser: any
) {
  try {
    // Create an in-app notification for the customer
    if (serviceRequest.customer_id && serviceRequest.customer_id !== currentUser.id) {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: serviceRequest.customer_id,
          type: 'service_request_status',
          title: 'Service Request Update',
          message: `Your service request status has changed from ${formatStatus(previousStatus)} to ${formatStatus(newStatus)}.`,
          related_id: serviceRequest.id,
          is_read: false,
          channel: 'in_app',
          created_at: new Date().toISOString()
        });
        
      if (notificationError) {
        console.error('Error creating customer notification:', notificationError);
      }
      
      // Also send email notification to customer if we have customer data
      if (serviceRequest.customer && serviceRequest.customer.email) {
        await sendEmailNotification({
          serviceRequestId: serviceRequest.id,
          previousStatus,
          newStatus,
          recipientEmail: serviceRequest.customer.email,
          recipientName: serviceRequest.customer.full_name || serviceRequest.customer.email
        });
      }
    }
    
    // Create an in-app notification for the shop
    if (serviceRequest.shop_id && serviceRequest.shop_id !== currentUser.id) {
      const { error: shopNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: serviceRequest.shop_id,
          type: 'service_request_status',
          title: 'Service Request Update',
          message: `Service request #${serviceRequest.id} status has changed from ${formatStatus(previousStatus)} to ${formatStatus(newStatus)}.`,
          related_id: serviceRequest.id,
          is_read: false,
          channel: 'in_app',
          created_at: new Date().toISOString()
        });
        
      if (shopNotificationError) {
        console.error('Error creating shop notification:', shopNotificationError);
      }
      
      // Also send email notification to shop if we have shop data
      if (serviceRequest.shop && serviceRequest.shop.email) {
        await sendEmailNotification({
          serviceRequestId: serviceRequest.id,
          previousStatus,
          newStatus,
          recipientEmail: serviceRequest.shop.email,
          recipientName: serviceRequest.shop.name || serviceRequest.shop.email
        });
      }
    }
    
    // Create notifications for drivers if they're assigned
    const driverIds = [
      serviceRequest.pickup_driver_id,
      serviceRequest.return_driver_id
    ].filter(id => id && id !== currentUser.id);
    
    // Get all driver information
    if (driverIds.length > 0) {
      const { data: drivers, error: driversError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .in('id', driverIds);
        
      if (driversError) {
        console.error('Error fetching driver information:', driversError);
      } else if (drivers) {
        // Create notifications for each driver
        for (const driver of drivers) {
          const { error: driverNotificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: driver.id,
              type: 'service_request_status',
              title: 'Assignment Update',
              message: `Service request #${serviceRequest.id} status has changed from ${formatStatus(previousStatus)} to ${formatStatus(newStatus)}.`,
              related_id: serviceRequest.id,
              is_read: false,
              channel: 'in_app',
              created_at: new Date().toISOString()
            });
            
          if (driverNotificationError) {
            console.error(`Error creating notification for driver ${driver.id}:`, driverNotificationError);
          }
          
          // Send email notification to driver
          if (driver.email) {
            await sendEmailNotification({
              serviceRequestId: serviceRequest.id,
              previousStatus,
              newStatus,
              recipientEmail: driver.email,
              recipientName: driver.full_name || driver.email
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error sending status update notifications:', error);
  }
}

// Format status for display
function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Send email notification via the email notification endpoint
async function sendEmailNotification({
  serviceRequestId, 
  previousStatus, 
  newStatus, 
  recipientEmail,
  recipientName
}: {
  serviceRequestId: string;
  previousStatus: string;
  newStatus: string;
  recipientEmail: string;
  recipientName?: string;
}) {
  try {
    // Call our status-email endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/status-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceRequestId,
        previousStatus,
        newStatus,
        recipientEmail,
        recipientName
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error sending email notification:', errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error calling email notification endpoint:', error);
    return false;
  }
} 