"use client";

import { useEffect, useState } from 'react';
import { fetchRequestTimeline } from '@/lib/data-fetchers';
import { formatDate, formatTime } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface StatusUpdate {
  id: string;
  timestamp: string;
  status: string;
  message: string;
  created_by: {
    id: string;
    name: string;
    role: string;
  };
}

export default function RequestStatusTimeline({ requestId }: { requestId: string }) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const data = await fetchRequestTimeline(requestId);
        setUpdates(data);
      } catch (err) {
        console.error('Failed to load status timeline:', err);
        setError('Failed to load status updates');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTimeline();
  }, [requestId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }
  
  if (updates.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>No status updates yet</p>
      </div>
    );
  }
  
  // Get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };
  
  return (
    <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:h-full before:w-[2px] before:bg-gray-200 before:ml-3.5">
      {updates.map((update, index) => (
        <div key={update.id} className="relative">
          <div className="absolute -left-8 mt-1.5 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center border border-gray-200">
              {getStatusIcon(update.status)}
            </div>
          </div>
          
          <div className="mb-1">
            <h4 className="font-medium">{update.status.charAt(0).toUpperCase() + update.status.slice(1)}</h4>
            <div className="text-sm text-gray-500">
              {formatDate(update.timestamp)}, {formatTime(update.timestamp)} by {update.created_by.name}
            </div>
          </div>
          
          {update.message && (
            <p className="text-gray-600 mt-1">{update.message}</p>
          )}
        </div>
      ))}
    </div>
  );
} 