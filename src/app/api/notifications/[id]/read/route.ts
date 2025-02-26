import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;

    // First check if the notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('Error fetching notification:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch notification' },
        { status: 500 }
      );
    }

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this notification' },
        { status: 403 }
      );
    }

    // Update the notification as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 