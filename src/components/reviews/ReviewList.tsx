"use client";

import React, { useEffect, useState } from 'react';
import { StarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface ReviewListProps {
  serviceRequestId?: string;
  shopId?: string;
  driverId?: string;
  limit?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_id: string;
  service_request_id: string;
  shop_id?: string;
  driver_id?: string;
  updated_at?: string;
  customer?: {
    first_name: string;
    last_name: string;
  };
}

export function ReviewList({ 
  serviceRequestId, 
  shopId, 
  driverId,
  limit = 5
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!serviceRequestId && !shopId && !driverId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const params = new URLSearchParams();
        if (serviceRequestId) params.append('service_request_id', serviceRequestId);
        if (shopId) params.append('shop_id', shopId);
        if (driverId) params.append('driver_id', driverId);
        
        const response = await fetch(`/api/reviews?${params.toString()}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch reviews');
        }
        
        // Get the most recent reviews up to the limit
        const sortedReviews = result.data.slice(0, limit);
        
        // Fetch customer names for each review
        const reviewsWithCustomers = await Promise.all(sortedReviews.map(async (review: Review) => {
          try {
            const customerResponse = await fetch(`/api/users/${review.customer_id}`);
            const customerResult = await customerResponse.json();
            
            if (customerResponse.ok && customerResult.data) {
              return {
                ...review,
                customer: {
                  first_name: customerResult.data.first_name,
                  last_name: customerResult.data.last_name
                }
              };
            }
            
            return review;
          } catch (error) {
            console.error('Error fetching customer details:', error);
            return review;
          }
        }));
        
        setReviews(reviewsWithCustomers);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching reviews');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [serviceRequestId, shopId, driverId, limit]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, starIndex) => (
                  <div key={starIndex} className="h-4 w-4 bg-gray-200 rounded-full"></div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-md">{error}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-gray-500">No reviews available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <Card key={review.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-medium">
                {review.customer 
                  ? `${review.customer.first_name} ${review.customer.last_name.charAt(0)}.` 
                  : 'Anonymous Customer'}
              </CardTitle>
              <span className="text-sm text-gray-500">
                {format(new Date(review.created_at), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <StarIcon 
                  key={starIndex}
                  className={`h-4 w-4 ${
                    starIndex < review.rating 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
          </CardHeader>
          {review.comment && (
            <>
              <Separator />
              <CardContent className="pt-3">
                <p className="text-gray-700">{review.comment}</p>
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );
} 