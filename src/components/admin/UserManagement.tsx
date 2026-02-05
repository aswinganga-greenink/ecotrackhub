import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUsers } from '@/lib/mockData';
import { User, UserRole } from '@/types/carbon';
import { UserPlus, Pencil, Trash2, Shield, UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api, Panchayat } from '@/lib/api';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', role: 'user' as UserRole, panchayatId: '' });
  const { toast } = useToast();

  useEffect(() => {
    const loadPanchayats = async () => {
      try {
        const data = await api.getPanchayats();
        setPanchayats(data);
      } catch (error) {
        console.error("Failed to load panchayats", error);
        toast({ title: 'Error', description: 'Failed to load panchayats', variant: 'destructive' });
      }
    };
    loadPanchayats();
  }, []);

  const getPanchayatName = (panchayatId?: string) => {
    if (!panchayatId) return 'All (Admin)';
    const panchayat = panchayats.find(p => p.id === panchayatId);
    return panchayat?.name || 'Unknown';
  };

  const handleAddUser = () => {
    if (!newUser.username) {
      toast({ title: 'Error', description: 'Username is required', variant: 'destructive' });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      role: newUser.role,
      panchayatId: newUser.role === 'user' ? newUser.panchayatId : undefined,
    };

    setUsers([...users, user]);
    setNewUser({ username: '', role: 'user', panchayatId: '' });
    setIsAddDialogOpen(false);
    toast({ title: 'Success', description: 'User added successfully' });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    toast({ title: 'Success', description: 'User updated successfully' });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === '1') {
      toast({ title: 'Error', description: 'Cannot delete primary admin', variant: 'destructive' });
      return;
    }
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: 'Success', description: 'User deleted successfully' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage system users and their access levels</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with role and panchayat assignment</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'user' && (
                <div className="space-y-2">
                  <Label htmlFor="panchayat">Assigned Panchayat</Label>
                  <Select value={newUser.panchayatId} onValueChange={(value) => setNewUser({ ...newUser, panchayatId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select panchayat" />
                    </SelectTrigger>
                    <SelectContent>
                      {panchayats.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Panchayat</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                    {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{getPanchayatName(user.panchayatId)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                          <DialogDescription>Update user details and permissions</DialogDescription>
                        </DialogHeader>
                        {editingUser && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Username</Label>
                              <Input
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select
                                value={editingUser.role}
                                onValueChange={(value: UserRole) => setEditingUser({ ...editingUser, role: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {editingUser.role === 'user' && (
                              <div className="space-y-2">
                                <Label>Assigned Panchayat</Label>
                                <Select
                                  value={editingUser.panchayatId || ''}
                                  onValueChange={(value) => setEditingUser({ ...editingUser, panchayatId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select panchayat" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {panchayats.map(p => (
                                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                          <Button onClick={handleUpdateUser}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
