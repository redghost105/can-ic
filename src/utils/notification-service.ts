import { supabase } from '@/lib/supabase';
import { 
  Notification, 
  NotificationType, 
  NotificationChannel, 
  NotificationPreferences,
  User
} from '@/types/models';

/**
 * Notification Service
 * Handles sending notifications through various channels and storing them in the database
 */

// Email service configuration (placeholder)
const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  try {
    // In a real implementation, this would use a service like SendGrid, Amazon SES, etc.
    console.log(`EMAIL to ${to}: ${subject}\n${body}`);
    
    // For development, we'll simulate a successful email send
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// SMS service configuration (placeholder)
const sendSMS = async (to: string, body: string): Promise<boolean> => {
  try {
    // In a real implementation, this would use a service like Twilio, Nexmo, etc.
    console.log(`SMS to ${to}: ${body}`);
    
    // For development, we'll simulate a successful SMS send
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

// Get user notification preferences
export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      // Create default preferences if not exists
      return createDefaultNotificationPreferences(userId);
    }
    
    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
};

// Create default notification preferences for a new user
export const createDefaultNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  const defaultPreferences = {
    user_id: userId,
    service_request_status: ['in_app', 'email'],
    payment_status: ['in_app', 'email'],
    driver_assigned: ['in_app', 'email'],
    mechanic_assigned: ['in_app'],
    vehicle_ready: ['in_app', 'email'],
    review_request: ['in_app', 'email'],
    system: ['in_app']
  };
  
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert(defaultPreferences)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error creating default notification preferences:', error);
    return null;
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> => {
  if (!preferences.id || !preferences.user_id) {
    throw new Error('Notification preferences id and user_id are required');
  }
  
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('id', preferences.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return null;
  }
};

// Create and send a notification
export const sendNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): Promise<Notification | null> => {
  try {
    // Get user notification preferences
    const preferences = await getUserNotificationPreferences(userId);
    if (!preferences) {
      throw new Error('Could not retrieve notification preferences');
    }
    
    // Get user details for email/SMS
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    const user = userData as User;
    
    // Create notifications based on user preferences
    const channels = preferences[type];
    const notificationPromises: Promise<any>[] = [];
    
    // Process each channel
    for (const channel of channels) {
      const notification = {
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        is_read: false,
        channel,
        created_at: new Date().toISOString()
      };
      
      // Store in-app notification
      if (channel === 'in_app') {
        const { data, error } = await supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single();
        
        if (error) throw error;
      }
      
      // Send email notification
      if (channel === 'email' && user.email) {
        notificationPromises.push(sendEmail(
          user.email,
          title,
          message
        ));
      }
      
      // Send SMS notification
      if (channel === 'sms' && user.phone) {
        notificationPromises.push(sendSMS(
          user.phone,
          `${title}: ${message}`
        ));
      }
    }
    
    // Wait for all notification channels to be processed
    await Promise.all(notificationPromises);
    
    // Return the in-app notification
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (notificationError) throw notificationError;
    
    return notificationData as Notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

// Get user notifications
export const getUserNotifications = async (
  userId: string,
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', 'in_app')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as Notification[];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('channel', 'in_app');
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}; 