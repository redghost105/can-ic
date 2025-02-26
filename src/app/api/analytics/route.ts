import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for the analytics data
interface AnalyticsSummary {
  totalRevenue: number;
  totalRequests: number;
  averageRating: number;
  completionRate: number;
  customerSatisfaction: number;
  dailyTrend: number;
  weeklyTrend: number;
}

interface TimeSeriesData {
  name: string;
  value: number;
}

interface ServiceTypeDistribution {
  name: string;
  value: number;
}

interface RatingDistribution {
  name: string;
  value: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  revenueData: TimeSeriesData[];
  requestsData: TimeSeriesData[];
  serviceTypeData: ServiceTypeDistribution[];
  ratingDistribution: RatingDistribution[];
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';
    const shopId = url.searchParams.get('shop_id');
    const driverId = url.searchParams.get('driver_id');

    // In a production environment, you would:
    // 1. Authenticate the user
    // 2. Check permissions based on role
    // 3. Query the database for real analytics data

    // For now, we'll generate mock data based on the parameters
    let analyticsData: AnalyticsResponse;
    
    if (shopId) {
      analyticsData = generateShopAnalytics(shopId, period);
    } else if (driverId) {
      analyticsData = generateDriverAnalytics(driverId, period);
    } else {
      analyticsData = generateBasicAnalytics(period);
    }

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Mock data generators
function generateShopAnalytics(shopId: string, period: string): AnalyticsResponse {
  return {
    summary: {
      totalRevenue: Math.floor(Math.random() * 100000) + 50000,
      totalRequests: Math.floor(Math.random() * 500) + 100,
      averageRating: (Math.random() * 1.5) + 3.5, // Between 3.5 and 5
      completionRate: (Math.random() * 30) + 70, // Between 70% and 100%
      customerSatisfaction: (Math.random() * 20) + 80, // Between 80% and 100%
      dailyTrend: (Math.random() * 20) - 10, // Between -10% and 10%
      weeklyTrend: (Math.random() * 30) - 10, // Between -10% and 20%
    },
    revenueData: generateTimeSeriesData(period, 'revenue', 1000, 5000),
    requestsData: generateTimeSeriesData(period, 'requests', 5, 30),
    serviceTypeData: [
      { name: 'Oil Change', value: Math.floor(Math.random() * 100) + 50 },
      { name: 'Brake Service', value: Math.floor(Math.random() * 80) + 40 },
      { name: 'Tire Replacement', value: Math.floor(Math.random() * 70) + 30 },
      { name: 'Battery Service', value: Math.floor(Math.random() * 60) + 20 },
      { name: 'Other Repairs', value: Math.floor(Math.random() * 50) + 10 },
    ],
    ratingDistribution: [
      { name: '5 Stars', value: Math.floor(Math.random() * 60) + 40 },
      { name: '4 Stars', value: Math.floor(Math.random() * 30) + 20 },
      { name: '3 Stars', value: Math.floor(Math.random() * 15) + 5 },
      { name: '2 Stars', value: Math.floor(Math.random() * 10) + 2 },
      { name: '1 Star', value: Math.floor(Math.random() * 5) + 1 },
    ],
  };
}

function generateDriverAnalytics(driverId: string, period: string): AnalyticsResponse {
  return {
    summary: {
      totalRevenue: Math.floor(Math.random() * 20000) + 5000, // Driver earnings
      totalRequests: Math.floor(Math.random() * 200) + 30, // Completed trips
      averageRating: (Math.random() * 1.5) + 3.5, // Between 3.5 and 5
      completionRate: (Math.random() * 30) + 70, // Between 70% and 100%
      customerSatisfaction: (Math.random() * 20) + 80, // Between 80% and 100%
      dailyTrend: (Math.random() * 20) - 10, // Between -10% and 10%
      weeklyTrend: (Math.random() * 30) - 10, // Between -10% and 20%
    },
    revenueData: generateTimeSeriesData(period, 'revenue', 200, 1000),
    requestsData: generateTimeSeriesData(period, 'requests', 1, 10),
    serviceTypeData: [
      { name: 'Pickup', value: Math.floor(Math.random() * 50) + 25 },
      { name: 'Delivery', value: Math.floor(Math.random() * 50) + 25 },
      { name: 'Round Trip', value: Math.floor(Math.random() * 30) + 10 },
    ],
    ratingDistribution: [
      { name: '5 Stars', value: Math.floor(Math.random() * 30) + 20 },
      { name: '4 Stars', value: Math.floor(Math.random() * 15) + 10 },
      { name: '3 Stars', value: Math.floor(Math.random() * 8) + 2 },
      { name: '2 Stars', value: Math.floor(Math.random() * 5) + 1 },
      { name: '1 Star', value: Math.floor(Math.random() * 3) + 0 },
    ],
  };
}

function generateBasicAnalytics(period: string): AnalyticsResponse {
  return {
    summary: {
      totalRevenue: Math.floor(Math.random() * 50000) + 10000,
      totalRequests: Math.floor(Math.random() * 200) + 50,
      averageRating: (Math.random() * 1.5) + 3.5, // Between 3.5 and 5
      completionRate: (Math.random() * 30) + 70, // Between 70% and 100%
      customerSatisfaction: (Math.random() * 20) + 80, // Between 80% and 100%
      dailyTrend: (Math.random() * 20) - 10, // Between -10% and 10%
      weeklyTrend: (Math.random() * 30) - 10, // Between -10% and 20%
    },
    revenueData: generateTimeSeriesData(period, 'revenue', 500, 2000),
    requestsData: generateTimeSeriesData(period, 'requests', 2, 15),
    serviceTypeData: [
      { name: 'Oil Change', value: Math.floor(Math.random() * 50) + 20 },
      { name: 'Brake Service', value: Math.floor(Math.random() * 40) + 15 },
      { name: 'Tire Replacement', value: Math.floor(Math.random() * 35) + 10 },
      { name: 'Battery Service', value: Math.floor(Math.random() * 30) + 10 },
      { name: 'Other Repairs', value: Math.floor(Math.random() * 25) + 5 },
    ],
    ratingDistribution: [
      { name: '5 Stars', value: Math.floor(Math.random() * 30) + 20 },
      { name: '4 Stars', value: Math.floor(Math.random() * 20) + 10 },
      { name: '3 Stars', value: Math.floor(Math.random() * 10) + 3 },
      { name: '2 Stars', value: Math.floor(Math.random() * 5) + 1 },
      { name: '1 Star', value: Math.floor(Math.random() * 3) + 0 },
    ],
  };
}

function generateTimeSeriesData(period: string, type: string, min: number, max: number): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  let points = 0;
  let format = '';

  switch (period) {
    case 'week':
      points = 7;
      format = 'Day';
      break;
    case 'month':
      points = 30;
      format = 'Day';
      break;
    case 'quarter':
      points = 13;
      format = 'Week';
      break;
    case 'year':
      points = 12;
      format = 'Month';
      break;
    default:
      points = 30;
      format = 'Day';
  }

  for (let i = 1; i <= points; i++) {
    data.push({
      name: `${format} ${i}`,
      value: Math.floor(Math.random() * (max - min)) + min
    });
  }

  return data;
} 