"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, MoreHorizontal, Star, Settings, MapPin, 
  Clock, Check, X, AlertTriangle, Wrench 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MechanicData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive' | 'pending_approval' | 'suspended';
  rating: number;
  specialties: string[];
  total_jobs: number;
  completion_rate: number;
  location: string;
  created_at: string;
  shop_id: string | null;
  shop_name: string | null;
  certification_verified: boolean;
  availability: {
    weekdays: string[];
    hours: string;
  };
}

export default function MechanicManagementPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [mechanics, setMechanics] = useState<MechanicData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")
  const [editMechanic, setEditMechanic] = useState<MechanicData | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewMechanic, setViewMechanic] = useState<MechanicData | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  
  // Fetch mechanics data
  useEffect(() => {
    const fetchMechanics = async () => {
      setIsLoading(true)
      try {
        // In a real application, this would be an API call
        // For demo purposes, we're using mock data
        const mockMechanics: MechanicData[] = [
          {
            id: "MECH001",
            email: "robert.williams@example.com",
            first_name: "Robert",
            last_name: "Williams",
            status: "active",
            rating: 4.8,
            specialties: ["Engine Repair", "Diagnostics", "Electrical Systems"],
            total_jobs: 152,
            completion_rate: 98,
            location: "Los Angeles, CA",
            created_at: "2022-03-15",
            shop_id: "SHOP001",
            shop_name: "QuickFix Auto Shop",
            certification_verified: true,
            availability: {
              weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              hours: "9:00 AM - 5:00 PM"
            }
          },
          {
            id: "MECH002",
            email: "lisa.martinez@example.com",
            first_name: "Lisa",
            last_name: "Martinez",
            status: "active",
            rating: 4.7,
            specialties: ["Brake Systems", "Suspension", "Tire Services"],
            total_jobs: 98,
            completion_rate: 96,
            location: "San Francisco, CA",
            created_at: "2022-05-20",
            shop_id: "SHOP002",
            shop_name: "Bay Area Auto Care",
            certification_verified: true,
            availability: {
              weekdays: ["Monday", "Wednesday", "Friday", "Saturday"],
              hours: "8:00 AM - 6:00 PM"
            }
          },
          {
            id: "MECH003",
            email: "michael.johnson@example.com",
            first_name: "Michael",
            last_name: "Johnson",
            status: "inactive",
            rating: 4.2,
            specialties: ["Oil Change", "Fluid Services", "Filter Replacement"],
            total_jobs: 65,
            completion_rate: 90,
            location: "New York, NY",
            created_at: "2022-08-10",
            shop_id: null,
            shop_name: null,
            certification_verified: true,
            availability: {
              weekdays: ["Tuesday", "Thursday", "Saturday", "Sunday"],
              hours: "10:00 AM - 4:00 PM"
            }
          },
          {
            id: "MECH004",
            email: "sarah.thompson@example.com",
            first_name: "Sarah",
            last_name: "Thompson",
            status: "pending_approval",
            rating: 0,
            specialties: ["Engine Repair", "Transmission Repair"],
            total_jobs: 0,
            completion_rate: 0,
            location: "Chicago, IL",
            created_at: "2023-01-05",
            shop_id: "SHOP003",
            shop_name: "Windy City Motors",
            certification_verified: false,
            availability: {
              weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              hours: "9:00 AM - 5:00 PM"
            }
          },
          {
            id: "MECH005",
            email: "david.rodriguez@example.com",
            first_name: "David",
            last_name: "Rodriguez",
            status: "suspended",
            rating: 3.5,
            specialties: ["AC Repair", "Heating Systems"],
            total_jobs: 42,
            completion_rate: 85,
            location: "Miami, FL",
            created_at: "2022-11-15",
            shop_id: "SHOP004",
            shop_name: "Sunshine Auto Repair",
            certification_verified: true,
            availability: {
              weekdays: ["Monday", "Wednesday", "Friday"],
              hours: "8:00 AM - 4:00 PM"
            }
          }
        ]
        
        setMechanics(mockMechanics)
      } catch (error) {
        console.error('Error fetching mechanics:', error)
        toast({
          title: "Error",
          description: "Failed to load mechanics data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMechanics()
  }, [toast])

  // Get unique specialties from mechanics data for filter dropdown
  const uniqueSpecialties = Array.from(
    new Set(mechanics.flatMap(mechanic => mechanic.specialties))
  ).sort()

  // Filter mechanics based on search term and selected filters
  const filteredMechanics = mechanics.filter(mechanic => {
    const matchesSearch = 
      mechanic.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mechanic.shop_name && mechanic.shop_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || mechanic.status === statusFilter
    const matchesSpecialty = specialtyFilter === "all" || mechanic.specialties.includes(specialtyFilter)
    
    return matchesSearch && matchesStatus && matchesSpecialty
  })

  // Handle actions
  const handleViewMechanic = (mechanic: MechanicData) => {
    setViewMechanic(mechanic)
    setViewDialogOpen(true)
  }

  const handleEditMechanic = (mechanic: MechanicData) => {
    setEditMechanic(mechanic)
    setEditDialogOpen(true)
  }

  const handleSaveMechanic = () => {
    if (!editMechanic) return
    
    // In a real app, this would be an API call to update the mechanic
    setMechanics(prevMechanics => 
      prevMechanics.map(m => 
        m.id === editMechanic.id ? editMechanic : m
      )
    )
    
    toast({
      title: "Mechanic updated",
      description: `${editMechanic.first_name} ${editMechanic.last_name}'s info has been updated`
    })
    
    setEditDialogOpen(false)
  }

  const handleUpdateStatus = (mechanicId: string, newStatus: MechanicData['status']) => {
    // In a real app, this would be an API call to update the mechanic's status
    setMechanics(prevMechanics => 
      prevMechanics.map(mechanic => 
        mechanic.id === mechanicId 
          ? { ...mechanic, status: newStatus } 
          : mechanic
      )
    )
    
    toast({
      title: "Status updated",
      description: `Mechanic status changed to ${newStatus.replace('_', ' ')}`
    })
  }

  const handleVerifyCertification = (mechanicId: string) => {
    // In a real app, this would be an API call to verify the mechanic's certification
    setMechanics(prevMechanics => 
      prevMechanics.map(mechanic => 
        mechanic.id === mechanicId 
          ? { ...mechanic, certification_verified: true } 
          : mechanic
      )
    )
    
    toast({
      title: "Certification verified",
      description: "Mechanic's certification has been verified"
    })
  }

  // Render status badge
  const renderStatusBadge = (status: MechanicData['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            Inactive
          </Badge>
        )
      case 'pending_approval':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Pending Approval
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Suspended
          </Badge>
        )
    }
  }

  // Render star rating
  const renderRating = (rating: number) => {
    if (rating === 0) return <span className="text-muted-foreground">No ratings yet</span>
    
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        )}
        {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <Star key={i + fullStars + (hasHalfStar ? 1 : 0)} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mechanic Management</h1>
        <Button onClick={() => router.push('/dashboard/admin')}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Mechanics</CardTitle>
          <CardDescription>
            Use the filters below to find specific mechanics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search by name, email, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Specialty</label>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {uniqueSpecialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mechanics</CardTitle>
          <CardDescription>
            Showing {filteredMechanics.length} of {mechanics.length} total mechanics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableCaption>List of mechanics</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMechanics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No mechanics found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMechanics.map((mechanic) => (
                    <TableRow key={mechanic.id}>
                      <TableCell className="font-medium">
                        {mechanic.first_name} {mechanic.last_name}
                      </TableCell>
                      <TableCell>{renderStatusBadge(mechanic.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mechanic.specialties.slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="outline">
                              {specialty}
                            </Badge>
                          ))}
                          {mechanic.specialties.length > 2 && (
                            <Badge variant="outline">
                              +{mechanic.specialties.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{renderRating(mechanic.rating)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{mechanic.total_jobs} total</span>
                          <span className="text-xs text-muted-foreground">
                            {mechanic.completion_rate}% completion
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {mechanic.shop_name || <span className="text-muted-foreground">Not assigned</span>}
                      </TableCell>
                      <TableCell>{mechanic.location}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewMechanic(mechanic)}>
                              <User className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditMechanic(mechanic)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            {mechanic.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(mechanic.id, 'active')}>
                                <Check className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {mechanic.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(mechanic.id, 'inactive')}>
                                <X className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {mechanic.status === 'pending_approval' && (
                              <DropdownMenuItem onClick={() => handleVerifyCertification(mechanic.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Verify Certification
                              </DropdownMenuItem>
                            )}
                            {mechanic.status !== 'suspended' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(mechanic.id, 'suspended')}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Mechanic Profile Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mechanic Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the mechanic
            </DialogDescription>
          </DialogHeader>
          
          {viewMechanic && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="details">Personal Details</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{viewMechanic.first_name} {viewMechanic.last_name}</h2>
                    <p className="text-muted-foreground">{viewMechanic.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStatusBadge(viewMechanic.status)}
                      {viewMechanic.certification_verified && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          Certified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">ID</h4>
                    <p className="text-base">{viewMechanic.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Joined On</h4>
                    <p className="text-base">{new Date(viewMechanic.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Shop</h4>
                    <p className="text-base">
                      {viewMechanic.shop_name || 'Not assigned to a shop'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      <p className="text-base">{viewMechanic.location}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Specialties</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewMechanic.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        {renderRating(viewMechanic.rating)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        <Wrench className="h-5 w-5 mr-2 text-primary" />
                        <span className="text-2xl font-bold">{viewMechanic.total_jobs}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        <div className="relative h-16 w-16">
                          <div className="h-16 w-16 rounded-full flex items-center justify-center border-4 border-primary">
                            <span className="text-lg font-bold">{viewMechanic.completion_rate}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                    <CardDescription>
                      Job completion and customer satisfaction metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Detailed performance metrics will be available soon. This section will include:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                      <li>Job completion time averages</li>
                      <li>Customer feedback and comments</li>
                      <li>Quality of work metrics</li>
                      <li>On-time arrival percentage</li>
                      <li>Monthly/yearly performance trends</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="availability" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule</CardTitle>
                    <CardDescription>
                      Mechanic's available working days and hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Working Days</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <Badge 
                              key={day} 
                              variant={viewMechanic.availability.weekdays.includes(day) ? "default" : "outline"}
                              className={viewMechanic.availability.weekdays.includes(day) ? "" : "text-muted-foreground"}
                            >
                              {day.substring(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Working Hours</h4>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{viewMechanic.availability.hours}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-2">Current Status</h4>
                        <p className="text-muted-foreground">
                          {viewMechanic.status === 'active' 
                            ? 'Mechanic is currently active and available for job assignments.' 
                            : viewMechanic.status === 'inactive'
                              ? 'Mechanic is currently inactive and not accepting new jobs.'
                              : viewMechanic.status === 'pending_approval'
                                ? 'Mechanic is waiting for approval to join the platform.'
                                : 'Mechanic has been suspended from the platform.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Service Area</CardTitle>
                    <CardDescription>
                      Regions where this mechanic provides services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{viewMechanic.location}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Service radius and specific coverage areas will be displayed here once configured.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {viewMechanic && (
              <Button onClick={() => {
                setViewDialogOpen(false)
                handleEditMechanic(viewMechanic)
              }}>
                Edit Mechanic
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mechanic Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Mechanic</DialogTitle>
            <DialogDescription>
              Update mechanic information and settings
            </DialogDescription>
          </DialogHeader>
          
          {editMechanic && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input 
                    value={editMechanic.first_name}
                    onChange={(e) => setEditMechanic({
                      ...editMechanic,
                      first_name: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input 
                    value={editMechanic.last_name}
                    onChange={(e) => setEditMechanic({
                      ...editMechanic,
                      last_name: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    value={editMechanic.email}
                    onChange={(e) => setEditMechanic({
                      ...editMechanic,
                      email: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={editMechanic.status}
                    onValueChange={(value: MechanicData['status']) => setEditMechanic({
                      ...editMechanic,
                      status: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input 
                    value={editMechanic.location}
                    onChange={(e) => setEditMechanic({
                      ...editMechanic,
                      location: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shop</label>
                  <Input 
                    value={editMechanic.shop_name || ''}
                    placeholder="No shop assigned"
                    onChange={(e) => setEditMechanic({
                      ...editMechanic,
                      shop_name: e.target.value || null
                    })}
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Certification Verified</label>
                    <div 
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editMechanic.certification_verified ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => setEditMechanic({
                        ...editMechanic,
                        certification_verified: !editMechanic.certification_verified
                      })}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editMechanic.certification_verified ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMechanic}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 