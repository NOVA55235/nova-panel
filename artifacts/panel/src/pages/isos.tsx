import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Disc, Plus, Trash2, Download, Search, Loader2, CheckCircle2 } from "lucide-react";

interface ISO {
  id: number;
  name: string;
  url: string;
  os: string;
  sizeMb: number;
  status: "ready" | "downloading" | "failed";
  uploadedAt: string;
}

const SEED_ISOS: ISO[] = [
  { id: 1, name: "ubuntu-24.04-live-server-amd64.iso", url: "https://releases.ubuntu.com/24.04/", os: "Ubuntu 24.04", sizeMb: 2048, status: "ready", uploadedAt: "2025-12-01" },
  { id: 2, name: "debian-12.5.0-amd64-netinst.iso", url: "https://www.debian.org/distrib/", os: "Debian 12", sizeMb: 720, status: "ready", uploadedAt: "2025-11-20" },
  { id: 3, name: "alpine-virt-3.20.0-x86_64.iso", url: "https://alpinelinux.org/downloads/", os: "Alpine 3.20", sizeMb: 65, status: "ready", uploadedAt: "2025-11-15" },
  { id: 4, name: "Rocky-9.4-x86_64-minimal.iso", url: "https://rockylinux.org/download", os: "Rocky 9.4", sizeMb: 1900, status: "ready", uploadedAt: "2025-10-22" },
  { id: 5, name: "Win2022_English_x64.iso", url: "https://www.microsoft.com/", os: "Windows Server 2022", sizeMb: 5400, status: "ready", uploadedAt: "2025-09-10" },
];

export default function ISOs() {
  const [isos, setIsos] = useState<ISO[]>(SEED_ISOS);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [os, setOs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const filtered = isos.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.os.toLowerCase().includes(search.toLowerCase())
  );

  function formatSize(mb: number) {
    return mb < 1024 ? `${mb} MB` : `${(mb / 1024).toFixed(2)} GB`;
  }

  async function handleAdd() {
    if (!name.trim() || !url.trim()) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const newIso: ISO = {
      id: Date.now(),
      name,
      url,
      os: os || "Custom",
      sizeMb: 0,
      status: "downloading",
      uploadedAt: new Date().toISOString().split("T")[0],
    };
    setIsos([newIso, ...isos]);
    setName(""); setUrl(""); setOs("");
    setOpen(false);
    setSubmitting(false);
    toast({ title: "ISO download queued", description: `${newIso.name} is being mirrored to nodes.` });
    setTimeout(() => {
      setIsos(curr => curr.map(i => i.id === newIso.id ? { ...i, status: "ready", sizeMb: Math.floor(Math.random() * 3000 + 200) } : i));
    }, 3500);
  }

  function handleDelete(id: number) {
    setIsos(isos.filter(i => i.id !== id));
    toast({ title: "ISO removed" });
  }

  return (
    <div className="space-y-6 anim-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Disc className="h-7 w-7 text-primary" />
            ISO Library
          </h2>
          <p className="text-muted-foreground mt-1">
            Operating system install images available for VPS provisioning. Mirrored to all nodes.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="everest-glow gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Upload ISO
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Disc className="h-5 w-5 text-primary" /> Add ISO from URL
              </DialogTitle>
              <DialogDescription>
                Provide a direct download URL. Nova will mirror the ISO to every node automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Display Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ubuntu-24.04-server.iso" className="bg-background mt-1.5 font-mono" />
              </div>
              <div>
                <Label>OS Family (optional)</Label>
                <Input value={os} onChange={e => setOs(e.target.value)} placeholder="e.g. Ubuntu 24.04" className="bg-background mt-1.5" />
              </div>
              <div>
                <Label>Source URL</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso" className="bg-background mt-1.5 font-mono text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting} className="everest-glow gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Mirror to nodes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ISOs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary tabular-nums">
          {filtered.length} {filtered.length === 1 ? "image" : "images"}
        </Badge>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Installation Media</CardTitle>
          <CardDescription>Available for selection during VPS creation under "Custom ISO".</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map(iso => (
              <div key={iso.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Disc className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{iso.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{iso.os} · {formatSize(iso.sizeMb)} · uploaded {iso.uploadedAt}</p>
                </div>
                <Badge variant="outline" className={
                  iso.status === "ready" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                  iso.status === "downloading" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  "bg-destructive/15 text-destructive border-destructive/30"
                }>
                  {iso.status === "ready" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {iso.status === "downloading" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {iso.status}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(iso.id)}
                  title="Remove ISO from all nodes"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <Disc className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No ISOs found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
