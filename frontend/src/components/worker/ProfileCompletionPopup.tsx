import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ProfileCompletionPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProfileCompletionPopup: React.FC<ProfileCompletionPopupProps> = ({
  isVisible,
  onClose
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
      }, 5000); // Show for 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative max-w-md w-full bg-white rounded-lg shadow-2xl p-6 border-l-4 border-l-success transition-all duration-300 ${
        isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-success-800">Profile Complete! 🎉</h4>
            <p className="text-sm text-success-700">
              Great job! Your profile is fully optimized for maximum job opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
