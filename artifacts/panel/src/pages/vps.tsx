import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useListVps,
  getListVpsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateInstanceDialog } from "@/components/create-instance-dialog";
import { HardDrive, Search, Loader2, Cpu, Globe, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SiUbuntu, SiDebian } from "react-icons/si";

export default function Vps() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: vpsList, isLoading, refetch } = useListVps({
    query: { queryKey: getListVpsQueryKey() }
  });

  const filteredVps = vpsList?.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.ipAddress.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "stopped": return "bg-muted text-muted-foreground border-border";
      case "error": return "bg-destructive/15 text-destructive border-destructive/30";
      default: return "bg-primary/15 text-primary border-primary/30";
    }
  };

  const getOsIcon = (osTemplate: string) => {
    if (osTemplate.includes("ubuntu")) return <SiUbuntu className="w-4 h-4 text-orange-400" />;
    if (osTemplate.includes("debian")) return <SiDebian className="w-4 h-4 text-red-400" />;
    return <HardDrive className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="space-y-6 anim-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <HardDrive className="h-7 w-7 text-primary" />
            VPS Instances
          </h2>
          <p className="text-muted-foreground mt-1">
            {user?.role === "admin"
              ? "Virtual private servers with full root access. Pick a plan, assign to user, deploy."
              : "VPS instances your administrator has assigned to you. You can manage them here."}
          </p>
        </div>
        {user?.role === "admin" && <CreateInstanceDialog kind="vps" onCreated={refetch} />}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or IP..."
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filteredVps && (
          <Badge variant="outline" className="border-primary/30 text-primary tabular-nums">
            {filteredVps.length} {filteredVps.length === 1 ? "instance" : "instances"}
          </Badge>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVps?.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-xl border border-border border-dashed anim-fade-scale">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <HardDrive className="h-10 w-10 text-primary anim-float" />
          </div>
          <h3 className="text-lg font-semibold">No VPS instances</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search
              ? "No instances match your search criteria."
              : "Click 'Create VPS' above to deploy your first virtual server."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 stagger">
          {filteredVps?.map((vps) => (
            <Link key={vps.id} href={`/vps/${vps.id}`}>
              <Card className="card-hover cursor-pointer bg-card/60 backdrop-blur-sm group h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                        {getOsIcon(vps.osTemplate)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                          {vps.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5 truncate">{vps.osTemplate}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(vps.status)} text-[10px] uppercase shrink-0 capitalize`}>
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current inline-block" />
                      {vps.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> IP Address</p>
                      <p className="font-mono text-primary truncate">{vps.ipAddress}</p>
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> Specs</p>
                      <p className="font-mono text-foreground truncate">{vps.cpuCores} vCPU · {vps.memoryMb}MB</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Network className="h-3 w-3" /> {vps.nodeId}</span>
                    <span>{formatDistanceToNow(new Date(vps.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
