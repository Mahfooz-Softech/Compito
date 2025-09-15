-- Comprehensive fix for all notification issues
-- This script fixes the "column booking_id does not exist" error
-- Run this in your Supabase SQL editor

-- First, let's check what notification functions exist and fix them all
-- Fix the notify_booking_status_changed function
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

-- Now let's check if there are any other notification functions that might be causing issues
-- Let's also verify the create_notification function is working correctly
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, type, title, message, related_id, related_type
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_related_id, p_related_type
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Let's also check if there are any other triggers that might be causing issues
-- Drop and recreate the triggers to ensure they use the updated functions
DROP TRIGGER IF EXISTS trigger_notify_booking_status_changed ON public.bookings;
CREATE TRIGGER trigger_notify_booking_status_changed
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_status_changed();

DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.bookings;
CREATE TRIGGER trigger_notify_new_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_booking();

-- Now the notification system should work correctly:
-- 1. Workers can mark bookings as complete
-- 2. All notifications use correct column references
-- 3. No more "column booking_id does not exist" errors

