import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET handler for retrieving average ratings
 * Can get average rating by shop_id, driver_id, or service_request_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const driverId = searchParams.get('driver_id');
    
    if (!shopId && !driverId) {
      return NextResponse.json(
        { error: 'Missing required parameter: shop_id or driver_id' },
        { status: 400 }
      );
    }
    
    let query = supabase.from('reviews').select('rating');
    
    if (shopId) {
      query = query.eq('shop_id', shopId);
    } else if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching reviews for ratings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      });
    }
    
    // Calculate average rating
    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / data.length;
    
    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    data.forEach(review => {
      ratingDistribution[review.rating as 1|2|3|4|5]++;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: data.length,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Unexpected error calculating ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 