
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Home,
  Users,
  Briefcase,
  Settings,
  BarChart3,
  DollarSign,
  Shield,
  MessageSquare,
  Calendar,
  Star,
  User,
  Clock,
  CreditCard,
  LogOut,
  Search,
  MapPin,
  FileText,
  UserCheck,
  Award,
  TrendingUp,
  Handshake,
  Bell,
  Filter,
  ConciergeBell,
} from 'lucide-react';

interface SidebarProps {
  userType: 'admin' | 'customer' | 'worker';
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ userType, isCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [dynamicData, setDynamicData] = useState({
    unreadMessages: 0,
    activeBookings: 0,
    pendingRequests: 0,
    pendingOffers: 0,
    unreadNotifications: 0
  });
  
  useEffect(() => {
    if (user) {
      fetchDynamicData();
    }
  }, [user]);

  // Update notification count when it changes
  useEffect(() => {
    // console.log('Sidebar: unreadCount changed to:', unreadCount);
    setDynamicData(prev => {
      const newData = {
        ...prev,
        unreadNotifications: unreadCount
      };
      // console.log('Sidebar: dynamicData updated:', newData);
      return newData;
    });
  }, [unreadCount]);

  const fetchDynamicData = async () => {
    if (!user) return;

    try {
      // Fetch unread messages
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Fetch active bookings based on user type
      let activeBookingsQuery = supabase
        .from('bookings')
        .select('id');

      if (userType === 'customer') {
        activeBookingsQuery = activeBookingsQuery
          .eq('customer_id', user.id)
          .in('status', ['pending_payment', 'confirmed', 'in_progress', 'worker_completed']);
      } else if (userType === 'worker') {
        activeBookingsQuery = activeBookingsQuery
          .eq('worker_id', user.id)
          .in('status', ['confirmed', 'in_progress']);
      }

      const { data: activeBookings } = await activeBookingsQuery;

      // Fetch pending service requests for workers
      let pendingRequests = 0;
      if (userType === 'worker') {
        const { data: requests } = await supabase
          .from('service_requests')
          .select('id')
          .eq('worker_id', user.id)
          .eq('status', 'pending');
        pendingRequests = requests?.length || 0;
      }

      // Fetch pending offers based on user type
      let pendingOffers = 0;
      if (userType === 'worker') {
        const { data: offers } = await supabase
          .from('offers')
          .select('id')
          .eq('worker_id', user.id)
          .eq('status', 'pending');
        pendingOffers = offers?.length || 0;
      } else if (userType === 'customer') {
        const { data: offers } = await supabase
          .from('offers')
          .select('id')
          .eq('customer_id', user.id)
          .eq('status', 'pending');
        pendingOffers = offers?.length || 0;
      }

      // Fetch pending activation requests for admins
      if (userType === 'admin') {
        try {
          const response = await apiClient.get('/account-activation-requests?status=pending');
          if (!response.error) {
            pendingRequests = Array.isArray(response.data) ? response.data.length : 0;
          }
        } catch (error) {
          console.error('Error fetching activation requests:', error);
        }
      }

      const newDynamicData = {
        unreadMessages: unreadMessages?.length || 0,
        activeBookings: activeBookings?.length || 0,
        pendingRequests,
        pendingOffers,
        unreadNotifications: unreadCount
      };
      // console.log('Sidebar: fetchDynamicData setting dynamicData to:', newDynamicData);
      setDynamicData(newDynamicData);
    } catch (error) {
      console.error('Error fetching dynamic sidebar data:', error);
    }
  };
  
  const getNavItems = () => {
    switch (userType) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin', icon: Home },
          // { name: 'Users', href: '/admin/users', icon: Users },
          { name: 'Workers', href: '/admin/workers', icon: UserCheck },
          { name: 'Worker Accounts', href: '/admin/worker-accounts', icon: Shield },
          { name: 'Activation Requests', href: '/admin/activation-requests', icon: UserCheck, badge: dynamicData.pendingRequests },
          { name: 'Services', href: '/admin/services', icon: Briefcase },
          { name: 'Services Categories', href: '/admin/categories', icon: Filter },
          { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
          { name: 'Payments', href: '/admin/payments', icon: CreditCard },
          { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
          { name: 'Customers', href: '/admin/customers', icon: Users },
          // { name: 'Notifications', href: '/admin/notifications', icon: Bell, badge: dynamicData.unreadNotifications },
          { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Reports', href: '/admin/reports', icon: FileText },
          { name: 'Other Managements', href: '/admin/other-things', icon: ConciergeBell  },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ];
      case 'customer':
        return [
          { name: 'Dashboard', href: '/customer', icon: Home },
          { name: 'Browse Services', href: '/customer/browse', icon: Search },
          { name: 'My Bookings', href: '/customer/bookings', icon: Calendar, badge: dynamicData.activeBookings },
          { name: 'Service Offers', href: '/customer/offers', icon: Handshake, badge: dynamicData.pendingOffers },
          { name: 'Conversation', href: '/customer/messages', icon: MessageSquare, badge: dynamicData.unreadMessages },
          { name: 'Payments', href: '/customer/payments', icon: CreditCard },
          { name: 'Reviews', href: '/customer/reviews', icon: MessageSquare },
          { name: 'Profile', href: '/customer/profile', icon: User },
          { name: 'Settings', href: '/customer/settings', icon: Settings },
        ];
      case 'worker':
        return [
          { name: 'Dashboard', href: '/worker', icon: Home },
          { name: 'My Services', href: '/worker/services', icon: Briefcase },
          { name: 'Bookings', href: '/worker/bookings', icon: Calendar, badge: dynamicData.activeBookings },
          { name: 'My Offers', href: '/worker/offers', icon: Handshake, badge: dynamicData.pendingOffers },
          { name: 'Schedule', href: '/worker/schedule', icon: Clock },
          { name: 'Earnings', href: '/worker/earnings', icon: DollarSign },
          { name: 'Reviews', href: '/worker/reviews', icon: Star },
          { name: 'Conversation', href: '/worker/messages', icon: MessageSquare, badge: dynamicData.unreadMessages },
          { name: 'Service Requests', href: '/worker/requests', icon: FileText, badge: dynamicData.pendingRequests },
          { name: 'Analytics', href: '/worker/analytics', icon: TrendingUp },
          { name: 'Settings', href: '/worker/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={cn(
      "bg-white border-r border-border flex flex-col h-full transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-[hsl(255,85%,62%)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-foreground">Compito</h1>
              <p className="text-xs text-muted-foreground capitalize">{userType} Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left relative",
                active 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                isCollapsed ? "justify-center space-x-0" : "space-x-3"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "")} />
              {!isCollapsed && (
                <>
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 ? (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto rounded-full text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center animate-pulse"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  ):""}
                </>
              )}
              {isCollapsed && item.badge && item.badge > 0 ? (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 rounded-full text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center animate-pulse"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              ):""}
            </button>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={handleSignOut}
          className={cn(
            "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium w-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200",
            isCollapsed ? "justify-center space-x-0" : "space-x-3"
          )}
        >
          <LogOut className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "")} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};
