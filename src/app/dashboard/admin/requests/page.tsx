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
import { Eye, MoreHorizontal, Check, X, AlertTriangle, Clock } from "lucide-react"

interface ServiceRequest {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  mechanicId: string | null
  mechanicName: string | null
  serviceType: string
  vehicleDetails: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  urgency: 'low' | 'medium' | 'high'
  location: string
  description: string
  createdAt: string
  scheduledFor: string | null
  completedAt: string | null
  paymentStatus: 'unpaid' | 'pending' | 'paid'
  paymentAmount: number | null
}

export default function ServiceRequestsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")
  const [viewRequest, setViewRequest] = useState<ServiceRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      try {
        // In a real application, this would be an API call
        // For demo purposes, we're using mock data
        const mockRequests: ServiceRequest[] = [
          {
            id: "SR001",
            customerId: "CUST001",
            customerName: "John Smith",
            customerEmail: "john.smith@example.com",
            mechanicId: "MECH002",
            mechanicName: "Mike Johnson",
            serviceType: "Oil Change",
            vehicleDetails: "2020 Toyota Camry",
            status: "in_progress",
            urgency: "medium",
            location: "123 Main St, Anytown, CA",
            description: "Regular oil change service needed",
            createdAt: "2023-05-15T10:30:00Z",
            scheduledFor: "2023-05-20T14:00:00Z",
            completedAt: null,
            paymentStatus: "pending",
            paymentAmount: 45.99
          },
          {
            id: "SR002",
            customerId: "CUST003",
            customerName: "Emily Davis",
            customerEmail: "emily.davis@example.com",
            mechanicId: null,
            mechanicName: null,
            serviceType: "Brake Repair",
            vehicleDetails: "2018 Honda Civic",
            status: "pending",
            urgency: "high",
            location: "456 Oak Ave, Somewhere, CA",
            description: "Brakes squeaking loudly",
            createdAt: "2023-05-16T09:15:00Z",
            scheduledFor: null,
            completedAt: null,
            paymentStatus: "unpaid",
            paymentAmount: null
          },
          {
            id: "SR003",
            customerId: "CUST002",
            customerName: "Sarah Johnson",
            customerEmail: "sarah.j@example.com",
            mechanicId: "MECH001",
            mechanicName: "Robert Williams",
            serviceType: "Tire Rotation",
            vehicleDetails: "2021 Ford F-150",
            status: "completed",
            urgency: "low",
            location: "789 Pine Rd, Nowhere, CA",
            description: "Regular tire rotation and pressure check",
            createdAt: "2023-05-14T15:45:00Z",
            scheduledFor: "2023-05-18T11:30:00Z",
            completedAt: "2023-05-18T12:15:00Z",
            paymentStatus: "paid",
            paymentAmount: 35.50
          },
          {
            id: "SR004",
            customerId: "CUST005",
            customerName: "Michael Brown",
            customerEmail: "m.brown@example.com",
            mechanicId: null,
            mechanicName: null,
            serviceType: "Battery Replacement",
            vehicleDetails: "2017 Nissan Altima",
            status: "cancelled",
            urgency: "high",
            location: "101 Cedar Ln, Elsewhere, CA",
            description: "Car won't start, need new battery",
            createdAt: "2023-05-15T08:20:00Z",
            scheduledFor: "2023-05-16T10:00:00Z",
            completedAt: null,
            paymentStatus: "unpaid",
            paymentAmount: null
          },
          {
            id: "SR005",
            customerId: "CUST004",
            customerName: "Daniel Wilson",
            customerEmail: "dan.wilson@example.com",
            mechanicId: "MECH003",
            mechanicName: "Lisa Martinez",
            serviceType: "Engine Diagnostics",
            vehicleDetails: "2019 Chevrolet Malibu",
            status: "assigned",
            urgency: "medium",
            location: "202 Maple Dr, Anywhere, CA",
            description: "Check engine light is on",
            createdAt: "2023-05-16T11:10:00Z",
            scheduledFor: "2023-05-21T15:30:00Z",
            completedAt: null,
            paymentStatus: "unpaid",
            paymentAmount: null
          }
        ]
        
        setRequests(mockRequests)
      } catch (error) {
        console.error('Error fetching service requests:', error)
        toast({
          title: "Error",
          description: "Failed to load service requests",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequests()
  }, [toast])

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicleDetails.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesUrgency = urgencyFilter === "all" || request.urgency === urgencyFilter
    
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const handleViewRequest = (request: ServiceRequest) => {
    setViewRequest(request)
    setDetailsOpen(true)
  }

  const handleAssignMechanic = (requestId: string) => {
    // This would typically be an API call
    toast({
      title: "Assigning mechanic",
      description: `Assigning mechanic to request ${requestId}`,
    })
  }

  const handleUpdateStatus = (requestId: string, newStatus: ServiceRequest['status']) => {
    // This would typically be an API call
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    )
    
    toast({
      title: "Status updated",
      description: `Request ${requestId} status changed to ${newStatus}`,
    })
  }

  const getStatusBadge = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
        )
      case 'assigned':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <Check className="h-4 w-4" />
            <span>Assigned</span>
          </div>
        )
      case 'in_progress':
        return (
          <div className="flex items-center gap-1 text-purple-600">
            <AlertTriangle className="h-4 w-4" />
            <span>In Progress</span>
          </div>
        )
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
            <span>Completed</span>
          </div>
        )
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <X className="h-4 w-4" />
            <span>Cancelled</span>
          </div>
        )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Service Requests</h1>
        <Button onClick={() => router.push('/dashboard/admin')}>
          Back to Dashboard
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
          <CardDescription>
            Use the filters below to find specific service requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search by ID, customer, or service..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Urgency</label>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgencies</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
          <CardDescription>
            Showing {filteredRequests.length} of {requests.length} total requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <Table>
              <TableCaption>List of service requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No service requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.customerName}</TableCell>
                      <TableCell>{request.serviceType}</TableCell>
                      <TableCell>{request.vehicleDetails}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="capitalize">{request.urgency}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {request.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleAssignMechanic(request.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Assign Mechanic
                              </DropdownMenuItem>
                            )}
                            {(request.status === 'pending' || request.status === 'assigned') && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'in_progress')}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Mark In Progress
                              </DropdownMenuItem>
                            )}
                            {request.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'completed')}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            {(request.status === 'pending' || request.status === 'assigned') && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'cancelled')}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Request
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
      
      {/* Service Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service Request Details</DialogTitle>
            <DialogDescription>
              Complete information about service request {viewRequest?.id}
            </DialogDescription>
          </DialogHeader>
          
          {viewRequest && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="details">Request Details</TabsTrigger>
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="mechanic">Mechanic & Payment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Service Type</h4>
                    <p className="text-base">{viewRequest.serviceType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Vehicle</h4>
                    <p className="text-base">{viewRequest.vehicleDetails}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <p className="text-base capitalize">{viewRequest.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Urgency</h4>
                    <p className="text-base capitalize">{viewRequest.urgency}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                    <p className="text-base">{new Date(viewRequest.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Scheduled For</h4>
                    <p className="text-base">
                      {viewRequest.scheduledFor 
                        ? new Date(viewRequest.scheduledFor).toLocaleString() 
                        : "Not scheduled yet"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                    <p className="text-base">{viewRequest.location}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="text-base">{viewRequest.description}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="customer" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Customer ID</h4>
                    <p className="text-base">{viewRequest.customerId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                    <p className="text-base">{viewRequest.customerName}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                    <p className="text-base">{viewRequest.customerEmail}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => router.push(`/dashboard/admin/users?id=${viewRequest.customerId}`)}>
                    View Customer Profile
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="mechanic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Mechanic ID</h4>
                    <p className="text-base">{viewRequest.mechanicId || "Not assigned"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Mechanic Name</h4>
                    <p className="text-base">{viewRequest.mechanicName || "Not assigned"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Status</h4>
                    <p className="text-base capitalize">{viewRequest.paymentStatus.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Amount</h4>
                    <p className="text-base">
                      {viewRequest.paymentAmount 
                        ? `$${viewRequest.paymentAmount.toFixed(2)}` 
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Completed At</h4>
                    <p className="text-base">
                      {viewRequest.completedAt 
                        ? new Date(viewRequest.completedAt).toLocaleString() 
                        : "Not completed yet"}
                    </p>
                  </div>
                </div>
                {!viewRequest.mechanicId && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button onClick={() => handleAssignMechanic(viewRequest.id)}>
                      Assign Mechanic
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {viewRequest && viewRequest.status !== 'completed' && viewRequest.status !== 'cancelled' && (
              <Button 
                onClick={() => {
                  handleUpdateStatus(viewRequest.id, 
                    viewRequest.status === 'in_progress' 
                      ? 'completed' 
                      : viewRequest.status === 'assigned' 
                        ? 'in_progress' 
                        : 'assigned'
                  )
                  setDetailsOpen(false)
                }}
              >
                {viewRequest.status === 'in_progress' 
                  ? 'Mark as Completed'
                  : viewRequest.status === 'assigned' 
                    ? 'Mark as In Progress'
                    : 'Assign & Accept'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 