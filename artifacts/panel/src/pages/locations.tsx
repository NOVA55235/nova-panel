import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Plus, Loader2, Trash2, Globe, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const token = () => localStorage.getItem("gamepanel_token") || "";

async function fetchLocations() {
  const r = await fetch(`${API_BASE}/api/locations`, { headers: { Authorization: `Bearer ${token()}` } });
  return r.json();
}

async function createLocation(data: any) {
  const r = await fetch(`${API_BASE}/api/locations`, {
    method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

async function deleteLocation(id: number) {
  await fetch(`${API_BASE}/api/locations/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
}

import { useQuery, useMutation } from "@tanstack/react-query";

const locationSchema = z.object({
  name: z.string().min(1, "Required"),
  shortCode: z.string().min(1, "Required").max(10),
  country: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
});
type LocationForm = z.infer<typeof locationSchema>;

const LOCATION_QUERY_KEY = ["locations"];

export default function Locations() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({ queryKey: LOCATION_QUERY_KEY, queryFn: fetchLocations });

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", shortCode: "", country: "", city: "", description: "" },
  });

  const create = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEY });
      toast({ title: "Location created" });
      setCreateOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to create location.", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEY });
      toast({ title: "Location deleted" });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground mt-1">Manage datacenter locations and regions for your nodes.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Location
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : locations.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border border-border border-dashed">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No locations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add a location to organize your nodes by datacenter or region.</p>
          <Button className="mt-4" variant="outline" onClick={() => setCreateOpen(true)}>Add First Location</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc: any) => (
            <Card key={loc.id} className="bg-card/80 border-border hover:border-primary/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{loc.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-0.5 font-mono border-border">{loc.shortCode}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(loc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(loc.city || loc.country) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Globe className="h-3 w-3" /> {[loc.city, loc.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {loc.description && <p className="text-xs text-muted-foreground">{loc.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Add Location</DialogTitle>
            <DialogDescription>Create a new datacenter location. Nodes can be assigned to locations.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => create.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="US East" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="shortCode" render={({ field }) => (
                  <FormItem><FormLabel>Short Code</FormLabel><FormControl><Input placeholder="US-E" {...field} className="bg-background font-mono uppercase" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="United States" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="New York" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Input placeholder="Primary East Coast datacenter" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); form.reset(); }}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add Location
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[380px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Location</DialogTitle>
            <DialogDescription>Are you sure? Make sure no nodes are assigned to this location first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget)}>
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
