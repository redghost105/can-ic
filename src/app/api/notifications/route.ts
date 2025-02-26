import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUserNotificationPreferences,
  updateNotificationPreferences
} from '@/utils/notification-service';
import { 
  Notification, 
  NotificationPreferences, 
  ApiResponse 
} from '@/types/models';
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get user from request
const getUserFromRequest = async (request: NextRequest) => {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  if (!token) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

/**
 * GET /api/notifications
 * Retrieve user notifications with optional filtering
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Notification[]>>> {
  try {
    // Get and verify authentication token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const includeRead = url.searchParams.get('include_read') === 'true';
    
    // Construct query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (!includeRead) {
      query = query.eq('is_read', false);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: notifications,
    });
    
  } catch (error: any) {
    console.error('Error in notifications GET endpoint:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Mark notification(s) as read, update preferences, etc.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    // Get and verify authentication token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow admins, shops, or service API to create notifications
    if (!['admin', 'shop', 'service'].includes(user.app_metadata?.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      recipientId, 
      message, 
      type = 'info', 
      link = null 
    } = body;
    
    if (!recipientId || !message) {
      return NextResponse.json({ 
        success: false,
        error: 'Required fields missing', 
        details: 'recipientId and message are required' 
      }, { status: 400 });
    }
    
    // Check if the recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();
    
    if (recipientError || !recipient) {
      return NextResponse.json({ 
        success: false,
        error: 'Recipient not found', 
        details: 'The specified recipient does not exist' 
      }, { status: 404 });
    }
    
    // Create the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        message,
        type,
        link,
        is_read: false,
        created_by: user.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
    
  } catch (error: any) {
    console.error('Error in notifications POST endpoint:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 