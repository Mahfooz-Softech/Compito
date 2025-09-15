import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at?: string;
};

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = useCallback(async (filters?: { type?: string; is_read?: boolean }) => {
    try {
      setLoading(true);
      const query: any = {};
      if (filters?.type) query.type = filters.type;
      if (typeof filters?.is_read === 'boolean') query.is_read = filters.is_read;
      const { data, error } = await apiClient.get('/notifications', query);
      if (error) throw error;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data, error } = await apiClient.get('/notifications/unread-count');
      if (error) throw error;
      setUnreadCount(Number(data) || 0);
    } catch (e) {
      console.error('Error fetching unread count:', e);
    }
  }, []);

  const markAsRead = useCallback(async (id: string, isRead = true) => {
    try {
      const { error } = await apiClient.put(`/notifications/${id}/read`, { is_read: isRead });
      if (error) throw error;
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await apiClient.put('/notifications/mark-all-read', {});
      if (error) throw error;
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Poll periodically for fresh notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    loading,
    notifications,
    unreadCount,
    refetch: fetchNotifications,
    refreshUnread: fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
