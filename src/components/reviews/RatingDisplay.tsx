"use client";

import React, { useEffect, useState } from 'react';
import { StarIcon } from 'lucide-react';

interface RatingDisplayProps {
  shopId?: string;
  driverId?: string;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

interface RatingData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function RatingDisplay({ 
  shopId, 
  driverId, 
  size = 'medium',
  showCount = true
}: RatingDisplayProps) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!shopId && !driverId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const params = new URLSearchParams();
        if (shopId) params.append('shop_id', shopId);
        if (driverId) params.append('driver_id', driverId);
        
        const response = await fetch(`/api/reviews/ratings?${params.toString()}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch ratings');
        }
        
        setRatingData(result.data);
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching ratings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRatings();
  }, [shopId, driverId]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1 animate-pulse">
        {[1, 2, 3, 4, 5].map((star) => (
          <div 
            key={star} 
            className={`bg-gray-200 rounded-full ${getSizeClass(size).star}`}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500">Error loading ratings</div>;
  }

  if (!ratingData) {
    return <div className="text-sm text-gray-500">No ratings available</div>;
  }
  
  const fullStars = Math.floor(ratingData.averageRating);
  const hasHalfStar = ratingData.averageRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  const { star, container, text } = getSizeClass(size);

  return (
    <div className={`flex items-center ${container}`}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <StarIcon 
            key={`full-${index}`} 
            className={`${star} text-yellow-400 fill-yellow-400`} 
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <StarIcon className={`${star} text-gray-300`} />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <StarIcon className={`${star} text-yellow-400 fill-yellow-400`} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <StarIcon 
            key={`empty-${index}`} 
            className={`${star} text-gray-300`} 
          />
        ))}
      </div>
      
      {showCount && (
        <span className={`ml-2 text-gray-600 ${text}`}>
          {ratingData.averageRating.toFixed(1)} ({ratingData.totalReviews})
        </span>
      )}
    </div>
  );
}

function getSizeClass(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        star: 'h-4 w-4',
        container: 'text-xs',
        text: 'text-xs'
      };
    case 'large':
      return {
        star: 'h-8 w-8',
        container: 'text-lg',
        text: 'text-lg'
      };
    case 'medium':
    default:
      return {
        star: 'h-6 w-6',
        container: 'text-base',
        text: 'text-sm'
      };
  }
} 