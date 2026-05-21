import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe2, Plus, Trash2, Network, Loader2 } from "lucide-react";

interface Pool {
  id: number;
  name: string;
  cidr: string;
  type: "ipv4" | "ipv6";
  gateway: string;
  total: number;
  used: number;
  nodeId: string;
}

const SEED_POOLS: Pool[] = [
  { id: 1, name: "us-east-public-v4", cidr: "203.0.113.0/24", type: "ipv4", gateway: "203.0.113.1", total: 254, used: 142, nodeId: "node-1" },
  { id: 2, name: "us-east-public-v6", cidr: "2001:db8:1::/64", type: "ipv6", gateway: "2001:db8:1::1", total: 65536, used: 1820, nodeId: "node-1" },
  { id: 3, name: "eu-central-public-v4", cidr: "198.51.100.0/24", type: "ipv4", gateway: "198.51.100.1", total: 254, used: 89, nodeId: "node-2" },
  { id: 4, name: "us-west-private", cidr: "10.20.0.0/16", type: "ipv4", gateway: "10.20.0.1", total: 65534, used: 312, nodeId: "node-3" },
];

export default function AddressPools() {
  const [pools, setPools] = useState<Pool[]>(SEED_POOLS);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", cidr: "", type: "ipv4" as "ipv4" | "ipv6", gateway: "", nodeId: "node-1"
  });
  const { toast } = useToast();

  function pctUsed(p: Pool) {
    return Math.round((p.used / p.total) * 100);
  }

  function handleAdd() {
    if (!form.name.trim() || !form.cidr.trim() || !form.gateway.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const newPool: Pool = {
      id: Date.now(),
      ...form,
      total: form.type === "ipv4" ? 254 : 65536,
      used: 0,
    };
    setPools([newPool, ...pools]);
    setForm({ name: "", cidr: "", type: "ipv4", gateway: "", nodeId: "node-1" });
    setOpen(false);
    setSubmitting(false);
    toast({ title: "Address pool created", description: `${newPool.cidr} on ${newPool.nodeId}` });
  }

  function handleDelete(id: number) {
    setPools(pools.filter(p => p.id !== id));
    toast({ title: "Pool removed" });
  }

  const totalIps = pools.reduce((s, p) => s + p.total, 0);
  const usedIps = pools.reduce((s, p) => s + p.used, 0);

  return (
    <div className="space-y-6 anim-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-primary" />
            Address Pools
          </h2>
          <p className="text-muted-foreground mt-1">
            IPv4 and IPv6 ranges allocated to nodes. New VPS instances draw from these pools.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="everest-glow gap-2 font-semibold">
              <Plus className="h-4 w-4" /> New Address Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" /> Allocate IP Range
              </DialogTitle>
              <DialogDescription>
                Define an IPv4 or IPv6 CIDR block. Addresses will be auto-assigned to new VPS instances on this node.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pool Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. us-east-public-v4" className="bg-background mt-1.5 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-background mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ipv4">IPv4</SelectItem>
                      <SelectItem value="ipv6">IPv6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Node</Label>
                  <Select value={form.nodeId} onValueChange={v => setForm({ ...form, nodeId: v })}>
                    <SelectTrigger className="bg-background mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="node-1">node-1</SelectItem>
                      <SelectItem value="node-2">node-2</SelectItem>
                      <SelectItem value="node-3">node-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>CIDR Block</Label>
                <Input value={form.cidr} onChange={e => setForm({ ...form, cidr: e.target.value })} placeholder={form.type === "ipv4" ? "203.0.113.0/24" : "2001:db8::/64"} className="bg-background mt-1.5 font-mono" />
              </div>
              <div>
                <Label>Gateway</Label>
                <Input value={form.gateway} onChange={e => setForm({ ...form, gateway: e.target.value })} placeholder={form.type === "ipv4" ? "203.0.113.1" : "2001:db8::1"} className="bg-background mt-1.5 font-mono" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting} className="everest-glow gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Pool
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pools</p>
            <p className="text-2xl font-bold mt-1">{pools.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Addresses</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{totalIps.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Allocated</p>
            <p className="text-2xl font-bold text-primary mt-1 tabular-nums">{usedIps.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pool list */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 stagger">
        {pools.map(pool => (
          <Card key={pool.id} className="bg-card border-border card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Globe2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{pool.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-0.5 truncate">{pool.cidr}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">
                    {pool.type}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(pool.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Gateway</p>
                  <p className="font-mono truncate">{pool.gateway}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1"><Network className="h-3 w-3" /> Node</p>
                  <p className="font-mono">{pool.nodeId}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Allocation</span>
                  <span className="font-mono tabular-nums">{pool.used.toLocaleString()} / {pool.total.toLocaleString()} ({pctUsed(pool)}%)</span>
                </div>
                <Progress value={pctUsed(pool)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
