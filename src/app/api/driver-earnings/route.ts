import { NextRequest, NextResponse } from "next/server";

// Sample mock data for demonstration purposes
const generateMockEarnings = (startDate: string | null, endDate: string | null, searchTerm: string | null) => {
  const earnings = [];
  const now = new Date();
  let totalEarnings = 0;
  let daysToGenerate = 90;
  
  // Generate fake earnings data
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Filter by date range if provided
    if (startDate && date < new Date(startDate)) continue;
    if (endDate && date > new Date(endDate)) continue;
    
    // Generate 0-3 jobs per day
    const jobsPerDay = Math.floor(Math.random() * 4);
    
    for (let j = 0; j < jobsPerDay; j++) {
      const amount = Math.floor(Math.random() * 30) + 15; // $15-45 per job
      const shopName = `Auto Shop ${Math.floor(Math.random() * 20) + 1}`;
      const customerName = `Customer ${Math.floor(Math.random() * 100) + 1}`;
      const jobType = Math.random() > 0.5 ? "Pickup" : "Return";
      const vehicleInfo = `${2015 + Math.floor(Math.random() * 8)} ${
        ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes'][Math.floor(Math.random() * 6)]
      } ${
        ['Camry', 'Civic', 'F-150', 'Silverado', '3 Series', 'C-Class'][Math.floor(Math.random() * 6)]
      }`;
      
      // Skip if search term doesn't match
      if (
        searchTerm && 
        !shopName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !jobType.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        continue;
      }
      
      totalEarnings += amount;
      
      earnings.push({
        id: `job-${i}-${j}`,
        date: date.toISOString(),
        type: jobType,
        customerName: customerName,
        shopName: shopName,
        vehicle: vehicleInfo,
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const searchTerm = searchParams.get("search");
  
  try {
    // Generate mock data
    const mockData = generateMockEarnings(startDate, endDate, searchTerm);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error processing earnings request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 