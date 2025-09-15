-- Targeted fix for the "column booking_id does not exist" error
-- This script specifically addresses the issue preventing workers from marking bookings as complete
-- Run this in your Supabase SQL editor

-- First, let's see what's actually causing the error
-- The issue is likely in the notification functions that are still referencing old column names

-- Let's completely recreate the notification functions with the correct column references
-- Fix the notify_booking_status_changed function - this is the one causing the worker complete error
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
        -- Get names safely
        SELECT COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown User') INTO customer_name
        FROM public.profiles WHERE id = NEW.customer_id;
        
        SELECT COALESCE(CONCAT(first_name, ' ', last_name), 'Unknown User') INTO worker_name
        FROM public.profiles WHERE id = NEW.worker_id;
        
        -- Get service title safely
        IF NEW.service_id IS NOT NULL THEN
            SELECT COALESCE(title, 'service') INTO service_title
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
        
        -- Notify customer - using NEW.id (the booking ID) NOT booking_id
        PERFORM public.create_notification(
            NEW.customer_id,
            'booking_status_changed',
            'Booking Update',
            'Your booking with ' || worker_name || ' for ' || service_title || ' has been ' || status_text,
            NEW.id,  -- This is the correct booking ID reference
            'booking'
        );
        
        -- Notify worker - using NEW.id (the booking ID) NOT booking_id
        PERFORM public.create_notification(
            NEW.worker_id,
            'booking_status_changed',
            'Booking Update',
            'Your booking with ' || customer_name || ' for ' || service_title || ' has been ' || status_text,
            NEW.id,  -- This is the correct booking ID reference
            'booking'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now let's make sure the trigger is using this updated function
-- Drop and recreate the trigger to ensure it uses the fixed function
DROP TRIGGER IF EXISTS trigger_notify_booking_status_changed ON public.bookings;

-- Recreate the trigger with the fixed function
CREATE TRIGGER trigger_notify_booking_status_changed
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_status_changed();

-- Test message to confirm the script ran
SELECT 'Notification functions have been updated successfully. Workers should now be able to mark bookings as complete.' as status;

