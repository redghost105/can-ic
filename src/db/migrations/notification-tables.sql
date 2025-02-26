-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('success', 'error', 'info', 'warning')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    service_status_updates BOOLEAN NOT NULL DEFAULT true,
    payment_reminders BOOLEAN NOT NULL DEFAULT true,
    marketing_emails BOOLEAN NOT NULL DEFAULT false,
    driver_updates BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE (user_id)
);

-- Create receipt table for payment receipts
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    payment_intent_id TEXT NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    payment_intent_id TEXT NOT NULL UNIQUE,
    payment_intent_client_secret TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    amount DECIMAL(10, 2) NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_payments_service_request_id ON public.payments(service_request_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON public.receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_service_request_id ON public.receipts(service_request_id);

-- Security policies
-- Allow users to only see their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_policy ON public.notifications 
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to only see their own notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_prefs_select_policy ON public.notification_preferences 
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notification_prefs_update_policy ON public.notification_preferences 
    FOR UPDATE USING (user_id = auth.uid());

-- Allow users to only see their own receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_select_policy ON public.receipts 
    FOR SELECT USING (customer_id = auth.uid() OR shop_id = auth.uid());

-- Allow users to only see their own payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_select_policy ON public.payments 
    FOR SELECT USING (customer_id = auth.uid() OR shop_id = auth.uid());

-- Add function to create notification preferences when a new user is created
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notification preferences for new users
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;
CREATE TRIGGER create_notification_preferences_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_preferences(); 