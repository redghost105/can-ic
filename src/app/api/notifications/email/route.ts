import { NextRequest, NextResponse } from 'next/server';

interface EmailRequest {
  to: string;
  subject: string;
  text: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

// In production, you would use a service like SendGrid, Mailgun, etc.
// This is a mock implementation for demonstration purposes
async function sendEmail(emailData: EmailRequest): Promise<boolean> {
  try {
    console.log('Sending email with data:', emailData);
    
    // In a real implementation, you would call your email service provider's API here
    
    // Mock successful email sending
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ensure request is authorized (in production, you'd use middleware for this)
    // For demo, we'll assume all requests are authorized
    
    const body = await req.json();
    
    // Validate the request body
    if (!body.to || !body.subject || !body.text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text' },
        { status: 400 }
      );
    }
    
    // Send the email
    const success = await sendEmail({
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
      templateId: body.templateId,
      templateData: body.templateData
    });
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email notification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 