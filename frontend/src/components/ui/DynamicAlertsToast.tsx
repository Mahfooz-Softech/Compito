import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Bell } from 'lucide-react';
import { ToastNotification } from '@/components/ui/ToastNotification';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action: string;
  link: string;
}

interface DynamicAlertsToastProps {
  alerts: Alert[];
  isVisible: boolean;
  onClose: () => void;
}

export const DynamicAlertsToast: React.FC<DynamicAlertsToastProps> = ({
  alerts,
  isVisible,
  onClose
}) => {
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [showCurrentAlert, setShowCurrentAlert] = useState(false);

  useEffect(() => {
    if (isVisible && alerts.length > 0) {
      setCurrentAlertIndex(0);
      setShowCurrentAlert(true);
      
      const showNextAlert = (index: number) => {
        if (index < alerts.length) {
          setCurrentAlertIndex(index);
          setShowCurrentAlert(true);
          
          setTimeout(() => {
            setShowCurrentAlert(false);
            setTimeout(() => {
              if (index + 1 < alerts.length) {
                showNextAlert(index + 1);
              } else {
                onClose();
              }
            }, 300); // Wait for fade out animation
          }, 3000); // Show each alert for 3 seconds
        } else {
          onClose();
        }
      };
      
      showNextAlert(0);
    }
  }, [isVisible, alerts, onClose]);

  if (!isVisible || alerts.length === 0) return null;

  const currentAlert = alerts[currentAlertIndex];

  const getAlertType = (type: string) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <ToastNotification
      isVisible={showCurrentAlert}
      onClose={() => setShowCurrentAlert(false)}
      duration={3000} // 3 seconds
      type={getAlertType(currentAlert.type)}
      position={1}
      timelineColor="bg-purple-300"
      className="mb-8"
    >
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentAlert.type === 'error' ? 'bg-destructive/20' :
          currentAlert.type === 'warning' ? 'bg-warning/20' :
          currentAlert.type === 'success' ? 'bg-success/20' :
          'bg-primary/20'
        }`}>
          {currentAlert.type === 'error' ? <AlertCircle className="h-5 w-5 text-destructive" /> :
           currentAlert.type === 'warning' ? <AlertCircle className="h-5 w-5 text-warning" /> :
           currentAlert.type === 'success' ? <CheckCircle className="h-5 w-5 text-success" /> :
           <Bell className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold">{currentAlert.title}</h4>
              <p className="text-sm text-muted-foreground">{currentAlert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentAlertIndex + 1} of {alerts.length}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.href = currentAlert.link}
              className="ml-2 hover:scale-105 transition-transform"
            >
              {currentAlert.action}
            </Button>
          </div>
        </div>
      </div>
    </ToastNotification>
  );
};
