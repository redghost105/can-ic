import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching review:', error);
      return NextResponse.json(
        { error: 'Failed to fetch review' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error fetching review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;
    const { id } = params;
    const requestBody = await request.json();
    
    // Check if the review exists
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching review for update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch review' },
        { status: 500 }
      );
    }
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is authorized to update the review
    if (existingReview.customer_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You are not authorized to update this review' },
        { status: 403 }
      );
    }
    
    // Validate rating if provided
    if (requestBody.rating !== undefined) {
      if (requestBody.rating < 1 || requestBody.rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
    }
    
    // Update the review
    const updateData: Record<string, any> = {};
    if (requestBody.rating !== undefined) updateData.rating = requestBody.rating;
    if (requestBody.comment !== undefined) updateData.comment = requestBody.comment;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;
    const { id } = params;
    
    // Check if the review exists
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching review for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch review' },
        { status: 500 }
      );
    }
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is authorized to delete the review
    if (existingReview.customer_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You are not authorized to delete this review' },
        { status: 403 }
      );
    }
    
    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error deleting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 