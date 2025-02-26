"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { StarIcon } from 'lucide-react';

interface ReviewFormProps {
  serviceRequestId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ serviceRequestId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleRatingHover = (hoveredRating: number) => {
    setHoveredRating(hoveredRating);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting your review.",
        variant: "error",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_request_id: serviceRequestId,
          rating,
          comment,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }
      
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
        variant: "success",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/service-requests');
      }
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred while submitting your review',
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Your Rating</h3>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => handleRatingHover(star)}
              onMouseLeave={handleRatingLeave}
              className="text-2xl focus:outline-none"
            >
              <StarIcon 
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          {rating > 0 ? `You selected ${rating} star${rating > 1 ? 's' : ''}` : 'Click to rate'}
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="comment" className="block text-lg font-medium">
          Your Comments (Optional)
        </label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this service..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          className="w-full"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
} 