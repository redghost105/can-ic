"use client";

import React, { useEffect, useState } from 'react';
import { NotificationType } from '@/contexts/notification-context';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ToastNotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function ToastNotification({
  id,
  type,
  title,
  message,
  duration = 5000, // Default 5 seconds
  onClose
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [startTime] = useState(Date.now());
  const [remainingTime, setRemainingTime] = useState(duration);

  // Handle automatic close after duration
  useEffect(() => {
    if (!isVisible || isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setRemainingTime(remaining);
      
      // Calculate progress percentage
      const newProgress = (remaining / duration) * 100;
      setProgress(newProgress);

      if (remaining <= 0) {
        handleClose();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, isPaused, startTime, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Allow time for exit animation
  };

  const getIcon = () => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle className="h-5 w-5 text-white" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-5 w-5 text-white" />;
      case NotificationType.WARNING:
        return <AlertTriangle className="h-5 w-5 text-white" />;
      case NotificationType.INFO:
      default:
        return <Info className="h-5 w-5 text-white" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case NotificationType.SUCCESS:
        return "bg-green-500";
      case NotificationType.ERROR:
        return "bg-red-500";
      case NotificationType.WARNING:
        return "bg-amber-500";
      case NotificationType.INFO:
      default:
        return "bg-blue-500";
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg shadow-lg max-w-sm mb-4 transform transition-all duration-300",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        getBgColor()
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-4 pr-10">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
            <p className="text-white text-opacity-90 text-sm">{message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 text-white opacity-80 hover:opacity-100 hover:bg-opacity-20"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      {/* Progress bar */}
      <div 
        className="h-1 bg-white bg-opacity-30"
        style={{
          width: `${progress}%`,
          transition: isPaused ? 'none' : 'width 100ms linear',
        }}
      />
    </div>
  );
} 