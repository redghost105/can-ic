import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';
import { ServiceRequestStatus } from '@/types/models';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EmailNotificationRequest {
  serviceRequestId: string;
  previousStatus: ServiceRequestStatus;
  newStatus: ServiceRequestStatus;
  recipientEmail: string;
  recipientName?: string;
}

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
    
    // Parse request body
    const body: EmailNotificationRequest = await request.json();
    
    // Validate required fields
    if (!body.serviceRequestId || !body.newStatus || !body.recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceRequestId, newStatus, recipientEmail' },
        { status: 400 }
      );
    }
    
    // Get service request details
    const { data: serviceRequest, error: serviceRequestError } = await supabase
      .from('service_requests')
      .select('*, customer:customer_id(*), vehicle:vehicle_id(*), shop:shop_id(*)')
      .eq('id', body.serviceRequestId)
      .single();
      
    if (serviceRequestError || !serviceRequest) {
      console.error('Error fetching service request:', serviceRequestError);
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }
    
    // Check permissions - only allow customers, shops, drivers assigned to the request, or admins to send emails
    if (
      user.role !== 'admin' && 
      user.id !== serviceRequest.customer_id && 
      user.id !== serviceRequest.shop_id && 
      user.id !== serviceRequest.pickup_driver_id && 
      user.id !== serviceRequest.return_driver_id
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to send notifications for this service request' },
        { status: 403 }
      );
    }
    
    // Generate email content based on status change
    const emailContent = generateStatusUpdateEmailContent(
      serviceRequest, 
      body.previousStatus, 
      body.newStatus,
      body.recipientName || 'Customer'
    );
    
    // In a real app, you would call an email service provider here
    // For demonstration, we'll just log and save to the notifications table
    console.log('Sending email notification:', emailContent);
    
    // Create a notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: serviceRequest.customer_id,
        type: 'service_request_status',
        title: emailContent.subject,
        message: emailContent.textContent,
        related_id: body.serviceRequestId,
        is_read: false,
        channel: 'email'
      })
      .select()
      .single();
      
    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
      return NextResponse.json(
        { error: 'Failed to create notification record' },
        { status: 500 }
      );
    }
    
    // Send the actual email (in a real app)
    // We would use an email service like SendGrid, AWS SES, etc.
    const emailSent = await mockSendEmail(
      body.recipientEmail,
      emailContent.subject,
      emailContent.htmlContent,
      emailContent.textContent
    );
    
    return NextResponse.json({
      success: true,
      message: 'Status update email notification sent',
      emailContent,
      notificationId: notification.id
    });
  } catch (error) {
    console.error('Error sending status email notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock function to simulate sending an email
async function mockSendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<boolean> {
  // In a real app, this would send the email via an email service
  console.log(`MOCK EMAIL SENT to ${to}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Text content: ${textContent}`);
  
  // Simulate successful email sending
  return true;
}

// Helper function to generate email content based on status change
function generateStatusUpdateEmailContent(
  serviceRequest: any,
  previousStatus: ServiceRequestStatus,
  newStatus: ServiceRequestStatus,
  recipientName: string
) {
  // Get vehicle info
  const vehicleInfo = serviceRequest.vehicle 
    ? `${serviceRequest.vehicle.year} ${serviceRequest.vehicle.make} ${serviceRequest.vehicle.model}`
    : 'your vehicle';
  
  // Shop info
  const shopName = serviceRequest.shop?.name || 'the repair shop';
  
  // Generate status-specific content
  let subject = `Your Service Request Status Update: ${formatStatus(newStatus)}`;
  let message = '';
  
  switch(newStatus) {
    case 'approved':
      message = `Your service request for ${vehicleInfo} has been approved by ${shopName}. We'll coordinate with you to schedule pickup.`;
      break;
    case 'dispatched':
      message = `A driver has been dispatched to pick up ${vehicleInfo}. They will arrive at the scheduled time.`;
      break;
    case 'pickup_in_progress':
      message = `Your vehicle is currently being picked up by our driver. They will deliver it to ${shopName}.`;
      break;
    case 'at_shop':
      message = `${vehicleInfo} has arrived at ${shopName} and is awaiting service. We'll update you when service begins.`;
      break;
    case 'in_progress':
      message = `${shopName} has started working on ${vehicleInfo}. We'll notify you when the service is complete.`;
      break;
    case 'completed':
      message = `Great news! The service for ${vehicleInfo} has been completed. We'll arrange return delivery soon.`;
      break;
    case 'ready_for_delivery':
      message = `${vehicleInfo} is ready for delivery back to you. Our driver will be assigned shortly.`;
      break;
    case 'delivery_in_progress':
      message = `Your vehicle is on its way back to you! Our driver has left ${shopName} and is en route to your location.`;
      break;
    case 'delivered':
      message = `${vehicleInfo} has been delivered back to you. We hope you're satisfied with the service!`;
      break;
    case 'pending_payment':
      message = `The service for ${vehicleInfo} is complete. Please process your payment to complete this transaction.`;
      break;
    case 'paid':
      message = `Thank you for your payment! Your service request for ${vehicleInfo} is now complete.`;
      break;
    case 'cancelled':
      message = `Your service request for ${vehicleInfo} has been cancelled. If you did not initiate this cancellation, please contact support.`;
      break;
    default:
      message = `Your service request for ${vehicleInfo} has been updated to ${formatStatus(newStatus)}.`;
  }
  
  // Create HTML version
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Service Request Status Update</h2>
      <p>Hello ${recipientName},</p>
      <p>${message}</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0;"><strong>Service Request ID:</strong> ${serviceRequest.id}</p>
        <p style="margin: 8px 0;"><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #3b82f6;">${formatStatus(newStatus)}</span></p>
        <p style="margin: 8px 0;"><strong>Service Type:</strong> ${serviceRequest.service_type || 'General Service'}</p>
      </div>
      <p>You can view the full details of your service request by logging into your account.</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/service-requests/${serviceRequest.id}" 
           style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Service Request
        </a>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;
  
  return {
    subject,
    htmlContent,
    textContent: message
  };
}

// Helper function to format status for display
function formatStatus(status: ServiceRequestStatus): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 