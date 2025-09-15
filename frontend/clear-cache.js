#!/usr/bin/env node

/**
 * Cache Clearing Script for Development
 * Run this script before starting your development server to clear all caches
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing all caches and service workers...');

// Clear Vite cache directory
const viteCacheDir = path.join(__dirname, 'node_modules', '.vite');
if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log('✅ Vite cache cleared');
}

// Clear custom cache directory
const customCacheDir = path.join(__dirname, '.vite-cache-disabled');
if (fs.existsSync(customCacheDir)) {
  fs.rmSync(customCacheDir, { recursive: true, force: true });
  console.log('✅ Custom cache directory cleared');
}

// Clear browser cache files (if they exist)
const cacheFiles = [
  'sw.js',
  'service-worker.js',
  'workbox-*.js',
  'cache-manifest.json'
];

cacheFiles.forEach(file => {
  const filePath = path.join(__dirname, 'public', file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Cache file removed: ${file}`);
  }
});

// Clear package-lock.json and node_modules (optional - uncomment if needed)
// console.log('⚠️  Removing package-lock.json and node_modules...');
// if (fs.existsSync('package-lock.json')) fs.unlinkSync('package-lock.json');
// if (fs.existsSync('node_modules')) fs.rmSync('node_modules', { recursive: true, force: true });

console.log('🎉 All caches cleared! Now run: npm run dev:no-cache');
console.log('💡 Or use: npm run dev (with the updated Vite config)');






