#!/usr/bin/env node

/**
 * Storage Clearing Script
 * Run this in the browser console to clear storage manually
 */

console.log('🧹 Clearing storage manually...');

// Function to clear all storage
function clearAllStorage() {
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
    console.log('✅ localStorage cleared');
  }
  
  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  }
  
  // Clear caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
        console.log('✅ Cache cleared:', name);
      }
    });
  }
  
  // Clear IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases().then(function(databases) {
      databases.forEach(function(db) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log('✅ IndexedDB cleared:', db.name);
        }
      });
    });
  }
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
        console.log('✅ Service Worker unregistered:', registration);
      }
    });
  }
  
  console.log('🎉 All storage cleared successfully!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.clearAllStorage = clearAllStorage;
  console.log('💡 Run clearAllStorage() in console to clear storage');
}

// Run if called directly
if (typeof require !== 'undefined') {
  clearAllStorage();
}






