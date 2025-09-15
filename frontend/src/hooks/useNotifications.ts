import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../lib/apiClient';
import { Notification, CreateNotificationParams } from '../integrations/supabase/types';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Memoize the user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Fetch notifications for the current user
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get('/notifications', { 
        params: { user_id: userId } 
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const data = response.data || [];
      setNotifications(data);
      const initialUnreadCount = data?.filter(n => !n.is_read).length || 0;
      console.log('useNotifications: initial fetch - unreadCount set to:', initialUnreadCount);
      setUnreadCount(initialUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`, { is_read: true });

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log('useNotifications: markAsRead - unreadCount changed from', prev, 'to', newCount);
        return newCount;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await apiClient.put('/notifications/mark-all-read', { user_id: userId });

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      console.log('useNotifications: markAllAsRead - unreadCount set to 0');
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Create a new notification (for admin use)
  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      await apiClient.post('/notifications', params);
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }, []);

  // Get unread count for a specific user
  const getUnreadCount = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.get('/notifications/unread-count', { params: { user_id: userId } });
      return response.data || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }, []);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [userId, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    getUnreadCount,
    fetchNotifications
  }), [notifications, unreadCount, loading, markAsRead, markAllAsRead, createNotification, getUnreadCount, fetchNotifications]);

  return returnValue;
};
