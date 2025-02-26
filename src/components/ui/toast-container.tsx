"use client";

import React, { useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { ToastNotification } from './toast-notification';
import { createPortal } from 'react-dom';

/**
 * Toast Container component to display multiple toast notifications
 * This component should be included once at the root level of the application
 */
export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();
  
  // Use React Portal to render toasts at the root level
  const [mounted, setMounted] = React.useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // If not mounted yet (during SSR), don't render anything
  if (!mounted) return null;
  
  // Return early if there are no toasts
  if (toasts.length === 0) return null;
  
  const container = document.getElementById('toast-container') || document.body;
  
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>,
    container
  );
} 