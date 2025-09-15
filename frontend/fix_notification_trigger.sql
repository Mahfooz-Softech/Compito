-- Fix the notify_new_booking function to properly handle admin notifications
-- Run this in your Supabase SQL editor

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.bookings;

-- Recreate the notify_new_booking function with the correct syntax
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
    
    -- Get service title
    SELECT title INTO service_title
    FROM public.services WHERE id = NEW.service_id;
    
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

-- Recreate the trigger
CREATE TRIGGER trigger_notify_new_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_booking();

