import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Bell } from 'lucide-react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action: string;
  link: string;
}

interface DynamicAlertsPopupProps {
  alerts: Alert[];
  isVisible: boolean;
  onClose: () => void;
}

export const DynamicAlertsPopup: React.FC<DynamicAlertsPopupProps> = ({
  alerts,
  isVisible,
  onClose
}) => {
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible && alerts.length > 0) {
      setCurrentAlertIndex(0);
      setIsShowing(true);
      
      const showNextAlert = (index: number) => {
        if (index < alerts.length) {
          setCurrentAlertIndex(index);
          setIsShowing(true);
          
          setTimeout(() => {
            setIsShowing(false);
            setTimeout(() => {
              if (index + 1 < alerts.length) {
                showNextAlert(index + 1);
              } else {
                onClose();
              }
            }, 300); // Wait for fade out animation
          }, 2000); // Show each alert for 2 seconds
        } else {
          onClose();
        }
      };
      
      showNextAlert(0);
    }
  }, [isVisible, alerts, onClose]);

  if (!isVisible || alerts.length === 0) return null;

  const currentAlert = alerts[currentAlertIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className={`relative max-w-md w-full shadow-2xl transition-all duration-300 ${
        isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentAlert.type === 'error' ? 'bg-destructive/20' :
                currentAlert.type === 'warning' ? 'bg-warning/20' :
                currentAlert.type === 'success' ? 'bg-success/20' :
                'bg-primary/20'
              }`}>
                {currentAlert.type === 'error' ? <AlertCircle className="h-6 w-6 text-destructive" /> :
                 currentAlert.type === 'warning' ? <AlertCircle className="h-6 w-6 text-warning" /> :
                 currentAlert.type === 'success' ? <CheckCircle className="h-6 w-6 text-success" /> :
                 <Bell className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <h4 className="text-lg font-semibold">{currentAlert.title}</h4>
                <p className="text-sm text-muted-foreground">{currentAlert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentAlertIndex + 1} of {alerts.length}
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = currentAlert.link}
              className="hover:scale-105 transition-transform"
            >
              {currentAlert.action}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};







