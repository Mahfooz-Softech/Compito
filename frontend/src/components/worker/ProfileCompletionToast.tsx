import React from 'react';
import { CheckCircle } from 'lucide-react';
import { ToastNotification } from '@/components/ui/ToastNotification';

interface ProfileCompletionToastProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProfileCompletionToast: React.FC<ProfileCompletionToastProps> = ({
  isVisible,
  onClose
}) => {
  return (
    <ToastNotification
      isVisible={isVisible}
      onClose={onClose}
      duration={3000} // 3 seconds
      type="success"
      position={0}
      timelineColor="bg-green-300"
      className="mb-8"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-success" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-success-800">Profile Complete! 🎉</h4>
          <p className="text-sm text-success-700">
            Great job! Your profile is fully optimized for maximum job opportunities.
          </p>
        </div>
      </div>
    </ToastNotification>
  );
};
