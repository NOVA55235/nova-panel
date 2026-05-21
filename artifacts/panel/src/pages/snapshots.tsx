import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera, Search, RotateCcw, Trash2, Loader2, AlertTriangle,
  HardDrive, Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Snapshot {
  id: number;
  vpsName: string;
  vpsId: number;
  name: string;
  sizeGb: number;
  createdAt: string;
  status: "ready" | "creating" | "restoring";
}

const SEED: Snapshot[] = [
  { id: 1, vpsName: "web-prod-01", vpsId: 1, name: "pre-upgrade-snapshot", sizeGb: 24.7, createdAt: new Date(Date.now() - 3600_000 * 6).toISOString(), status: "ready" },
  { id: 2, vpsName: "db-master", vpsId: 2, name: "nightly-2025-12-15", sizeGb: 142.3, createdAt: new Date(Date.now() - 3600_000 * 36).toISOString(), status: "ready" },
  { id: 3, vpsName: "web-prod-01", vpsId: 1, name: "stable-baseline", sizeGb: 18.2, createdAt: new Date(Date.now() - 3600_000 * 96).toISOString(), status: "ready" },
  { id: 4, vpsName: "discord-bot-01", vpsId: 3, name: "pre-update", sizeGb: 3.1, createdAt: new Date(Date.now() - 3600_000 * 12).toISOString(), status: "ready" },
];

export default function Snapshots() {
  const [snaps, setSnaps] = useState<Snapshot[]>(SEED);
  const [search, setSearch] = useState("");
  const [confirmRestore, setConfirmRestore] = useState<Snapshot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Snapshot | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const filtered = snaps.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.vpsName.toLowerCase().includes(search.toLowerCase())
  );

  function handleRestore(snap: Snapshot) {
    setBusyId(snap.id);
    setSnaps(curr => curr.map(s => s.id === snap.id ? { ...s, status: "restoring" } : s));
    setConfirmRestore(null);
    setTimeout(() => {
      setSnaps(curr => curr.map(s => s.id === snap.id ? { ...s, status: "ready" } : s));
      setBusyId(null);
      toast({ title: "Snapshot restored", description: `${snap.vpsName} rolled back to "${snap.name}".` });
    }, 2500);
  }

  function handleDelete(snap: Snapshot) {
    setSnaps(curr => curr.filter(s => s.id !== snap.id));
    setConfirmDelete(null);
    toast({ title: "Snapshot deleted" });
  }

  return (
    <div className="space-y-6 anim-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Camera className="h-7 w-7 text-primary" />
          VPS Snapshots
        </h2>
        <p className="text-muted-foreground mt-1">
          Block-level disk snapshots. Roll back instantly to any point — far faster than backup restore.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by VPS or snapshot name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary tabular-nums">
          {filtered.length} {filtered.length === 1 ? "snapshot" : "snapshots"}
        </Badge>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">All Snapshots</CardTitle>
          <CardDescription>Take new snapshots from a VPS detail page → Snapshots tab.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map(snap => (
              <div key={snap.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{snap.name}</p>
                    <Badge variant="outline" className="text-[10px] border-border shrink-0">
                      <HardDrive className="h-2.5 w-2.5 mr-1" />{snap.vpsName}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(snap.createdAt), { addSuffix: true })}
                    <span>·</span>
                    <span className="font-mono">{snap.sizeGb.toFixed(1)} GB</span>
                  </p>
                </div>
                <Badge variant="outline" className={
                  snap.status === "ready" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                  "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }>
                  {snap.status !== "ready" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {snap.status}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:text-amber-400"
                    title="Roll back"
                    disabled={snap.status !== "ready" || busyId === snap.id}
                    onClick={() => setConfirmRestore(snap)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title="Delete"
                    onClick={() => setConfirmDelete(snap)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <Camera className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No snapshots yet. Create one from a VPS detail page.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restore confirm */}
      <Dialog open={!!confirmRestore} onOpenChange={(o) => !o && setConfirmRestore(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Roll back to snapshot?
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className="font-semibold text-foreground">{confirmRestore?.vpsName}</span> will be rolled back to the state captured in{" "}
              <span className="font-semibold text-foreground">"{confirmRestore?.name}"</span>.
              All changes since {confirmRestore && formatDistanceToNow(new Date(confirmRestore.createdAt), { addSuffix: true })} will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black gap-2" onClick={() => confirmRestore && handleRestore(confirmRestore)}>
              <RotateCcw className="h-4 w-4" /> Roll back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete snapshot?
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className="font-semibold text-foreground">"{confirmDelete?.name}"</span> ({confirmDelete?.sizeGb.toFixed(1)} GB) will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="gap-2" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              <Trash2 className="h-4 w-4" /> Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
