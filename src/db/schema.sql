-- Schema for the MechanicOnDemand application
-- This file serves as documentation for the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'shop', 'admin');
CREATE TYPE service_request_status AS ENUM (
  'pending_approval',
  'approved', 
  'rejected',
  'scheduled',
  'driver_assigned_pickup',
  'pickup_in_progress',
  'picked_up',
  'at_shop',
  'in_progress',
  'completed',
  'ready_for_delivery',
  'driver_assigned_return',
  'delivery_in_progress',
  'delivered',
  'pending_payment',
  'paid',
  'cancelled'
);
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error', 'service_request_status', 'payment', 'driver_update');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');
CREATE TYPE appointment_type AS ENUM ('pickup', 'delivery');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    role user_role NOT NULL,
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" 
    ON public.users FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
    ON public.users FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users" 
    ON public.users FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT,
    license_plate TEXT NOT NULL,
    vin TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicles table policies
CREATE POLICY "Customers can view their own vehicles" 
    ON public.vehicles FOR SELECT 
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own vehicles" 
    ON public.vehicles FOR UPDATE 
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own vehicles" 
    ON public.vehicles FOR INSERT 
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can delete their own vehicles" 
    ON public.vehicles FOR DELETE 
    USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all vehicles" 
    ON public.vehicles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Shops table
CREATE TABLE public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,
    is_accepting_requests BOOLEAN DEFAULT TRUE,
    operating_hours JSONB, -- JSON format for hours of operation
    stripe_account_id TEXT,
    rating NUMERIC(3,2), -- e.g. 4.50
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on shops table
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Shops table policies
CREATE POLICY "Anyone can view active shops" 
    ON public.shops FOR SELECT 
    USING (is_active = TRUE);

CREATE POLICY "Mechanics can view their own shops" 
    ON public.shops FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Mechanics can update their own shops" 
    ON public.shops FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Mechanics can insert their own shops" 
    ON public.shops FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all shops" 
    ON public.shops FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL,
    license_expiry DATE NOT NULL,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    vehicle_color TEXT,
    vehicle_license_plate TEXT,
    availability JSONB, -- JSON format for availability
    current_location JSONB, -- Location data when actively driving
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers table policies
CREATE POLICY "Drivers can view their own drivers" 
    ON public.drivers FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own drivers" 
    ON public.drivers FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all drivers" 
    ON public.drivers FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Time slots table
CREATE TABLE public.time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on time_slots table
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Time slots table policies
CREATE POLICY "Mechanics can view their own time slots" 
    ON public.time_slots FOR SELECT 
    USING (auth.uid() = shop_id);

CREATE POLICY "Mechanics can update their own time slots" 
    ON public.time_slots FOR UPDATE 
    USING (auth.uid() = shop_id);

CREATE POLICY "Admins can view all time slots" 
    ON public.time_slots FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service Requests table
CREATE TABLE public.service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    pickup_driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    return_driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    status service_request_status DEFAULT 'pending_approval',
    pickup_address TEXT NOT NULL,
    pickup_city TEXT NOT NULL,
    pickup_state TEXT NOT NULL,
    pickup_zip TEXT NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE,
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    estimated_price NUMERIC(10,2),
    final_price NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on service_requests table
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Service Requests table policies
CREATE POLICY "Customers can view their own service requests" 
    ON public.service_requests FOR SELECT 
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own service requests" 
    ON public.service_requests FOR INSERT 
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own service requests"
    ON public.service_requests FOR UPDATE
    USING (auth.uid() = customer_id);

CREATE POLICY "Mechanics can view service requests for their shops" 
    ON public.service_requests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = shop_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Mechanics can update service requests for their shops" 
    ON public.service_requests FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = shop_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can view service requests they are assigned to" 
    ON public.service_requests FOR SELECT 
    USING (
        pickup_driver_id = auth.uid() OR return_driver_id = auth.uid()
    );

CREATE POLICY "Admins can view all service requests" 
    ON public.service_requests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all service requests" 
    ON public.service_requests FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    time_slot_id UUID NOT NULL REFERENCES public.time_slots(id),
    appointment_type appointment_type NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments table policies
CREATE POLICY "Customers can view their own appointments" 
    ON public.appointments FOR SELECT 
    USING (auth.uid() = service_request_id);

CREATE POLICY "Customers can insert their own appointments" 
    ON public.appointments FOR INSERT 
    WITH CHECK (auth.uid() = service_request_id);

CREATE POLICY "Customers can update their own appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = service_request_id);

CREATE POLICY "Mechanics can view appointments for their shops" 
    ON public.appointments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = service_request_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Mechanics can update appointments for their shops" 
    ON public.appointments FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = service_request_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all appointments" 
    ON public.appointments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    transaction_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments table policies
CREATE POLICY "Customers can view their own payments" 
    ON public.payments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.service_requests 
            WHERE id = service_request_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Mechanics can view payments for their shops" 
    ON public.payments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.service_requests sr
            JOIN public.shops s ON sr.shop_id = s.id
            WHERE sr.id = service_request_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all payments" 
    ON public.payments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    channel notification_channel DEFAULT 'in_app',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_service_requests_customer_id ON public.service_requests(customer_id);
CREATE INDEX idx_service_requests_shop_id ON public.service_requests(shop_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX idx_payments_service_request_id ON public.payments(service_request_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
BEFORE UPDATE ON public.time_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 