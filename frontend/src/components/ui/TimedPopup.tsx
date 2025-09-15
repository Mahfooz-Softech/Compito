import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TimedPopupProps {
  isVisible: boolean;
  onClose: () => void;
  duration: number; // in milliseconds
  children: React.ReactNode;
  className?: string;
}

export const TimedPopup: React.FC<TimedPopupProps> = ({
  isVisible,
  onClose,
  duration,
  children,
  className = ''
}) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className={`relative max-w-md w-full shadow-2xl transition-all duration-300 ${
        isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <CardContent className="p-6">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          {children}
        </CardContent>
      </Card>
    </div>
  );
};







