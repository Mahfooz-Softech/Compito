-- Fix the notification functions to work with the correct column names
-- Run this in your Supabase SQL editor to fix the notification issues

-- Fix the notify_booking_status_changed function
-- The issue was that it was trying to reference non-existent columns
CREATE OR REPLACE FUNCTION public.notify_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    worker_name TEXT;
    service_title TEXT;
    status_text TEXT;
BEGIN
    -- Only trigger on status changes
    IF NEW.status != OLD.status THEN
        -- Get names
        SELECT CONCAT(first_name, ' ', last_name) INTO customer_name
        FROM public.profiles WHERE id = NEW.customer_id;
        
        SELECT CONCAT(first_name, ' ', last_name) INTO worker_name
        FROM public.profiles WHERE id = NEW.worker_id;
        
        -- Get service title (handle null service_id gracefully)
        IF NEW.service_id IS NOT NULL THEN
            SELECT title INTO service_title
            FROM public.services WHERE id = NEW.service_id;
        ELSE
            service_title := 'service';
        END IF;
        
        -- Set status text
        CASE NEW.status
            WHEN 'confirmed' THEN status_text := 'confirmed';
            WHEN 'in_progress' THEN status_text := 'started';
            WHEN 'worker_completed' THEN status_text := 'marked as complete by worker';
            WHEN 'completed' THEN status_text := 'completed';
            WHEN 'cancelled' THEN status_text := 'cancelled';
            ELSE status_text := 'updated';
        END CASE;
        
        -- Notify customer
        PERFORM public.create_notification(
            NEW.customer_id,
            'booking_status_changed',
            'Booking Update',
            'Your booking with ' || worker_name || ' for ' || service_title || ' has been ' || status_text,
            NEW.id,
            'booking'
        );
        
        -- Notify worker
        PERFORM public.create_notification(
            NEW.worker_id,
            'booking_status_changed',
            'Booking Update',
            'Your booking with ' || customer_name || ' for ' || service_title || ' has been ' || status_text,
            NEW.id,
            'booking'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the notify_new_booking function
-- The issue was with the SQL syntax for admin notifications
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    worker_name TEXT;
    service_title TEXT;
    admin_id UUID;
BEGIN
    -- Get customer and worker names
    SELECT CONCAT(first_name, ' ', last_name) INTO customer_name
    FROM public.profiles WHERE id = NEW.customer_id;
    
    SELECT CONCAT(first_name, ' ', last_name) INTO worker_name
    FROM public.profiles WHERE id = NEW.worker_id;
    
    -- Get service title (handle null service_id gracefully)
    IF NEW.service_id IS NOT NULL THEN
        SELECT title INTO service_title
        FROM public.services WHERE id = NEW.service_id;
    ELSE
        service_title := 'service';
    END IF;
    
    -- Notify all admins about new booking
    FOR admin_id IN 
        SELECT id FROM public.profiles WHERE user_type = 'admin'
    LOOP
        PERFORM public.create_notification(
            admin_id,
            'new_booking',
            'New Booking Created',
            customer_name || ' has booked ' || worker_name || ' for ' || service_title,
            NEW.id,
            'booking'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now both functions should work correctly:
-- 1. Workers can mark bookings as complete
-- 2. Customers get notified about status changes
-- 3. Workers get notified about status changes
-- 4. Admins get notified about new bookings
-- 5. All notifications use the correct column references

