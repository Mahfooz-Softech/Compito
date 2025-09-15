import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck, MessageSquare, AlertCircle, Info, Clock } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../integrations/supabase/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'service_request_received':
    case 'service_request_updated':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'new_message':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'new_offer':
    case 'offer_response':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'admin_action':
      return <Info className="h-4 w-4 text-purple-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'service_request_received':
    case 'service_request_updated':
      return 'border-l-blue-500 bg-blue-50';
    case 'new_message':
      return 'border-l-green-500 bg-green-50';
    case 'new_offer':
    case 'offer_response':
      return 'border-l-orange-500 bg-orange-50';
    case 'admin_action':
      return 'border-l-purple-500 bg-purple-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.related_id && notification.related_type) {
      // You can implement navigation logic here
      console.log('Navigate to:', notification.related_type, notification.related_id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg sticky top-0 z-10">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Mark all as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List - Enhanced Scrolling with Better UX */}
          <div className="overflow-hidden">
            <ScrollArea className="h-80 w-full scroll-smooth scrollbar-thin" type="always">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-700 mb-1">No notifications yet</p>
                  <p className="text-sm text-gray-500">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:shadow-sm active:scale-[0.98] ${
                          notification.is_read ? 'opacity-75' : ''
                        } ${getNotificationColor(notification.type)} border-l-4`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-2">
                                {notification.is_read ? (
                                  <CheckCheck className="h-4 w-4 text-green-500" />
                                ) : (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                <span>{unreadCount} unread</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
