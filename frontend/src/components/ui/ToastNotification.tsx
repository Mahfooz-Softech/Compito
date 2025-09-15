import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ToastNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  duration: number; // in milliseconds
  children: React.ReactNode;
  className?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  position?: number; // Position in the stack (0, 1, 2, etc.)
  timelineColor?: string; // Custom color for the progress bar
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  isVisible,
  onClose,
  duration,
  children,
  className = '',
  type = 'info',
  position = 0,
  timelineColor
}) => {
  const [progress, setProgress] = useState(100);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      setProgress(100);
      
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (elapsed >= duration) {
          setIsShowing(false);
          setTimeout(() => {
            onClose();
          }, 300); // Wait for fade out animation
        }
      }, 50); // Update progress every 50ms for smooth animation

      return () => clearInterval(interval);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-l-success bg-gradient-to-r from-success/10 to-green-100/50';
      case 'warning':
        return 'border-l-warning bg-gradient-to-r from-warning/10 to-orange-100/50';
      case 'error':
        return 'border-l-destructive bg-gradient-to-r from-destructive/10 to-red-100/50';
      default:
        return 'border-l-primary bg-gradient-to-r from-primary/10 to-blue-100/50';
    }
  };

  return (
    <div className={`fixed right-4 z-50 max-w-md w-full transition-all duration-300 ${
      isShowing ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
    } ${className}`} style={{ top: `${16 + (position * 200)}px` }}>
      <Card className={`border-l-4 shadow-2xl ${getTypeStyles()}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {children}
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      timelineColor || 'bg-primary'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {Math.ceil(progress / 100 * (duration / 1000))}s remaining
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.ceil(progress)}%
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-2 hover:bg-black/10"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
