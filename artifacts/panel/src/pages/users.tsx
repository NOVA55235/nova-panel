import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users as UsersIcon, Plus, Loader2, Shield, User as UserIcon, MoreHorizontal, Trash2, Edit2, Search, Copy, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "At least 3 characters"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function Users() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ email: "", username: "", firstName: "", lastName: "", role: "user" as "user" | "admin" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User updated" });
        setEditTarget(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.message || "Failed to update user.", variant: "destructive" });
      },
    },
  });

  function openEdit(u: User) {
    setEditForm({ email: u.email, username: u.username, firstName: u.firstName, lastName: u.lastName, role: u.role as "user" | "admin" });
    setEditTarget(u);
  }

  function toggleSuspend(u: User) {
    updateUser.mutate({ id: u.id, data: { isActive: !u.isActive } });
  }

  const { data: users, isLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() },
  });

  const createUser = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User created", description: "Account created successfully. Share credentials with the user." });
        setCreateOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.message || "Failed to create user.", variant: "destructive" });
      },
    },
  });

  const deleteUser = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User deleted", description: "User account has been removed." });
        setDeleteTarget(null);
      },
    },
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", username: "", firstName: "", lastName: "", password: "", role: "user" },
  });

  const filtered = users?.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    const pwd = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    form.setValue("password", pwd);
    navigator.clipboard?.writeText(pwd);
    toast({ title: "Password generated & copied to clipboard" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground mt-1">Manage user accounts, permissions, and resource limits.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-8 bg-card" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{users?.length ?? 0} users</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered?.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`flex w-fit items-center gap-1 ${user.role === "admin" ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background"}`}>
                        {user.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3 text-muted-foreground" />}
                        <span className="capitalize font-semibold">{user.role}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.isActive
                          ? <><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-green-500 text-xs font-medium">Active</span></>
                          : <><XCircle className="h-4 w-4 text-red-500" /><span className="text-red-500 text-xs font-medium">Suspended</span></>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleSuspend(user)} disabled={updateUser.isPending}>
                            {user.isActive ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            {user.isActive ? "Suspend" : "Unsuspend"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" /> Create New User
            </DialogTitle>
            <DialogDescription>
              Create a user account. They can log in from the register page or you can share these credentials directly.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => createUser.mutate({ data: v }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Jane" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="jane@example.com" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="janedoe" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input type="text" placeholder="••••••••" {...field} className="bg-background font-mono" /></FormControl>
                    <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="shrink-0 gap-1">
                      <Copy className="h-3 w-3" /> Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); form.reset(); }}>Cancel</Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="mr-2 h-4 w-4" /> Create User</>}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> Edit User
            </DialogTitle>
            <DialogDescription>Update profile, email, or role. Use the suspend toggle in the menu to lock account access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">First Name</Label>
                <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="bg-background" />
              </div>
              <div>
                <Label className="mb-1.5 block">Last Name</Label>
                <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="bg-background" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Username</Label>
              <Input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v as "user" | "admin" })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              disabled={updateUser.isPending}
              onClick={() => editTarget && updateUser.mutate({ id: editTarget.id, data: editForm })}
            >
              {updateUser.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
            <DialogDescription>This action is irreversible. All servers and VPS instances owned by this user must be deleted first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteUser.isPending} onClick={() => deleteTarget && deleteUser.mutate({ id: deleteTarget })}>
              {deleteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
