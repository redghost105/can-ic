-- RLS POLICIES FOR MECHANICONDEMAND

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Create a custom function to get current user role
CREATE OR REPLACE FUNCTION get_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS TABLE POLICIES

-- Users can view their own profile
CREATE POLICY user_view_own_profile ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can view shops and drivers (public profiles)
CREATE POLICY user_view_public_profiles ON users
  FOR SELECT
  USING (role IN ('shop', 'driver') AND is_active = TRUE);

-- Users can update their own profile
CREATE POLICY user_update_own_profile ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Admins can view and modify all users
CREATE POLICY admin_manage_users ON users
  USING (get_role() = 'admin');

-- VEHICLES TABLE POLICIES

-- Customers can CRUD their own vehicles
CREATE POLICY customer_manage_own_vehicles ON vehicles
  USING (customer_id = auth.uid() OR get_role() = 'admin');

-- Shops can view vehicles related to their service requests
CREATE POLICY shop_view_related_vehicles ON vehicles
  FOR SELECT
  USING (
    get_role() = 'shop' AND
    EXISTS (
      SELECT 1 FROM service_requests 
      WHERE vehicle_id = vehicles.id AND shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
  );

-- Drivers can view vehicles for their assigned pickups/deliveries
CREATE POLICY driver_view_assigned_vehicles ON vehicles
  FOR SELECT
  USING (
    get_role() = 'driver' AND
    EXISTS (
      SELECT 1 FROM service_requests
      WHERE 
        vehicle_id = vehicles.id AND 
        (pickup_driver_id = auth.uid() OR return_driver_id = auth.uid())
    )
  );

-- SHOPS TABLE POLICIES

-- Shop owners can manage their own shops
CREATE POLICY shop_manage_own_shop ON shops
  USING (user_id = auth.uid() OR get_role() = 'admin');

-- Everyone can view active shops
CREATE POLICY everyone_view_active_shops ON shops
  FOR SELECT
  USING (is_active = TRUE);

-- SERVICE REQUESTS TABLE POLICIES

-- Customers can view their own service requests
CREATE POLICY customer_view_own_requests ON service_requests
  FOR SELECT
  USING (customer_id = auth.uid() OR get_role() = 'admin');

-- Customers can create service requests
CREATE POLICY customer_create_requests ON service_requests
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Customers can update their own pending requests
CREATE POLICY customer_update_own_pending_requests ON service_requests
  FOR UPDATE
  USING (
    customer_id = auth.uid() AND
    status IN ('pending_approval', 'cancelled')
  );

-- Shops can view requests assigned to them
CREATE POLICY shop_view_assigned_requests ON service_requests
  FOR SELECT
  USING (
    get_role() = 'shop' AND
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

-- Shops can update requests assigned to them
CREATE POLICY shop_update_assigned_requests ON service_requests
  FOR UPDATE
  USING (
    get_role() = 'shop' AND
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

-- Drivers can view requests assigned to them
CREATE POLICY driver_view_assigned_requests ON service_requests
  FOR SELECT
  USING (
    get_role() = 'driver' AND
    (pickup_driver_id = auth.uid() OR return_driver_id = auth.uid())
  );

-- Drivers can update status of requests assigned to them
CREATE POLICY driver_update_assigned_requests ON service_requests
  FOR UPDATE
  USING (
    get_role() = 'driver' AND
    (pickup_driver_id = auth.uid() OR return_driver_id = auth.uid())
  )
  WITH CHECK (
    -- Only allow updating specific fields
    (NEW.status IS NOT NULL AND OLD.status IS NOT NULL) AND
    ((pickup_driver_id = auth.uid() AND 
      (OLD.status = 'driver_assigned_pickup' AND NEW.status = 'pickup_in_progress') OR
      (OLD.status = 'pickup_in_progress' AND NEW.status = 'picked_up') OR
      (OLD.status = 'picked_up' AND NEW.status = 'at_shop')
    ) OR
    (return_driver_id = auth.uid() AND
      (OLD.status = 'driver_assigned_return' AND NEW.status = 'delivery_in_progress') OR
      (OLD.status = 'delivery_in_progress' AND NEW.status = 'delivered')
    ))
  );

-- APPOINTMENTS TABLE POLICIES

-- Everyone involved can view the appointment
CREATE POLICY view_related_appointments ON appointments
  FOR SELECT
  USING (
    get_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = appointments.service_request_id
      AND (
        sr.customer_id = auth.uid() OR
        sr.pickup_driver_id = auth.uid() OR
        sr.return_driver_id = auth.uid() OR
        sr.shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
      )
    )
  );

-- Shops can create and manage appointments for their own service requests
CREATE POLICY shop_manage_appointments ON appointments
  USING (
    get_role() = 'shop' AND
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = appointments.service_request_id
      AND sr.shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
    )
  );

-- NOTIFICATIONS TABLE POLICIES

-- Users can view and update their own notifications
CREATE POLICY user_manage_own_notifications ON notifications
  USING (user_id = auth.uid() OR get_role() = 'admin');

-- PAYMENTS TABLE POLICIES

-- Customers can view their own payments
CREATE POLICY customer_view_own_payments ON payments
  FOR SELECT
  USING (customer_id = auth.uid() OR get_role() = 'admin');

-- Shops can view payments for their service requests
CREATE POLICY shop_view_own_payments ON payments
  FOR SELECT
  USING (
    get_role() = 'shop' AND
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

-- REVIEWS TABLE POLICIES

-- Everyone can view reviews
CREATE POLICY view_all_reviews ON reviews
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Customers can create and manage their own reviews
CREATE POLICY customer_manage_own_reviews ON reviews
  USING (customer_id = auth.uid() OR get_role() = 'admin');

-- TIME SLOTS POLICIES

-- Everyone can view time slots
CREATE POLICY view_all_time_slots ON time_slots
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Shops can manage their own time slots
CREATE POLICY shop_manage_own_time_slots ON time_slots
  USING (
    get_role() = 'shop' AND
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

-- PAYMENT INTENTS POLICIES

-- Customers can view their own payment intents
CREATE POLICY customer_view_own_payment_intents ON payment_intents
  FOR SELECT
  USING (customer_id = auth.uid() OR get_role() = 'admin'); 