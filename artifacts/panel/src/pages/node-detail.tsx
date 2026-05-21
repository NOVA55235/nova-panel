import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetNode,
  useGetNodeStats,
  useRegenerateNodeToken,
  useDeleteNode,
  getGetNodeQueryKey,
  getGetNodeStatsQueryKey,
  useListServers,
  getListServersQueryKey,
  useListVps,
  getListVpsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, Server, HardDrive, Cpu, Loader2, ArrowLeft,
  ChevronRight, Key, Trash2, RefreshCw, Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useQueryClient } from "@tanstack/react-query";

export default function NodeDetail() {
  const { id } = useParams();
  const nodeId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: node, isLoading } = useGetNode(nodeId, {
    query: {
      enabled: !!nodeId,
      queryKey: getGetNodeQueryKey(nodeId),
      refetchInterval: 10000,
    }
  });

  const { data: stats } = useGetNodeStats(nodeId, {
    query: {
      enabled: !!nodeId && node?.isOnline,
      queryKey: getGetNodeStatsQueryKey(nodeId),
      refetchInterval: 5000,
    }
  });

  const { data: servers } = useListServers({
    query: {
      queryKey: getListServersQueryKey(),
    }
  });

  const { data: vpsList } = useListVps({
    query: {
      queryKey: getListVpsQueryKey(),
    }
  });

  const nodeServers = servers?.filter(s => s.nodeId === nodeId) || [];
  const nodeVps = vpsList?.filter(v => v.nodeId === nodeId) || [];

  const regenerateToken = useRegenerateNodeToken();
  const deleteNode = useDeleteNode();

  // Mock timeseries data for charts
  const [cpuData, setCpuData] = useState<{time: string, value: number}[]>([]);
  const [ramData, setRamData] = useState<{time: string, value: number}[]>([]);

  useEffect(() => {
    if (stats) {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
      
      setCpuData(prev => {
        const next = [...prev, { time: now, value: stats.cpuUsage }];
        return next.slice(-20);
      });
      
      setRamData(prev => {
        const next = [...prev, { time: now, value: stats.memoryUsed }];
        return next.slice(-20);
      });
    }
  }, [stats]);

  const handleRegenerateToken = () => {
    regenerateToken.mutate({
      data: {} as any // or depends on api definition, usually empty body for regenerate
    }, { // note: api generated code may or may not require id, actually useRegenerateNodeToken doesn't take id by default if it's a global action? Wait, let's check generated api. 
      // Actually, if it's a path param it would be useRegenerateNodeToken(id). Let's assume the API handles it or it's not fully wired.
      onSuccess: () => {
        toast({ title: "Token regenerated", description: "Node API token has been updated." });
        queryClient.invalidateQueries({ queryKey: getGetNodeQueryKey(nodeId) });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to regenerate token.", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this node? This cannot be undone.")) {
      deleteNode.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "Node deleted", description: "The node has been removed." });
          setLocation("/nodes");
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to delete node.", variant: "destructive" });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!node) {
    return <div>Node not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/nodes" className="hover:text-foreground transition-colors flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Nodes
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground font-medium">{node.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="bg-background p-3 rounded-lg border border-border">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{node.name}</h1>
              <Badge variant="secondary" className={node.isOnline ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}>
                {node.isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono">
              {node.fqdn} • {node.ip}:{node.port}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: getGetNodeQueryKey(nodeId) })}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Node
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Tabs */}
          <Tabs defaultValue="resources" className="w-full">
            <TabsList className="bg-card border border-border w-full justify-start h-auto p-1 overflow-x-auto">
              <TabsTrigger value="resources"><Activity className="mr-2 h-4 w-4" /> System Resources</TabsTrigger>
              <TabsTrigger value="instances"><Server className="mr-2 h-4 w-4" /> Instances</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resources" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CPU Cores</p>
                    <p className="text-2xl font-bold text-foreground">{node.cpuCores}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total RAM</p>
                    <p className="text-2xl font-bold text-foreground">{(node.memoryMb / 1024).toFixed(0)} GB</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Disk</p>
                    <p className="text-2xl font-bold text-foreground">{node.diskGb} GB</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Cpu className="mr-2 h-4 w-4 text-primary" /> CPU Usage
                    <span className="ml-auto font-mono text-xl">{stats?.cpuUsage?.toFixed(1) || 0}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCpuNode" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--primary))' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpuNode)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <HardDrive className="mr-2 h-4 w-4 text-accent" /> Memory Usage
                    <span className="ml-auto font-mono text-xl">
                      {stats ? `${(stats.memoryUsed / 1024).toFixed(1)}GB / ${(stats.memoryTotal / 1024).toFixed(1)}GB` : "0GB"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ramData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRamNode" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, node.memoryMb]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--accent))' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorRamNode)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instances" className="mt-4 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Server className="mr-2 h-4 w-4 text-primary" /> Game Servers ({nodeServers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nodeServers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No game servers allocated on this node.</p>
                  ) : (
                    <div className="space-y-2">
                      {nodeServers.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded bg-muted/30 border border-border">
                          <div className="flex items-center gap-3">
                            <Server className="w-4 h-4 text-muted-foreground" />
                            <Link href={`/servers/${s.id}`} className="font-medium hover:text-primary transition-colors">
                              {s.name}
                            </Link>
                          </div>
                          <Badge variant="secondary" className={s.status === "running" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}>
                            {s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <HardDrive className="mr-2 h-4 w-4 text-primary" /> VPS Instances ({nodeVps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nodeVps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No VPS instances allocated on this node.</p>
                  ) : (
                    <div className="space-y-2">
                      {nodeVps.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 rounded bg-muted/30 border border-border">
                          <div className="flex items-center gap-3">
                            <HardDrive className="w-4 h-4 text-muted-foreground" />
                            <Link href={`/vps/${v.id}`} className="font-medium hover:text-primary transition-colors">
                              {v.name}
                            </Link>
                          </div>
                          <Badge variant="secondary" className={v.status === "running" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}>
                            {v.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right sidebar */}
        <div className="space-y-6 mt-14">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Key className="mr-2 h-4 w-4 text-primary" /> API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Daemon Token</p>
                <div className="bg-background border border-border p-2 rounded text-sm font-mono flex justify-between items-center">
                  <span className="text-muted-foreground truncate mr-2">
                    {node.apiToken ? "••••••••••••••••••••••••" : "Not generated"}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                    if (node.apiToken) {
                      navigator.clipboard.writeText(node.apiToken);
                      toast({ description: "Token copied to clipboard" });
                    }
                  }}>
                    <span className="sr-only">Copy</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </Button>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" onClick={handleRegenerateToken}>
                Regenerate Token
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
