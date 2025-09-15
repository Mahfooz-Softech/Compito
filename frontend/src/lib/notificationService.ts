import { supabase } from '../integrations/supabase/client';
import { CreateNotificationParams } from '../integrations/supabase/types';

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendNotification(params: CreateNotificationParams): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: params.user_id,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_related_id: params.related_id || null,
        p_related_type: params.related_type || null
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification when a new profile is created (for admin)
   */
  static async notifyNewProfileCreated(profileId: string, profileData: any): Promise<boolean> {
    try {
      // Get all admin users
      const { data: adminUsers, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_type', 'admin');

      if (error) throw error;

      // Send notification to all admins
      const notifications = adminUsers.map(admin => ({
        user_id: admin.user_id,
        type: 'new_profile_created',
        title: 'New Profile Created',
        message: `A new ${profileData.user_type} profile has been created and needs verification`,
        related_id: profileId,
        related_type: 'profile'
      }));

      // Send notifications in parallel
      const results = await Promise.all(
        notifications.map(notification => this.sendNotification(notification))
      );

      return results.every(result => result === true);
    } catch (error) {
      console.error('Error notifying admins about new profile:', error);
      return false;
    }
  }

  /**
   * Send notification when a service request is created
   */
  static async notifyServiceRequestCreated(
    serviceRequestId: string,
    customerId: string,
    workerId: string,
    serviceId: string
  ): Promise<boolean> {
    try {
      // Get customer and service details
      const [customerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', customerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (customerResult.error || serviceResult.error) {
        throw customerResult.error || serviceResult.error;
      }

      const customerName = `${customerResult.data.first_name} ${customerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      // Notify worker
      return await this.sendNotification({
        user_id: workerId,
        type: 'service_request_received',
        title: 'New Service Request',
        message: `${customerName} has sent you a service request for ${serviceTitle}`,
        related_id: serviceRequestId,
        related_type: 'service_request'
      });
    } catch (error) {
      console.error('Error notifying worker about service request:', error);
      return false;
    }
  }

  /**
   * Send notification when a service request status changes
   */
  static async notifyServiceRequestStatusChanged(
    serviceRequestId: string,
    customerId: string,
    workerId: string,
    serviceId: string,
    newStatus: string,
    oldStatus: string
  ): Promise<boolean> {
    try {
      // Only send notification if status actually changed
      if (newStatus === oldStatus) return true;

      // Get worker and service details
      const [workerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', workerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (workerResult.error || serviceResult.error) {
        throw workerResult.error || serviceResult.error;
      }

      const workerName = `${workerResult.data.first_name} ${workerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      // Set status text based on new status
      let statusText = '';
      switch (newStatus) {
        case 'accepted':
          statusText = 'accepted your service request for';
          break;
        case 'rejected':
          statusText = 'rejected your service request for';
          break;
        case 'in_progress':
          statusText = 'started working on your service request for';
          break;
        case 'completed':
          statusText = 'completed your service request for';
          break;
        default:
          statusText = 'updated your service request for';
      }

      // Notify customer
      return await this.sendNotification({
        user_id: customerId,
        type: 'service_request_updated',
        title: 'Service Request Update',
        message: `${workerName} ${statusText} ${serviceTitle}`,
        related_id: serviceRequestId,
        related_type: 'service_request'
      });
    } catch (error) {
      console.error('Error notifying customer about service request update:', error);
      return false;
    }
  }

  /**
   * Send notification when a new message is sent
   */
  static async notifyNewMessage(
    messageId: string,
    senderId: string,
    receiverId: string
  ): Promise<boolean> {
    try {
      // Get sender details
      const { data: sender, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', senderId)
        .single();

      if (error) throw error;

      const senderName = `${sender.first_name} ${sender.last_name}`;

      // Notify receiver
      return await this.sendNotification({
        user_id: receiverId,
        type: 'new_message',
        title: 'New Message',
        message: `You received a new message from ${senderName}`,
        related_id: messageId,
        related_type: 'message'
      });
    } catch (error) {
      console.error('Error notifying about new message:', error);
      return false;
    }
  }

  /**
   * Send notification when a new offer is created
   */
  static async notifyNewOffer(
    offerId: string,
    workerId: string,
    customerId: string,
    serviceId: string
  ): Promise<boolean> {
    try {
      // Get worker and service details
      const [workerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', workerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (workerResult.error || serviceResult.error) {
        throw workerResult.error || serviceResult.error;
      }

      const workerName = `${workerResult.data.first_name} ${workerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      // Notify customer
      return await this.sendNotification({
        user_id: customerId,
        type: 'new_offer',
        title: 'New Offer Received',
        message: `${workerName} has sent you an offer for ${serviceTitle}`,
        related_id: offerId,
        related_type: 'offer'
      });
    } catch (error) {
      console.error('Error notifying customer about new offer:', error);
      return false;
    }
  }

  /**
   * Send notification when an offer is accepted/rejected
   */
  static async notifyOfferResponse(
    offerId: string,
    customerId: string,
    workerId: string,
    serviceId: string,
    newStatus: string
  ): Promise<boolean> {
    try {
      // Only send notification for accepted/rejected offers
      if (!['accepted', 'rejected'].includes(newStatus)) return true;

      // Get customer and service details
      const [customerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', customerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (customerResult.error || serviceResult.error) {
        throw customerResult.error || serviceResult.error;
      }

      const customerName = `${customerResult.data.first_name} ${customerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      const responseText = newStatus === 'accepted' 
        ? 'accepted your offer for' 
        : 'rejected your offer for';

      // Notify worker
      return await this.sendNotification({
        user_id: workerId,
        type: 'offer_response',
        title: 'Offer Response',
        message: `${customerName} ${responseText} ${serviceTitle}`,
        related_id: offerId,
        related_type: 'offer'
      });
    } catch (error) {
      console.error('Error notifying worker about offer response:', error);
      return false;
    }
  }

  /**
   * Send notification when admin takes action on a user account
   */
  static async notifyAdminAction(
    userId: string,
    actionType: string,
    details: string
  ): Promise<boolean> {
    try {
      return await this.sendNotification({
        user_id: userId,
        type: 'admin_action',
        title: 'Account Update',
        message: `Your account has been updated by an administrator: ${details}`,
        related_id: userId,
        related_type: 'admin_action'
      });
    } catch (error) {
      console.error('Error notifying user about admin action:', error);
      return false;
    }
  }

  /**
   * Send notification when a profile verification status changes
   */
  static async notifyProfileVerificationStatus(
    userId: string,
    isVerified: boolean
  ): Promise<boolean> {
    try {
      const status = isVerified ? 'verified' : 'unverified';
      const message = isVerified 
        ? 'Your profile has been verified by an administrator'
        : 'Your profile verification has been revoked by an administrator';

      return await this.sendNotification({
        user_id: userId,
        type: 'profile_verification',
        title: 'Profile Verification Update',
        message,
        related_id: userId,
        related_type: 'profile'
      });
    } catch (error) {
      console.error('Error notifying user about verification status:', error);
      return false;
    }
  }

  /**
   * Send notification when a new review is posted
   */
  static async notifyNewReview(
    reviewId: string,
    reviewerId: string,
    reviewedUserId: string,
    serviceId: string
  ): Promise<boolean> {
    try {
      // Get reviewer and service details
      const [reviewerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', reviewerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (reviewerResult.error || serviceResult.error) {
        throw reviewerResult.error || serviceResult.error;
      }

      const reviewerName = `${reviewerResult.data.first_name} ${reviewerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      // Notify reviewed user
      return await this.sendNotification({
        user_id: reviewedUserId,
        type: 'new_review',
        title: 'New Review Received',
        message: `${reviewerName} has posted a review for ${serviceTitle}`,
        related_id: reviewId,
        related_type: 'review'
      });
    } catch (error) {
      console.error('Error notifying about new review:', error);
      return false;
    }
  }

  /**
   * Send notification when a new booking is created
   */
  static async notifyNewBooking(
    bookingId: string,
    customerId: string,
    workerId: string,
    serviceId: string
  ): Promise<boolean> {
    try {
      // Get customer, worker, and service details
      const [customerResult, workerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', customerId)
          .single(),
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', workerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (customerResult.error || workerResult.error || serviceResult.error) {
        throw customerResult.error || workerResult.error || serviceResult.error;
      }

      const customerName = `${customerResult.data.first_name} ${customerResult.data.last_name}`;
      const workerName = `${workerResult.data.first_name} ${workerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      // Notify all admins
      const { data: adminUsers, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_type', 'admin');

      if (error) throw error;

      // Send notifications to all admins
      const notifications = adminUsers.map(admin => ({
        user_id: admin.user_id,
        type: 'new_booking',
        title: 'New Booking Created',
        message: `${customerName} has booked ${workerName} for ${serviceTitle}`,
        related_id: bookingId,
        related_type: 'booking'
      }));

      // Send notifications in parallel
      const results = await Promise.all(
        notifications.map(notification => this.sendNotification(notification))
      );

      return results.every(result => result === true);
    } catch (error) {
      console.error('Error notifying admins about new booking:', error);
      return false;
    }
  }

  /**
   * Send notification when a booking status changes
   */
  static async notifyBookingStatusChanged(
    bookingId: string,
    customerId: string,
    workerId: string,
    serviceId: string,
    newStatus: string,
    oldStatus: string
  ): Promise<boolean> {
    try {
      // Only send notification if status actually changed
      if (newStatus === oldStatus) return true;

      // Get customer, worker, and service details
      const [customerResult, workerResult, serviceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', customerId)
          .single(),
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', workerId)
          .single(),
        supabase
          .from('services')
          .select('title')
          .eq('id', serviceId)
          .single()
      ]);

      if (customerResult.error || workerResult.error || serviceResult.error) {
        throw customerResult.error || workerResult.error || serviceResult.error;
      }

      const customerName = `${customerResult.data.first_name} ${customerResult.data.last_name}`;
      const workerName = `${workerResult.data.first_name} ${workerResult.data.last_name}`;
      const serviceTitle = serviceResult.data.title;

      // Set status text based on new status
      let statusText = '';
      switch (newStatus) {
        case 'confirmed':
          statusText = 'confirmed';
          break;
        case 'in_progress':
          statusText = 'started';
          break;
        case 'completed':
          statusText = 'completed';
          break;
        case 'cancelled':
          statusText = 'cancelled';
          break;
        default:
          statusText = 'updated';
      }

      // Notify customer
      const customerNotification = await this.sendNotification({
        user_id: customerId,
        type: 'booking_status_changed',
        title: 'Booking Update',
        message: `Your booking with ${workerName} for ${serviceTitle} has been ${statusText}`,
        related_id: bookingId,
        related_type: 'booking'
      });

      // Notify worker
      const workerNotification = await this.sendNotification({
        user_id: workerId,
        type: 'booking_status_changed',
        title: 'Booking Update',
        message: `Your booking with ${customerName} for ${serviceTitle} has been ${statusText}`,
        related_id: bookingId,
        related_type: 'booking'
      });

      return customerNotification && workerNotification;
    } catch (error) {
      console.error('Error notifying about booking status change:', error);
      return false;
    }
  }
}
