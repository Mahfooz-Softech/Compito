
import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Search, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'admin' | 'customer' | 'worker';
  title?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userType,
  title
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // Memoize the sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut, navigate]);

  // Memoize the settings handler
  const handleSettings = useCallback(() => {
    switch (userType) {
      case 'admin':
        navigate('/admin/settings');
        break;
      case 'worker':
        navigate('/worker/settings');
        break;
      case 'customer':
        navigate('/customer/settings');
        break;
      default:
        navigate('/');
    }
  }, [userType, navigate]);

  // Memoize the sidebar toggle handler
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Memoize user display information
  const userDisplayInfo = useMemo(() => {
    const firstName = userProfile?.first_name;
    const lastName = userProfile?.last_name;
    const email = user?.email;
    
    return {
      displayName: firstName && lastName ? `${firstName} ${lastName}` : email?.split('@')[0] || 'User',
      email: email || '',
      initials: firstName && lastName ? `${firstName[0]}${lastName[0]}` : email?.[0]?.toUpperCase() || 'U'
    };
  }, [userProfile?.first_name, userProfile?.last_name, user?.email]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userType={userType} isCollapsed={sidebarCollapsed} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSidebarToggle}
                className="hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
            </div>
            
            <div className="flex items-center space-x-4">
          
              
              {/* Notifications */}
              <NotificationCenter />
              
              {/* User Avatar with Name and Email */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-foreground">
                        {userDisplayInfo.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userDisplayInfo.email}
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-[hsl(274,83%,62%)] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {userDisplayInfo.initials}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 hover:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
