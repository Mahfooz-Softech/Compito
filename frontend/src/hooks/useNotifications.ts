import { useEffect, useState, useCallback, useRef } from 'react';
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

  // Cache ETags to avoid unnecessary reloads
  const notificationsEtagRef = useRef<string | null>(null);
  const unreadEtagRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = useRef<boolean>(false);

  const fetchNotifications = useCallback(async (filters?: { type?: string; is_read?: boolean }) => {
    try {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);

      const query: any = {};
      if (filters?.type) query.type = filters.type;
      if (typeof filters?.is_read === 'boolean') query.is_read = filters.is_read;

      // Add If-None-Match header if we have an ETag
      const headers: Record<string, string> = {};
      if (notificationsEtagRef.current) headers['If-None-Match'] = notificationsEtagRef.current;

      const { data, error }: any = await apiClient.get('/notifications', query as any);
      if ((data as any)?.headers?.etag) {
        notificationsEtagRef.current = (data as any).headers.etag;
      }

      if (error) throw error;

      if (Array.isArray(data)) {
        // Only update state if changed
        const next = data as AppNotification[];
        const prev = notifications;
        const changed = prev.length !== next.length || prev.some((p, i) => p.id !== next[i]?.id || p.is_read !== next[i]?.is_read);
        if (changed) setNotifications(next);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [notifications]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (unreadEtagRef.current) headers['If-None-Match'] = unreadEtagRef.current;

      const { data, error } = await apiClient.get('/notifications/unread-count');
      if ((data as any)?.headers?.etag) {
        unreadEtagRef.current = (data as any).headers.etag;
      }
      if (error) throw error;

      const next = Number(data) || 0;
      setUnreadCount((prev) => (prev !== next ? next : prev));
    } catch (e) {
      console.error('Error fetching unread count:', e);
    }
  }, []);

  const markAsRead = useCallback(async (id: string, isRead = true) => {
    try {
      const { error } = await apiClient.put(`/notifications/${id}/read`, { is_read: isRead });
      if (error) throw error;
      // Optimistically update local state to avoid immediate refetch flicker
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: isRead } : n)));
      setUnreadCount((prev) => Math.max(0, isRead ? prev - 1 : prev + 1));
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await apiClient.put('/notifications/mark-all-read', {} as any);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Light polling with dedupe; skip if nothing changed recently
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current as any);
    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
      // Only fetch full notifications list when unread count changed (cheap gate)
      // We'll compare in state update; if unchanged, UI won't re-render
      fetchNotifications();
    }, 15000) as any; // 15s polling instead of 5s
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current as any);
    };
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
