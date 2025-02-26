// Email Service for sending notifications
import nodemailer from 'nodemailer';
import { ServiceRequest } from '@/models/types';

// Configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || 'user@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'password';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@mechanic-on-demand.com';

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Email templates
export const EmailTemplates = {
  SERVICE_REQUEST_CREATED: 'service_request_created',
  SERVICE_STATUS_UPDATED: 'service_status_updated',
  SERVICE_COMPLETED: 'service_completed',
  PAYMENT_RECEIVED: 'payment_received',
  DRIVER_ASSIGNED: 'driver_assigned',
  VEHICLE_PICKUP_SCHEDULED: 'vehicle_pickup_scheduled',
  VEHICLE_DELIVERED: 'vehicle_delivered',
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email
 * @param options Email options
 * @returns Promise resolving to the sent info
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, html, text } = options;
    
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
    });
    
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Sends a service request created notification
 * @param email Recipient email
 * @param serviceRequest The service request data
 */
export async function sendServiceRequestCreatedEmail(email: string, serviceRequest: ServiceRequest) {
  const subject = 'Your Service Request Has Been Created';
  
  const html = `
    <div>
      <h1>Your Service Request Has Been Created</h1>
      <p>Thank you for using Mechanic On Demand. Your service request has been created successfully.</p>
      <h2>Request Details</h2>
      <ul>
        <li><strong>Request ID:</strong> ${serviceRequest.id}</li>
        <li><strong>Service Type:</strong> ${serviceRequest.service_type}</li>
        <li><strong>Status:</strong> ${serviceRequest.status}</li>
        <li><strong>Created:</strong> ${new Date(serviceRequest.created_at).toLocaleString()}</li>
      </ul>
      <p>You can track the status of your request in the Mechanic On Demand app or website.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a service status update notification
 * @param email Recipient email
 * @param serviceRequest The service request data
 * @param previousStatus The previous status
 * @param newStatus The new status
 */
export async function sendServiceStatusUpdateEmail(
  email: string, 
  serviceRequest: ServiceRequest, 
  previousStatus: string, 
  newStatus: string
) {
  const subject = 'Your Service Request Status Has Been Updated';
  
  const html = `
    <div>
      <h1>Service Request Status Update</h1>
      <p>Your service request status has been updated.</p>
      <h2>Request Details</h2>
      <ul>
        <li><strong>Request ID:</strong> ${serviceRequest.id}</li>
        <li><strong>Service Type:</strong> ${serviceRequest.service_type}</li>
        <li><strong>Previous Status:</strong> ${previousStatus}</li>
        <li><strong>New Status:</strong> ${newStatus}</li>
        <li><strong>Updated:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>You can track the status of your request in the Mechanic On Demand app or website.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a service completed notification
 * @param email Recipient email
 * @param serviceRequest The service request data
 * @param finalPrice The final price of the service
 */
export async function sendServiceCompletedEmail(
  email: string, 
  serviceRequest: ServiceRequest, 
  finalPrice: number
) {
  const subject = 'Your Service Has Been Completed';
  
  const html = `
    <div>
      <h1>Service Completed</h1>
      <p>Great news! Your vehicle service has been completed.</p>
      <h2>Service Details</h2>
      <ul>
        <li><strong>Request ID:</strong> ${serviceRequest.id}</li>
        <li><strong>Service Type:</strong> ${serviceRequest.service_type}</li>
        <li><strong>Final Price:</strong> $${finalPrice.toFixed(2)}</li>
        <li><strong>Completed:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>Please log in to the Mechanic On Demand app or website to process payment and arrange for vehicle pickup.</p>
      <p>Thank you for choosing Mechanic On Demand!</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a payment received notification
 * @param email Recipient email
 * @param serviceRequest The service request data
 * @param amount The payment amount
 */
export async function sendPaymentReceivedEmail(
  email: string, 
  serviceRequest: ServiceRequest, 
  amount: number
) {
  const subject = 'Payment Confirmation';
  
  const html = `
    <div>
      <h1>Payment Confirmation</h1>
      <p>Thank you for your payment for Mechanic On Demand services.</p>
      <h2>Payment Details</h2>
      <ul>
        <li><strong>Request ID:</strong> ${serviceRequest.id}</li>
        <li><strong>Service Type:</strong> ${serviceRequest.service_type}</li>
        <li><strong>Amount Paid:</strong> $${amount.toFixed(2)}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>A receipt for this transaction has been saved to your account.</p>
      <p>Thank you for choosing Mechanic On Demand!</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a driver assigned notification
 * @param email Recipient email
 * @param serviceRequest The service request data
 * @param driverName The driver's name
 * @param estimatedArrival The estimated arrival time
 */
export async function sendDriverAssignedEmail(
  email: string, 
  serviceRequest: ServiceRequest, 
  driverName: string,
  estimatedArrival: string
) {
  const subject = 'Driver Assigned for Your Vehicle';
  
  const html = `
    <div>
      <h1>Driver Assigned</h1>
      <p>A driver has been assigned to transport your vehicle.</p>
      <h2>Details</h2>
      <ul>
        <li><strong>Request ID:</strong> ${serviceRequest.id}</li>
        <li><strong>Driver Name:</strong> ${driverName}</li>
        <li><strong>Estimated Arrival:</strong> ${estimatedArrival}</li>
      </ul>
      <p>You will receive another notification when the driver is on the way.</p>
      <p>Thank you for choosing Mechanic On Demand!</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
}

// Export all email notification functions
export default {
  sendEmail,
  sendServiceRequestCreatedEmail,
  sendServiceStatusUpdateEmail,
  sendServiceCompletedEmail,
  sendPaymentReceivedEmail,
  sendDriverAssignedEmail,
}; 