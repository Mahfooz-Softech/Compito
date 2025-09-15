import React, { useState, useEffect } from 'react';
import { ToastNotification } from './ToastNotification';

interface Toast {
  id: string;
  isVisible: boolean;
  onClose: () => void;
  duration: number;
  children: React.ReactNode;
  type?: 'success' | 'warning' | 'error' | 'info';
}

interface ToastManagerProps {
  toasts: Toast[];
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts }) => {
  const [visibleToasts, setVisibleToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setVisibleToasts(toasts.filter(toast => toast.isVisible));
  }, [toasts]);

  return (
    <>
      {visibleToasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          isVisible={toast.isVisible}
          onClose={toast.onClose}
          duration={toast.duration}
          type={toast.type}
          position={index}
        >
          {toast.children}
        </ToastNotification>
      ))}
    </>
  );
};







