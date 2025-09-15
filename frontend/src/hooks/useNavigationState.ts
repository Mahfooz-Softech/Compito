import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationState {
  lastPath: string;
  timestamp: number;
}

export const useNavigationState = () => {
  const location = useLocation();
  const navigationStateRef = useRef<NavigationState>({
    lastPath: '',
    timestamp: Date.now()
  });

  useEffect(() => {
    const currentPath = location.pathname;
    const lastPath = navigationStateRef.current.lastPath;
    
    // If we're navigating to a different path, update the state
    if (currentPath !== lastPath) {
      // Only update if we're actually navigating to a different route
      // This prevents unnecessary updates on component re-renders
      navigationStateRef.current = {
        lastPath: currentPath,
        timestamp: Date.now()
      };
      console.log('Navigation state updated:', { from: lastPath, to: currentPath });
    }
  }, [location.pathname]);

  const getNavigationState = () => navigationStateRef.current;
  
  const isReturningToDashboard = (dashboardPath: string) => {
    const state = navigationStateRef.current;
    return state.lastPath === dashboardPath && 
           (Date.now() - state.timestamp) < 5 * 60 * 1000; // 5 minutes
  };

  return {
    getNavigationState,
    isReturningToDashboard
  };
};
