"use client";

import { useState, useEffect } from 'react';
import { 
  User, UserPlus, Search, Filter, MoreHorizontal, 
  Edit, Lock, ShieldAlert, Trash, CheckCircle, XCircle 
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// This would be imported from your types file
interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'customer' | 'mechanic' | 'driver';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  
  // Fetch users (simulated for now)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        // This would be a real API call in production
        // Simulating API response with mock data
        setTimeout(() => {
          const mockUsers: UserData[] = [
            {
              id: '1',
              email: 'john@example.com',
              first_name: 'John',
              last_name: 'Doe',
              role: 'customer',
              status: 'active',
              created_at: '2023-06-15',
            },
            {
              id: '2',
              email: 'jane@example.com',
              first_name: 'Jane',
              last_name: 'Smith',
              role: 'mechanic',
              status: 'active',
              created_at: '2023-06-10',
            },
            {
              id: '3',
              email: 'bob@example.com',
              first_name: 'Bob',
              last_name: 'Johnson',
              role: 'driver',
              status: 'pending',
              created_at: '2023-06-20',
            },
            {
              id: '4',
              email: 'sarah@example.com',
              first_name: 'Sarah',
              last_name: 'Williams',
              role: 'customer',
              status: 'suspended',
              created_at: '2023-06-05',
            },
            {
              id: '5',
              email: 'admin@example.com',
              first_name: 'Admin',
              last_name: 'User',
              role: 'admin',
              status: 'active',
              created_at: '2023-06-01',
            },
          ];
          
          setUsers(mockUsers);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [user]);
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === null || user.role === selectedRole;
    const matchesStatus = selectedStatus === null || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Handle editing a user
  const handleEditUser = (userData: UserData) => {
    setCurrentUser(userData);
    setIsEditDialogOpen(true);
  };
  
  // Handle saving edited user
  const handleSaveUser = () => {
    if (!currentUser) return;
    
    // In a real app, you would make an API call to update the user
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUser.id ? currentUser : user
      )
    );
    
    toast({
      title: "User Updated",
      description: `${currentUser.first_name} ${currentUser.last_name}'s information has been updated.`,
    });
    
    setIsEditDialogOpen(false);
  };
  
  // Simulate suspending a user
  const handleSuspendUser = (userData: UserData) => {
    // In a real app, you would make an API call to suspend the user
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userData.id 
          ? { ...user, status: user.status === 'suspended' ? 'active' : 'suspended' } 
          : user
      )
    );
    
    toast({
      title: userData.status === 'suspended' ? "User Activated" : "User Suspended",
      description: `${userData.first_name} ${userData.last_name} has been ${userData.status === 'suspended' ? 'activated' : 'suspended'}.`,
    });
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      default:
        return null;
    }
  };
  
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their permissions</p>
        </div>
        
        <Button className="mt-4 md:mt-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={selectedRole || ''} onValueChange={(value) => setSelectedRole(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{selectedRole ? `Role: ${selectedRole}` : 'Filter by role'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus || ''} onValueChange={(value) => setSelectedStatus(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{selectedStatus ? `Status: ${selectedStatus}` : 'Filter by status'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} users found {searchTerm && `matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.created_at}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Lock className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                              {user.status === 'suspended' ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Suspend
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's information here.
            </DialogDescription>
          </DialogHeader>
          
          {currentUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input 
                    id="first_name" 
                    value={currentUser.first_name}
                    onChange={(e) => setCurrentUser({...currentUser, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name" 
                    value={currentUser.last_name}
                    onChange={(e) => setCurrentUser({...currentUser, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={currentUser.role} 
                  onValueChange={(value: any) => setCurrentUser({...currentUser, role: value})}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={currentUser.status} 
                  onValueChange={(value: any) => setCurrentUser({...currentUser, status: value})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 