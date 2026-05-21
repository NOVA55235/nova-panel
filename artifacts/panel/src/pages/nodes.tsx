import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListNodes,
  useCreateNode,
  getListNodesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Network, Search, Plus, Loader2, MapPin, Cpu, MemoryStick, HardDrive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const createNodeSchema = z.object({
  name: z.string().min(1, "Name is required").max(64),
  fqdn: z.string().min(1, "FQDN or IP is required"),
  ip: z.string().min(1, "IP address is required"),
  port: z.coerce.number().int().min(1).max(65535).default(8080),
  cpuCores: z.coerce.number().int().min(1).max(512),
  memoryMb: z.coerce.number().int().min(512),
  diskGb: z.coerce.number().int().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
});

type CreateNodeForm = z.infer<typeof createNodeSchema>;

export default function Nodes() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: nodes, isLoading } = useListNodes({
    query: { queryKey: getListNodesQueryKey() },
  });

  const createNode = useCreateNode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNodesQueryKey() });
        toast({ title: "Node added", description: "Node registered successfully." });
        setDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Failed to add node", description: err?.message || "An error occurred.", variant: "destructive" });
      },
    },
  });

  const form = useForm<CreateNodeForm>({
    resolver: zodResolver(createNodeSchema),
    defaultValues: {
      name: "",
      fqdn: "",
      ip: "",
      port: 8080,
      cpuCores: 4,
      memoryMb: 8192,
      diskGb: 100,
      location: "",
      description: "",
    },
  });

  function onSubmit(values: CreateNodeForm) {
    createNode.mutate({ data: values });
  }

  const filteredNodes = nodes?.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.fqdn.toLowerCase().includes(search.toLowerCase()) ||
      (n.location && n.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nodes</h2>
          <p className="text-muted-foreground mt-1">
            Manage your infrastructure nodes. No limit — add as many as you need.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Node
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search nodes..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="text-xs px-3 py-1">
          {nodes?.length ?? 0} nodes
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNodes?.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border border-border border-dashed">
          <Network className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No nodes found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "No nodes match your search." : "Add your first node to start hosting servers."}
          </p>
          {!search && (
            <Button className="mt-4" variant="outline" onClick={() => setDialogOpen(true)}>
              Add your first node
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNodes?.map((node) => (
            <Link key={node.id} href={`/nodes/${node.id}`}>
              <Card className="hover:border-primary/50 transition-all duration-200 cursor-pointer bg-card/80 backdrop-blur-sm group hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {node.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${node.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      <Badge variant="secondary" className={node.isOnline ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                        {node.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Network className="h-3 w-3" /> {node.fqdn}
                    </span>
                    {node.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {node.location}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-sm p-3 bg-background/60 rounded-md border border-border/50">
                    <div className="text-center">
                      <Cpu className="h-3 w-3 text-primary mx-auto mb-1" />
                      <p className="text-muted-foreground text-xs">CPU</p>
                      <p className="font-semibold text-sm">{node.cpuCores}c</p>
                    </div>
                    <div className="text-center border-l border-r border-border/50">
                      <MemoryStick className="h-3 w-3 text-primary mx-auto mb-1" />
                      <p className="text-muted-foreground text-xs">RAM</p>
                      <p className="font-semibold text-sm">{(node.memoryMb / 1024).toFixed(0)}GB</p>
                    </div>
                    <div className="text-center">
                      <HardDrive className="h-3 w-3 text-primary mx-auto mb-1" />
                      <p className="text-muted-foreground text-xs">Disk</p>
                      <p className="font-semibold text-sm">{node.diskGb}GB</p>
                    </div>
                  </div>
                  {node.description && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">{node.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {formatDistanceToNow(new Date(node.createdAt), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Register New Node
            </DialogTitle>
            <DialogDescription>
              Connect a new infrastructure node to the panel. Install the daemon on the node first.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Node Name</FormLabel>
                      <FormControl>
                        <Input placeholder="US-East-1" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="New York, USA" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fqdn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FQDN / Hostname</FormLabel>
                      <FormControl>
                        <Input placeholder="node1.example.com" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="45.76.100.10" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daemon Port</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="8080" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cpuCores"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU Cores</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="8" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memoryMb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memory (MB)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="16384" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diskGb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disk (GB)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Primary game server node" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); form.reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNode.isPending}>
                  {createNode.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" /> Register Node</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
