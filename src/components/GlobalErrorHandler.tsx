'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Suppress React DevTools enumeration warnings in development
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      
      console.error = (...args) => {
        // Filter out React DevTools enumeration errors
        const message = args[0];
        if (
          typeof message === 'string' &&
          (message.includes('warnForEnumeration') ||
           message.includes('getAllEnumerableKeys') ||
           message.includes('dehydrate') ||
           message.includes('inspectElement'))
        ) {
          return; // Suppress these specific errors
        }
        
        // Allow other errors to be logged
        originalConsoleError.apply(console, args);
      };

      // Global error handler for unhandled promise rejections
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.warn('Unhandled promise rejection:', event.reason);
        event.preventDefault(); // Prevent the default browser behavior
      };

      // Global error handler for JavaScript errors
      const handleError = (event: ErrorEvent) => {
        // Filter out React DevTools related errors
        if (
          event.message &&
          (event.message.includes('warnForEnumeration') ||
           event.message.includes('getAllEnumerableKeys') ||
           event.message.includes('React DevTools'))
        ) {
          return;
        }
        
        console.warn('Global error caught:', event.error);
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);

      return () => {
        console.error = originalConsoleError;
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
