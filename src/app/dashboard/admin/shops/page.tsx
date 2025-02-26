"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  MoreHorizontal, 
  Edit, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  Car,
  Calendar as CalendarIcon,
  Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Calendar from '@/components/scheduling/Calendar';
import { CalendarEvent } from '@/types/scheduling';

// Define the shop data interface
interface ShopData {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: 'active' | 'pending_approval' | 'suspended' | 'inactive';
  specialties: string[];
  rating: number;
  total_reviews: number;
  created_at: string;
  mechanics_count: number;
  verified: boolean;
  hours_of_operation: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  services_offered: {
    name: string;
    price_range: string;
  }[];
}

export default function ShopManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for shops data and UI
  const [isLoading, setIsLoading] = useState(true);
  const [shops, setShops] = useState<ShopData[]>([]);
  const [filteredShops, setFilteredShops] = useState<ShopData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  
  // State for shop details dialog
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopData | null>(null);
  const [appointmentsForShop, setAppointmentsForShop] = useState<CalendarEvent[]>([]);

  // Fetch shops data
  useEffect(() => {
    const fetchShops = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would be an API call
        // For now, we'll use mock data
        const mockShops: ShopData[] = [
          {
            id: 's1',
            name: 'Quick Fix Auto Shop',
            owner_id: 'u123',
            owner_name: 'Michael Johnson',
            email: 'contact@quickfixauto.com',
            phone: '(555) 123-4567',
            address: '123 Repair Lane',
            city: 'Mechanicville',
            state: 'NY',
            zip: '12345',
            status: 'active',
            specialties: ['Oil Change', 'Brake Repair', 'Tire Service'],
            rating: 4.7,
            total_reviews: 128,
            created_at: '2022-05-15T10:30:00Z',
            mechanics_count: 5,
            verified: true,
            hours_of_operation: {
              monday: '8:00 AM - 6:00 PM',
              tuesday: '8:00 AM - 6:00 PM',
              wednesday: '8:00 AM - 6:00 PM',
              thursday: '8:00 AM - 6:00 PM',
              friday: '8:00 AM - 6:00 PM',
              saturday: '9:00 AM - 4:00 PM',
              sunday: 'Closed',
            },
            services_offered: [
              { name: 'Oil Change', price_range: '$30-$50' },
              { name: 'Brake Repair', price_range: '$100-$300' },
              { name: 'Tire Rotation', price_range: '$20-$40' },
            ],
          },
          {
            id: 's2',
            name: 'Elite Auto Care',
            owner_id: 'u456',
            owner_name: 'Sarah Williams',
            email: 'info@eliteautocare.com',
            phone: '(555) 987-6543',
            address: '456 Mechanic Street',
            city: 'Autobahn',
            state: 'CA',
            zip: '90210',
            status: 'active',
            specialties: ['Engine Repair', 'Transmission Service', 'Electrical Systems'],
            rating: 4.9,
            total_reviews: 256,
            created_at: '2021-11-22T14:15:00Z',
            mechanics_count: 8,
            verified: true,
            hours_of_operation: {
              monday: '7:00 AM - 7:00 PM',
              tuesday: '7:00 AM - 7:00 PM',
              wednesday: '7:00 AM - 7:00 PM',
              thursday: '7:00 AM - 7:00 PM',
              friday: '7:00 AM - 7:00 PM',
              saturday: '8:00 AM - 5:00 PM',
              sunday: '10:00 AM - 3:00 PM',
            },
            services_offered: [
              { name: 'Engine Diagnostics', price_range: '$80-$120' },
              { name: 'Transmission Fluid Change', price_range: '$150-$250' },
              { name: 'Battery Replacement', price_range: '$100-$200' },
            ],
          },
          {
            id: 's3',
            name: 'Premium Auto Service',
            owner_id: 'u789',
            owner_name: 'David Chen',
            email: 'service@premiumauto.com',
            phone: '(555) 555-1234',
            address: '789 Service Road',
            city: 'Motorville',
            state: 'TX',
            zip: '75001',
            status: 'pending_approval',
            specialties: ['Luxury Vehicles', 'Performance Tuning', 'Custom Modifications'],
            rating: 4.5,
            total_reviews: 75,
            created_at: '2023-01-10T09:45:00Z',
            mechanics_count: 3,
            verified: false,
            hours_of_operation: {
              monday: '9:00 AM - 5:00 PM',
              tuesday: '9:00 AM - 5:00 PM',
              wednesday: '9:00 AM - 5:00 PM',
              thursday: '9:00 AM - 5:00 PM',
              friday: '9:00 AM - 5:00 PM',
              saturday: '10:00 AM - 3:00 PM',
              sunday: 'Closed',
            },
            services_offered: [
              { name: 'Performance Tuning', price_range: '$300-$1000' },
              { name: 'Custom Exhaust', price_range: '$500-$1500' },
              { name: 'Suspension Upgrade', price_range: '$800-$2000' },
            ],
          },
          {
            id: 's4',
            name: 'Budget Repair Shop',
            owner_id: 'u101',
            owner_name: 'Robert Smith',
            email: 'info@budgetrepair.com',
            phone: '(555) 321-7890',
            address: '101 Economy Drive',
            city: 'Fixitville',
            state: 'OH',
            zip: '43210',
            status: 'inactive',
            specialties: ['Basic Maintenance', 'Affordable Repairs', 'Used Parts Installation'],
            rating: 3.8,
            total_reviews: 42,
            created_at: '2022-09-05T11:20:00Z',
            mechanics_count: 2,
            verified: true,
            hours_of_operation: {
              monday: '8:00 AM - 5:00 PM',
              tuesday: '8:00 AM - 5:00 PM',
              wednesday: '8:00 AM - 5:00 PM',
              thursday: '8:00 AM - 5:00 PM',
              friday: '8:00 AM - 5:00 PM',
              saturday: 'Closed',
              sunday: 'Closed',
            },
            services_offered: [
              { name: 'Basic Oil Change', price_range: '$25-$40' },
              { name: 'Used Parts Installation', price_range: 'Variable' },
              { name: 'Check Engine Light Diagnosis', price_range: '$30-$60' },
            ],
          },
          {
            id: 's5',
            name: 'Super Speed Auto',
            owner_id: 'u202',
            owner_name: 'Jennifer Lee',
            email: 'speed@superspeedauto.com',
            phone: '(555) 789-4561',
            address: '202 Fast Lane',
            city: 'Racetrack',
            state: 'FL',
            zip: '33101',
            status: 'suspended',
            specialties: ['Sports Cars', 'Racing Modifications', 'High-Performance Tuning'],
            rating: 4.2,
            total_reviews: 89,
            created_at: '2022-03-15T13:10:00Z',
            mechanics_count: 4,
            verified: true,
            hours_of_operation: {
              monday: '10:00 AM - 8:00 PM',
              tuesday: '10:00 AM - 8:00 PM',
              wednesday: '10:00 AM - 8:00 PM',
              thursday: '10:00 AM - 8:00 PM',
              friday: '10:00 AM - 9:00 PM',
              saturday: '11:00 AM - 6:00 PM',
              sunday: '12:00 PM - 5:00 PM',
            },
            services_offered: [
              { name: 'Performance Chip Installation', price_range: '$300-$700' },
              { name: 'Racing Suspension Setup', price_range: '$1000-$3000' },
              { name: 'Turbo Installation', price_range: '$2000-$5000' },
            ],
          },
        ];

        setShops(mockShops);
        setFilteredShops(mockShops);
      } catch (error) {
        console.error('Error fetching shops:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch shops. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, [toast]);

  // Filter shops based on search term and filters
  useEffect(() => {
    let result = shops;
    
    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        shop => 
          shop.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          shop.owner_name.toLowerCase().includes(lowerCaseSearchTerm) ||
          shop.email.toLowerCase().includes(lowerCaseSearchTerm) ||
          shop.city.toLowerCase().includes(lowerCaseSearchTerm) ||
          shop.state.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    
    // Filter by status
    if (selectedStatus) {
      result = result.filter(shop => shop.status === selectedStatus);
    }
    
    // Filter by specialty
    if (selectedSpecialty) {
      result = result.filter(shop => 
        shop.specialties.some(specialty => 
          specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
        )
      );
    }
    
    setFilteredShops(result);
  }, [shops, searchTerm, selectedStatus, selectedSpecialty]);

  // Handle viewing shop details
  const handleViewShop = (shop: ShopData) => {
    setSelectedShop(shop);
    setShowDetailsDialog(true);
    
    // Generate some mock appointments for the calendar view
    generateMockAppointments(shop.id);
  };

  // Generate mock appointments for calendar
  const generateMockAppointments = (shopId: string) => {
    const today = new Date();
    const mockAppointments: CalendarEvent[] = Array.from({ length: 8 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + Math.floor(i / 2));
      date.setHours(9 + (i % 8), 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(date.getHours() + 1);
      
      const types: Array<'pickup' | 'delivery' | 'service'> = ['pickup', 'delivery', 'service'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      return {
        id: `apt-${shopId}-${i}`,
        title: `${type === 'service' ? 'Vehicle Service' : type === 'pickup' ? 'Vehicle Pickup' : 'Vehicle Delivery'}`,
        start: date,
        end: endDate,
        type,
        customerName: `Customer ${i + 1}`,
        vehicleInfo: `Vehicle ${i + 1}`,
        status: Math.random() > 0.5 ? 'Confirmed' : 'Pending',
      };
    });
    
    setAppointmentsForShop(mockAppointments);
  };

  // Handle verifying a shop
  const handleVerifyShop = (shopId: string) => {
    // In a real application, this would call an API
    setShops(shops.map(shop => 
      shop.id === shopId 
        ? { ...shop, verified: true } 
        : shop
    ));
    
    toast({
      title: 'Shop Verified',
      description: 'The shop has been verified successfully.',
    });
  };

  // Handle updating shop status
  const handleUpdateStatus = (shopId: string, newStatus: ShopData['status']) => {
    // In a real application, this would call an API
    setShops(shops.map(shop => 
      shop.id === shopId 
        ? { ...shop, status: newStatus } 
        : shop
    ));
    
    toast({
      title: 'Status Updated',
      description: `Shop status has been updated to ${newStatus.replace('_', ' ')}.`,
    });
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: ShopData['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-500">Pending Approval</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500">Suspended</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return null;
    }
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        <span className="font-medium mr-1">{rating.toFixed(1)}</span>
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      </div>
    );
  };

  // If user is not admin, show access denied
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only administrators can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shop Management</h1>
          <p className="text-muted-foreground">Manage repair shops in the system</p>
        </div>
        
        <Button className="mt-4 md:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Add New Shop
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shops..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Specialties</SelectItem>
                <SelectItem value="oil change">Oil Change</SelectItem>
                <SelectItem value="brake">Brake Service</SelectItem>
                <SelectItem value="engine">Engine Repair</SelectItem>
                <SelectItem value="transmission">Transmission</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="luxury">Luxury Vehicles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Shops Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shops ({filteredShops.length})</CardTitle>
          <CardDescription>
            View and manage all repair shops in the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shops found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Mechanics</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShops.map(shop => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.name}</TableCell>
                      <TableCell>{shop.owner_name}</TableCell>
                      <TableCell>
                        {shop.city}, {shop.state}
                      </TableCell>
                      <TableCell>{renderRating(shop.rating)}</TableCell>
                      <TableCell>{shop.mechanics_count}</TableCell>
                      <TableCell>{renderStatusBadge(shop.status)}</TableCell>
                      <TableCell>
                        {shop.verified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleViewShop(shop)}>
                            View
                          </Button>
                          <Select
                            onValueChange={(value) => handleUpdateStatus(shop.id, value as ShopData['status'])}
                            defaultValue={shop.status}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Set Active</SelectItem>
                              <SelectItem value="inactive">Set Inactive</SelectItem>
                              <SelectItem value="suspended">Suspend</SelectItem>
                            </SelectContent>
                          </Select>
                          {!shop.verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleVerifyShop(shop.id)}
                            >
                              <Shield className="h-4 w-4" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Shop Details Dialog */}
      {selectedShop && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {selectedShop.name}
                {renderStatusBadge(selectedShop.status)}
              </DialogTitle>
              <DialogDescription>
                {selectedShop.verified && (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 mt-2">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Verified Shop
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="details">Shop Details</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedShop.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedShop.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p>{selectedShop.address}</p>
                          <p>{selectedShop.city}, {selectedShop.state} {selectedShop.zip}</p>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-muted-foreground mt-4 mb-2">Shop Owner</h3>
                    <p>{selectedShop.owner_name}</p>
                    <p className="text-sm text-muted-foreground">Owner since {format(new Date(selectedShop.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Hours of Operation</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Monday:</span>
                        <span>{selectedShop.hours_of_operation.monday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tuesday:</span>
                        <span>{selectedShop.hours_of_operation.tuesday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wednesday:</span>
                        <span>{selectedShop.hours_of_operation.wednesday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thursday:</span>
                        <span>{selectedShop.hours_of_operation.thursday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Friday:</span>
                        <span>{selectedShop.hours_of_operation.friday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span>{selectedShop.hours_of_operation.saturday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span>{selectedShop.hours_of_operation.sunday}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-muted-foreground mt-4 mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedShop.specialties.map((specialty, index) => (
                        <Badge variant="outline" key={index}>
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold flex items-center justify-center">
                            {selectedShop.rating.toFixed(1)}
                            <Star className="h-5 w-5 ml-1 fill-yellow-400 text-yellow-400" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            from {selectedShop.total_reviews} reviews
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{selectedShop.mechanics_count}</div>
                          <p className="text-xs text-muted-foreground">mechanics</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">152</div>
                          <p className="text-xs text-muted-foreground">monthly jobs</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">96%</div>
                          <p className="text-xs text-muted-foreground">completion rate</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="services" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Avg. Completion Time</TableHead>
                        <TableHead>Warranty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedShop.services_offered.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{service.price_range}</TableCell>
                          <TableCell>{['1-2 hours', '2-4 hours', '3-5 hours', 'Same day'][index % 4]}</TableCell>
                          <TableCell>{['30 days', '60 days', '90 days', '6 months'][index % 4]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="mechanics" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: selectedShop.mechanics_count }, (_, i) => ({
                        id: `m${i}`,
                        name: `Mechanic ${i + 1}`,
                        specialty: selectedShop.specialties[i % selectedShop.specialties.length],
                        experience: `${3 + i} years`,
                        status: i === 0 ? 'inactive' : 'active',
                        rating: 3.5 + (i % 2),
                      })).map((mechanic) => (
                        <TableRow key={mechanic.id}>
                          <TableCell className="font-medium">{mechanic.name}</TableCell>
                          <TableCell>{mechanic.specialty}</TableCell>
                          <TableCell>{mechanic.experience}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={mechanic.status === 'active' 
                                ? 'bg-green-50 text-green-600 border-green-200' 
                                : 'bg-gray-50 text-gray-600 border-gray-200'}
                            >
                              {mechanic.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{renderRating(mechanic.rating)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    View All Mechanics
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Upcoming Appointments</h3>
                    <Select defaultValue="week">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day View</SelectItem>
                        <SelectItem value="week">Week View</SelectItem>
                        <SelectItem value="month">Month View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-card border rounded-md p-1">
                    <Calendar 
                      events={appointmentsForShop}
                      onEventClick={(event: CalendarEvent) => {
                        toast({
                          title: 'Appointment Details',
                          description: `${event.title} for ${event.customerName} at ${format(event.start, 'h:mm a')}`,
                        });
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedShop.status === 'pending_approval' && (
                  <Button 
                    variant="default" 
                    onClick={() => {
                      handleUpdateStatus(selectedShop.id, 'active');
                      setShowDetailsDialog(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Shop
                  </Button>
                )}
                
                {selectedShop.status === 'suspended' && (
                  <Button 
                    variant="default" 
                    onClick={() => {
                      handleUpdateStatus(selectedShop.id, 'active');
                      setShowDetailsDialog(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reinstate Shop
                  </Button>
                )}
                
                {selectedShop.status === 'active' && (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleUpdateStatus(selectedShop.id, 'suspended');
                      setShowDetailsDialog(false);
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Suspend Shop
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDetailsDialog(false);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
