"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Car, 
  Wrench, 
  CircleDollarSign,
  Calendar
} from 'lucide-react';

// Types for the analytics data
interface AnalyticsSummary {
  totalRevenue: number;
  totalRequests: number;
  averageRating: number;
  completionRate: number;
  customerSatisfaction: number;
  dailyTrend: number; // Positive or negative percentage
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

// Types for chart components
interface PieChartLabelProps {
  name: string;
  percent: number;
}

// Mock recharts types if the module is not found
// Real implementation would import these from recharts
type TooltipFormatterResult = [string, string];
type PieChartLabelFunction = (props: PieChartLabelProps) => string;

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueData, setRevenueData] = useState<TimeSeriesData[]>([]);
  const [requestsData, setRequestsData] = useState<TimeSeriesData[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<ServiceTypeDistribution[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load analytics data based on user role and selected timeframe
    fetchAnalyticsData(timeframe);
  }, [user, timeframe, router]);

  const fetchAnalyticsData = async (period: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your backend API
      // const response = await fetch(`/api/analytics?period=${period}`);
      // const data = await response.json();
      
      // For now, we'll use mock data
      setTimeout(() => {
        // Generate mock data
        const mockSummary = generateMockSummary();
        const mockRevenueData = generateMockTimeSeriesData(period, 'revenue');
        const mockRequestsData = generateMockTimeSeriesData(period, 'requests');
        const mockServiceTypeData = generateMockServiceTypeData();
        const mockRatingDistribution = generateMockRatingDistribution();
        
        setSummary(mockSummary);
        setRevenueData(mockRevenueData);
        setRequestsData(mockRequestsData);
        setServiceTypeData(mockServiceTypeData);
        setRatingDistribution(mockRatingDistribution);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Mock data generators
  const generateMockSummary = (): AnalyticsSummary => {
    return {
      totalRevenue: Math.floor(Math.random() * 100000) + 50000,
      totalRequests: Math.floor(Math.random() * 500) + 100,
      averageRating: (Math.random() * 1.5) + 3.5, // Between 3.5 and 5
      completionRate: (Math.random() * 30) + 70, // Between 70% and 100%
      customerSatisfaction: (Math.random() * 20) + 80, // Between 80% and 100%
      dailyTrend: (Math.random() * 20) - 10, // Between -10% and 10%
      weeklyTrend: (Math.random() * 30) - 10, // Between -10% and 20%
    };
  };

  const generateMockTimeSeriesData = (period: string, type: 'revenue' | 'requests'): TimeSeriesData[] => {
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

    const getValueRange = () => {
      if (type === 'revenue') {
        return { min: 1000, max: 5000 };
      } else {
        return { min: 5, max: 30 };
      }
    };

    const { min, max } = getValueRange();

    for (let i = 1; i <= points; i++) {
      data.push({
        name: `${format} ${i}`,
        value: Math.floor(Math.random() * (max - min)) + min
      });
    }

    return data;
  };

  const generateMockServiceTypeData = (): ServiceTypeDistribution[] => {
    return [
      { name: 'Oil Change', value: Math.floor(Math.random() * 100) + 50 },
      { name: 'Brake Service', value: Math.floor(Math.random() * 80) + 40 },
      { name: 'Tire Replacement', value: Math.floor(Math.random() * 70) + 30 },
      { name: 'Battery Service', value: Math.floor(Math.random() * 60) + 20 },
      { name: 'Other Repairs', value: Math.floor(Math.random() * 50) + 10 },
    ];
  };

  const generateMockRatingDistribution = (): RatingDistribution[] => {
    return [
      { name: '5 Stars', value: Math.floor(Math.random() * 60) + 40 },
      { name: '4 Stars', value: Math.floor(Math.random() * 30) + 20 },
      { name: '3 Stars', value: Math.floor(Math.random() * 15) + 5 },
      { name: '2 Stars', value: Math.floor(Math.random() * 10) + 2 },
      { name: '1 Star', value: Math.floor(Math.random() * 5) + 1 },
    ];
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderTrendIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUpRight className="text-green-500" />;
    } else if (value < 0) {
      return <ArrowDownRight className="text-red-500" />;
    }
    return null;
  };

  // Chart formatter functions
  const revenueTooltipFormatter = (value: number): TooltipFormatterResult => {
    return ['$' + value, 'Revenue'];
  };

  const requestsTooltipFormatter = (value: number): TooltipFormatterResult => {
    return [value.toString(), 'Requests'];
  };

  const pieChartLabelRenderer: PieChartLabelFunction = ({ name, percent }) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Select
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'quarter' | 'year')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="quarter">Past Quarter</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {renderTrendIcon(summary.weeklyTrend)}
              <span className={summary.weeklyTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(summary.weeklyTrend).toFixed(1)}% from last period
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {renderTrendIcon(summary.dailyTrend)}
              <span className={summary.dailyTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(summary.dailyTrend).toFixed(1)}% from last period
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageRating.toFixed(1)}/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on customer reviews
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Revenue vs Service Requests</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData.map((item, i) => ({
                    name: item.name,
                    revenue: item.value,
                    requests: requestsData[i]?.value || 0
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#82ca9d" name="Service Requests" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={revenueTooltipFormatter} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Service Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={pieChartLabelRenderer}
                  >
                    {serviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={requestsTooltipFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ratings" className="space-y-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingDistribution}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={requestsTooltipFormatter} />
                  <Legend />
                  <Bar dataKey="value" fill="#FFBB28" name="Number of Reviews" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 