-- Schema extensions for the Time Slots feature
-- Adding tables for appointment scheduling

-- Time slots table for driver availability
CREATE TABLE public.time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- Format: 'weekly', 'biweekly', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT time_slots_valid_times CHECK (start_time < end_time)
);

-- Add index for performance
CREATE INDEX idx_time_slots_driver_id ON public.time_slots(driver_id);
CREATE INDEX idx_time_slots_date ON public.time_slots(date);
CREATE INDEX idx_time_slots_availability ON public.time_slots(is_available);

-- Enable RLS on time_slots table
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Time slots table policies
CREATE POLICY "Drivers can view their own time slots" 
    ON public.time_slots FOR SELECT 
    USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own time slots" 
    ON public.time_slots FOR UPDATE 
    USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their own time slots" 
    ON public.time_slots FOR INSERT 
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own time slots" 
    ON public.time_slots FOR DELETE 
    USING (auth.uid() = driver_id);

CREATE POLICY "Customers can view available time slots" 
    ON public.time_slots FOR SELECT 
    USING (is_available = TRUE);

CREATE POLICY "Admins can view all time slots" 
    ON public.time_slots FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all time slots" 
    ON public.time_slots FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Scheduled appointments table that links service requests to specific time slots
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    time_slot_id UUID NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('pickup', 'delivery', 'service')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_appointments_service_request_id ON public.appointments(service_request_id);
CREATE INDEX idx_appointments_time_slot_id ON public.appointments(time_slot_id);

-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments table policies
CREATE POLICY "Customers can view their own appointments" 
    ON public.appointments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.service_requests 
            WHERE id = service_request_id AND customer_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can view appointments they are assigned to" 
    ON public.appointments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.time_slots 
            WHERE id = time_slot_id AND driver_id = auth.uid()
        )
    );

CREATE POLICY "Mechanics can view appointments for their shops" 
    ON public.appointments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.service_requests sr
            JOIN public.shops s ON sr.shop_id = s.id
            WHERE sr.id = service_request_id AND s.owner_id = auth.uid()
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

CREATE POLICY "Admins can update all appointments" 
    ON public.appointments FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_time_slots_updated_at
BEFORE UPDATE ON public.time_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 