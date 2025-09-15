import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Disable service workers completely but gently
if ('serviceWorker' in navigator) {
  // Unregister all existing service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered:', registration);
    }
  });
  
  // Block future service worker registrations gently
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function() {
    console.warn('Service Worker registration blocked');
    return Promise.reject(new Error('Service Worker registration blocked'));
  };
}

createRoot(document.getElementById("root")!).render(<App />);
