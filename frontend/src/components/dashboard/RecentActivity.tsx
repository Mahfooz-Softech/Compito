import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  CreditCard, 
  Star, 
  User, 
  Wrench, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import styles from './RecentActivity.module.css';

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'user' | 'service' | 'worker_registration' | 'new_booking' | 'payment_received' | 'new_review';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
    initials: string;
  };
  status?: string;
  amount?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  variant?: 'worker' | 'customer';
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  activities, 
  title = "Recent Activity",
  variant = 'customer'
}) => {
  const getActivityIcon = (type: string) => {
    const iconMap = {
      booking: Calendar,
      payment: CreditCard,
      review: Star,
      user: User,
      service: Wrench,
      worker_registration: User,
      new_booking: Calendar,
      payment_received: CreditCard,
      new_review: Star
    };
    return iconMap[type as keyof typeof iconMap] || Activity;
  };

  const getActivityColor = (type: string) => {
    const colorMap = {
      booking: 'from-blue-500 to-indigo-600',
      payment: 'from-green-500 to-emerald-600',
      review: 'from-yellow-500 to-orange-500',
      user: 'from-purple-500 to-pink-600',
      service: 'from-gray-500 to-slate-600',
      worker_registration: 'from-purple-500 to-pink-600',
      new_booking: 'from-blue-500 to-indigo-600',
      payment_received: 'from-green-500 to-emerald-600',
      new_review: 'from-yellow-500 to-orange-500'
    };
    return colorMap[type as keyof typeof colorMap] || 'from-gray-500 to-slate-600';
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'verified':
      case 'approved':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'processing':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'verified':
      case 'approved':
      case 'success':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
      case 'processing':
      case 'in_progress':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getActivityPriority = (type: string) => {
    const priorityMap = {
      payment: 'high',
      booking: 'medium',
      review: 'low',
      user: 'medium',
      service: 'low',
      worker_registration: 'high',
      new_booking: 'high',
      payment_received: 'high',
      new_review: 'medium'
    };
    return priorityMap[type as keyof typeof priorityMap] || 'low';
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
      <CardHeader className={`pb-4 ${styles.cardHeader}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg ${styles.iconGlow}`}>
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className={`text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${styles.gradientText}`}>
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {variant === 'worker' ? 'Your latest work activities' : 'Your recent interactions'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activities.length > 0 ? (
            <>
              {activities.slice(0, 5).map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const priority = getActivityPriority(activity.type);
                
                return (
                  <div 
                    key={activity.id} 
                    className={`group relative p-4 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] ${styles.activityItem} ${styles.hoverLift} ${
                      priority === 'high' ? 'bg-gradient-to-r from-red-50/50 to-orange-50/50' :
                      priority === 'medium' ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50' :
                      'bg-gradient-to-r from-gray-50/50 to-slate-50/50'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Priority indicator */}
                    {priority === 'high' && (
                      <div className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ${styles.priorityIndicator}`} />
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Icon with gradient background */}
                      <div className={`w-12 h-12 bg-gradient-to-br ${getActivityColor(activity.type)} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title and timestamp */}
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded-full border">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        {/* Bottom row with user, status, and amount */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-3">
                            {activity.user && (
                              <div className="flex items-center space-x-2">
                                <Avatar className={`h-6 w-6 border-2 border-white shadow-sm ${styles.avatarGlow}`}>
                                  <AvatarImage src={activity.user.avatar} />
                                  <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-secondary text-white">
                                    {activity.user.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-gray-700">
                                  {activity.user.name}
                                </span>
                              </div>
                            )}
                            
                            {activity.status && (
                              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)} ${styles.statusBadge}`}>
                                {getStatusIcon(activity.status)}
                                <span className="capitalize">{activity.status}</span>
                              </div>
                            )}
                          </div>
                          
                          {activity.amount && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-bold text-green-700">
                                {activity.amount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Show count indicator if there are more activities */}
              {activities.length > 5 && (
                <div className={`text-center py-4 text-sm text-muted-foreground border-t border-gray-100 ${styles.countIndicator}`}>
                  <div className="inline-flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                    <Activity className="h-4 w-4" />
                    <span>Showing latest 5 of {activities.length} activities</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 text-muted-foreground ${styles.emptyState}`}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-600 mb-2">
                {variant === 'worker' ? 'No activities yet' : 'No recent activity'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {variant === 'worker' 
                  ? 'Your work activities and updates will appear here once you start working'
                  : 'Your recent interactions and updates will appear here once they occur'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};