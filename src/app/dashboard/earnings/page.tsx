"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAuthToken } from "@/utils/auth";
import { ServiceRequest } from "@/types/models";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year" | "all">("month");
  const [summaryData, setSummaryData] = useState({
    totalEarnings: 0,
    completedJobs: 0,
    averagePerJob: 0,
  });

  useEffect(() => {
    fetchEarnings();
  }, [timeFilter]);

  const fetchEarnings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Calculate date range based on timeFilter
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeFilter === "week") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeFilter === "month") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (timeFilter === "year") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      } else {
        // "all" - set a date far in the past
        startDate = new Date(2020, 0, 1);
      }

      // Format dates for the API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch completed jobs where the user was the driver
      const response = await fetch(
        `/api/driver-earnings?start_date=${startDateStr}&end_date=${endDateStr}&search=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch earnings");
      }

      const data = await response.json();
      
      // For demonstration purposes, we'll create some mock data
      // In a real app, this would come from the API
      const mockEarnings = generateMockEarnings(timeFilter);
      
      setEarnings(mockEarnings.earnings);
      setSummaryData(mockEarnings.summary);
    } catch (err: any) {
      console.error("Error fetching earnings:", err);
      setError(err.message || "Failed to load earnings");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock data for demonstration purposes
  const generateMockEarnings = (period: string) => {
    const earnings = [];
    const now = new Date();
    let totalEarnings = 0;
    let daysToGenerate = 30;

    if (period === "week") daysToGenerate = 7;
    if (period === "year") daysToGenerate = 60; // Just show more entries for year view

    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate 0-3 jobs per day
      const jobsPerDay = Math.floor(Math.random() * 4);
      
      for (let j = 0; j < jobsPerDay; j++) {
        const amount = Math.floor(Math.random() * 30) + 15; // $15-45 per job
        totalEarnings += amount;
        
        earnings.push({
          id: `job-${i}-${j}`,
          date: date.toISOString(),
          type: Math.random() > 0.5 ? "Pickup" : "Return",
          customerName: `Customer ${Math.floor(Math.random() * 100) + 1}`,
          shopName: `Auto Shop ${Math.floor(Math.random() * 20) + 1}`,
          amount: amount,
          status: "completed"
        });
      }
    }
    
    // Sort by date (newest first)
    earnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return {
      earnings,
      summary: {
        totalEarnings,
        completedJobs: earnings.length,
        averagePerJob: earnings.length > 0 ? Math.round(totalEarnings / earnings.length) : 0
      }
    };
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filtering is handled on the server in a real app
    // For demo, we'll just display the search query
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEarnings = searchQuery 
    ? earnings.filter(job => 
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : earnings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Earnings</h1>
          <p className="text-muted-foreground">
            Track your earnings from completed deliveries
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData.totalEarnings}</div>
            <p className="text-xs text-muted-foreground">
              {timeFilter === "week" 
                ? "Past 7 days" 
                : timeFilter === "month" 
                ? "Past 30 days" 
                : timeFilter === "year" 
                ? "Past year" 
                : "All time"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Average ${summaryData.averagePerJob} per job
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.floor(summaryData.totalEarnings * 0.8)}</div>
            <p className="text-xs text-muted-foreground">
              Next payout: {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex gap-2">
          <Button 
            variant={timeFilter === "week" ? "default" : "outline"} 
            onClick={() => setTimeFilter("week")}
          >
            This Week
          </Button>
          <Button 
            variant={timeFilter === "month" ? "default" : "outline"} 
            onClick={() => setTimeFilter("month")}
          >
            This Month
          </Button>
          <Button 
            variant={timeFilter === "year" ? "default" : "outline"} 
            onClick={() => setTimeFilter("year")}
          >
            This Year
          </Button>
          <Button 
            variant={timeFilter === "all" ? "default" : "outline"} 
            onClick={() => setTimeFilter("all")}
          >
            All Time
          </Button>
        </div>
        
        <Search onSearch={handleSearch} placeholder="Search jobs..." className="w-full md:w-[300px]" />
      </div>

      {/* Earnings List */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading earnings...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button
              className="mt-4"
              onClick={fetchEarnings}
            >
              Try Again
            </Button>
          </div>
        ) : filteredEarnings.length === 0 ? (
          <div className="p-8 text-center">
            <p>No earnings found for this period.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredEarnings.map((job) => (
              <div 
                key={job.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="space-y-1">
                  <div className="font-medium">{job.type} - {job.shopName}</div>
                  <div className="text-sm text-muted-foreground">Customer: {job.customerName}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(job.date)}</div>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    +${job.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 