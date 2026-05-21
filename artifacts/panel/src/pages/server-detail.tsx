import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetServer,
  useServerPowerAction,
  useGetServerStats,
  getGetServerQueryKey,
  getGetServerStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Play, Square, RotateCw, Terminal, AlertTriangle,
  Activity, HardDrive, Cpu, Loader2, ArrowLeft, ChevronRight,
  FolderOpen, Database, Calendar, Users2, Settings, Archive,
  Plus, Trash2, RefreshCw, File, Folder, Upload, Download,
  Clock, Check, X, Eye, EyeOff, Copy, Network, Zap, Shield,
  MemoryStick, ChevronUp, ChevronDown, RotateCcw, Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQueryClient as useQC } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const token = () => localStorage.getItem("gamepanel_token") || "";
const headers = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

const apiFetch = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`${API_BASE}${path}`, { ...opts, headers: { ...headers(), ...(opts?.headers || {}) } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

// ─── Status helpers ────────────────────────────────────────────────────────
function statusColor(s: string) {
  const map: Record<string, string> = {
    running: "bg-green-500/20 text-green-400 border-green-500/30",
    stopped: "bg-muted text-muted-foreground border-border",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    starting: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    stopping: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    installing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return map[s] || "bg-muted text-muted-foreground";
}

// ─── Console tab ─────────────────────────────────────────────────────────────
function ConsoleTab({ server }: { server: any }) {
  const [cmd, setCmd] = useState("");
  const [log, setLog] = useState<{ time: string; text: string; type: "info" | "warn" | "error" | "success" | "cmd" }[]>([
    { time: new Date().toLocaleTimeString(), text: "[GamePanel] Console connected.", type: "info" },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (server.status === "running") {
      const msgs = [
        { text: "[Server] Starting up...", type: "info" as const },
        { text: `[Network] Listening on port ${server.port}`, type: "success" as const },
        { text: "[System] World loaded in 1.2s", type: "success" as const },
        { text: "[System] 0 players connected", type: "info" as const },
      ];
      msgs.forEach((m, i) => {
        setTimeout(() => {
          setLog(prev => [...prev, { ...m, time: new Date().toLocaleTimeString() }]);
        }, i * 300);
      });
    } else {
      setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: "[Server] Server is offline. Start it to see live output.", type: "warn" }]);
    }
  }, [server.status]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const send = () => {
    if (!cmd.trim() || server.status !== "running") return;
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `> ${cmd}`, type: "cmd" }]);
    setCmd("");
    setTimeout(() => {
      setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: "[Console] Command executed.", type: "info" }]);
    }, 300);
  };

  const colorMap: Record<string, string> = {
    info: "text-gray-300", warn: "text-yellow-400", error: "text-red-400", success: "text-green-400", cmd: "text-primary"
  };

  return (
    <Card className="bg-card border-border overflow-hidden flex flex-col h-[580px]">
      <CardHeader className="py-2 px-4 border-b border-border bg-black/30 flex-row items-center justify-between flex">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" /> Server Console
          <span className={`w-2 h-2 rounded-full ${server.status === "running" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        </CardTitle>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLog([{ time: new Date().toLocaleTimeString(), text: "[Console] Cleared.", type: "info" }])}>
          Clear
        </Button>
      </CardHeader>
      <div ref={logRef} className="flex-1 overflow-y-auto p-4 bg-[#060606] font-mono text-xs space-y-0.5">
        {log.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-600 shrink-0">{l.time}</span>
            <span className={colorMap[l.type]}>{l.text}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 bg-black flex items-center gap-2 px-3 py-2">
        <span className="text-primary font-mono text-xs shrink-0">container:~$</span>
        <input
          className="flex-1 bg-transparent text-gray-200 text-xs font-mono outline-none placeholder:text-gray-700"
          placeholder={server.status === "running" ? "Type a command and press Enter..." : "Server offline"}
          value={cmd}
          disabled={server.status !== "running"}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-primary" disabled={server.status !== "running"} onClick={send}>
          Send
        </Button>
      </div>
    </Card>
  );
}

// ─── File Manager tab ─────────────────────────────────────────────────────────
function FilesTab({ serverId }: { serverId: number }) {
  const [dir, setDir] = useState("/");
  const [breadcrumbs, setBreadcrumbs] = useState(["/"]);
  const [editFile, setEditFile] = useState<{ name: string; content: string } | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["server-files", serverId, dir],
    queryFn: () => apiFetch(`/api/servers/${serverId}/files?dir=${encodeURIComponent(dir)}`),
  });

  const { data: fileContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ["server-file-content", serverId, editFile?.name],
    queryFn: () => apiFetch(`/api/servers/${serverId}/files/contents?file=${encodeURIComponent(editFile!.name)}`),
    enabled: !!editFile?.name,
  });

  function navigateTo(name: string) {
    const newDir = dir === "/" ? `/${name}` : `${dir}/${name}`;
    setDir(newDir);
    setBreadcrumbs(prev => [...prev, name]);
  }

  function navigateBreadcrumb(index: number) {
    const newCrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newCrumbs);
    setDir(newCrumbs.length === 1 ? "/" : "/" + newCrumbs.slice(1).join("/"));
  }

  function formatSize(bytes: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex-row items-center gap-3 flex">
        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        <div className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button className="hover:text-primary transition-colors font-mono" onClick={() => navigateBreadcrumb(i)}>
                {crumb}
              </button>
            </span>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Upload className="h-3 w-3" /> Upload</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> New File</Button>
        </div>
      </CardHeader>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          data?.files?.map((f: any) => (
            <div
              key={f.name}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group cursor-pointer"
              onClick={() => f.type === "directory" ? navigateTo(f.name) : setEditFile({ name: f.name, content: "" })}
            >
              {f.type === "directory"
                ? <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
                : <File className="h-4 w-4 text-blue-400 shrink-0" />
              }
              <span className="flex-1 text-sm font-mono">{f.name}</span>
              <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(f.modified), "MMM d, yyyy")}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                {f.type === "file" && (
                  <>
                    <Button size="icon" variant="ghost" className="h-6 w-6"><Download className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editFile} onOpenChange={() => setEditFile(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] bg-card border-border flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{editFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {isLoadingContent ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <textarea
                className="w-full h-80 font-mono text-xs bg-black/50 border border-border rounded-md p-3 text-gray-300 resize-y outline-none focus:border-primary"
                defaultValue={fileContent?.content || ""}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFile(null)}>Close</Button>
            <Button onClick={() => { toast({ title: "File saved" }); setEditFile(null); }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Databases tab ─────────────────────────────────────────────────────────────
function DatabasesTab({ serverId }: { serverId: number }) {
  const [newDb, setNewDb] = useState("");
  const [createdPwd, setCreatedPwd] = useState<{ dbName: string; username: string; password: string } | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const QK = ["server-databases", serverId];

  const { data: dbs = [], isLoading } = useQuery({ queryKey: QK, queryFn: () => apiFetch(`/api/servers/${serverId}/databases`) });

  const create = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}/databases`, { method: "POST", body: JSON.stringify({ name: newDb }) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: QK }); setCreatedPwd({ dbName: data.dbName, username: data.username, password: data.password }); setNewDb(""); },
    onError: () => toast({ title: "Error", description: "Failed to create database.", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/servers/${serverId}/databases/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast({ title: "Database deleted" }); },
  });

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Databases</CardTitle>
          <CardDescription>MySQL databases for this server. Each has its own user with scoped permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Database name (e.g. gamedata)" value={newDb} onChange={e => setNewDb(e.target.value)} className="bg-background max-w-xs" />
            <Button disabled={!newDb || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Create Database
            </Button>
          </div>
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : dbs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No databases yet. Create one above.</p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
              {dbs.map((db: any) => (
                <div key={db.id} className="flex items-center gap-4 px-4 py-3">
                  <Database className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{db.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{db.username}@{db.host}:{db.port} / {db.dbName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(db.createdAt), { addSuffix: true })}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove.mutate(db.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!createdPwd} onOpenChange={() => setCreatedPwd(null)}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2"><Check className="h-5 w-5" /> Database Created</DialogTitle>
            <DialogDescription className="text-amber-400">Save these credentials — the password won't be shown again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 font-mono text-sm bg-black/40 rounded-md border border-border p-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Database:</span> <span className="text-green-300">{createdPwd?.dbName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Username:</span> <span className="text-green-300">{createdPwd?.username}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Password:</span>
              <span className="text-green-300 flex items-center gap-2">{createdPwd?.password}
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard?.writeText(createdPwd!.password); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </span>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setCreatedPwd(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Schedules tab ────────────────────────────────────────────────────────────
function SchedulesTab({ serverId }: { serverId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", cron: "0 * * * *", action: "restart", payload: "" });
  const { toast } = useToast();
  const qc = useQueryClient();
  const QK = ["server-schedules", serverId];

  const { data: schedules = [], isLoading } = useQuery({ queryKey: QK, queryFn: () => apiFetch(`/api/servers/${serverId}/schedules`) });

  const create = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}/schedules`, { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); setOpen(false); setForm({ name: "", cron: "0 * * * *", action: "restart", payload: "" }); toast({ title: "Schedule created" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/servers/${serverId}/schedules/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast({ title: "Schedule deleted" }); },
  });

  const CRON_PRESETS = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Weekly (Sunday)", value: "0 0 * * 0" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Scheduled Tasks</h3>
          <p className="text-sm text-muted-foreground">Automate server tasks on a cron schedule.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Schedule</Button>
      </div>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : schedules.length === 0 ? (
        <div className="text-center p-10 bg-card rounded-lg border border-dashed border-border">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">No schedules yet. Create one to automate tasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s: any) => (
            <Card key={s.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${s.isActive ? "bg-green-500" : "bg-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <code className="font-mono bg-muted/50 px-1.5 rounded">{s.cron}</code>
                    <span className="capitalize">{s.action}</span>
                    {s.lastRunAt && <span>Last run: {formatDistanceToNow(new Date(s.lastRunAt), { addSuffix: true })}</span>}
                  </div>
                </div>
                <Badge variant="secondary" className={s.isActive ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
                  {s.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove.mutate(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> New Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium block mb-1.5">Name</label>
              <Input placeholder="Daily Restart" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Cron Expression</label>
              <Input placeholder="0 * * * *" value={form.cron} onChange={e => setForm(f => ({ ...f, cron: e.target.value }))} className="bg-background font-mono" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CRON_PRESETS.map(p => (
                  <button key={p.value} className="text-xs px-2 py-1 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors font-mono" onClick={() => setForm(f => ({ ...f, cron: p.value }))}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="text-sm font-medium block mb-1.5">Action</label>
              <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                <option value="restart">Restart Server</option>
                <option value="stop">Stop Server</option>
                <option value="start">Start Server</option>
                <option value="backup">Create Backup</option>
                <option value="command">Run Command</option>
              </select>
            </div>
            {form.action === "command" && (
              <div><label className="text-sm font-medium block mb-1.5">Command</label>
                <Input placeholder="say Server restarting in 5 minutes!" value={form.payload} onChange={e => setForm(f => ({ ...f, payload: e.target.value }))} className="bg-background font-mono" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Backups tab ──────────────────────────────────────────────────────────────
function BackupsTab({ serverId }: { serverId: number }) {
  const [newName, setNewName] = useState("");
  const [confirmRestore, setConfirmRestore] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const QK = ["server-backups", serverId];

  const { data: backups = [], isLoading } = useQuery({ queryKey: QK, queryFn: () => apiFetch(`/api/servers/${serverId}/backups`), refetchInterval: 5000 });

  const create = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}/backups`, { method: "POST", body: JSON.stringify({ name: newName || undefined }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); setNewName(""); toast({ title: "Backup started", description: "Backup will complete in a few seconds." }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/servers/${serverId}/backups/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); setConfirmDelete(null); toast({ title: "Backup deleted", description: "The archive has been permanently removed." }); },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const restore = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/servers/${serverId}/backups/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      qc.invalidateQueries({ queryKey: ["server", serverId] });
      setConfirmRestore(null);
      toast({ title: "Restore started", description: "All server files wiped — backup is being re-uploaded." });
    },
    onError: () => toast({ title: "Restore failed", variant: "destructive" }),
  });

  async function handleDownload(b: any) {
    if (b.status !== "completed") {
      toast({ title: "Not ready", description: "Wait until the backup finishes before downloading.", variant: "destructive" });
      return;
    }
    try {
      setDownloadingId(b.id);
      const token = localStorage.getItem("gamepanel_token");
      const res = await fetch(`/api/servers/${serverId}/backups/${b.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${b.name.replace(/[^a-zA-Z0-9._-]/g, "_")}.tar.gz`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: `${b.name}.tar.gz` });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  }

  function formatSize(mb: number) {
    if (!mb) return "—";
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2">
            <Input placeholder="Backup name (optional)" value={newName} onChange={e => setNewName(e.target.value)} className="bg-background max-w-xs" />
            <Button disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />} Create Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : backups.length === 0 ? (
        <div className="text-center p-10 bg-card rounded-lg border border-dashed border-border">
          <Archive className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">No backups yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-md overflow-hidden bg-card">
          {backups.map((b: any) => (
            <div key={b.id} className="flex items-center gap-4 px-4 py-3">
              <Archive className={`h-4 w-4 shrink-0 ${b.status === "completed" ? "text-green-500" : b.status === "failed" ? "text-red-500" : "text-yellow-500"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(b.sizeMb)} • {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}</p>
              </div>
              <Badge variant="secondary" className={b.status === "completed" ? "bg-green-500/20 text-green-400" : b.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}>
                {b.status === "pending" ? <><Loader2 className="h-3 w-3 animate-spin mr-1 inline" />{b.status}</> : b.status}
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:text-primary"
                  title="Download backup"
                  disabled={b.status !== "completed" || downloadingId === b.id}
                  onClick={() => handleDownload(b)}
                >
                  {downloadingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:text-amber-400"
                  title="Restore backup"
                  disabled={b.status !== "completed"}
                  onClick={() => setConfirmRestore(b)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  title="Delete backup"
                  onClick={() => setConfirmDelete(b)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore confirmation */}
      <Dialog open={!!confirmRestore} onOpenChange={(o) => !o && setConfirmRestore(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Restore from backup?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will <span className="font-semibold text-destructive">permanently delete all current server files</span> and replace them with the contents of <span className="font-semibold text-foreground">{confirmRestore?.name}</span>.
              <br /><br />
              The server will go offline during restore. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)} disabled={restore.isPending}>Cancel</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
              onClick={() => confirmRestore && restore.mutate(confirmRestore.id)}
              disabled={restore.isPending}
            >
              {restore.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {restore.isPending ? "Restoring..." : "Wipe & Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete backup?
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className="font-semibold text-foreground">{confirmDelete?.name}</span> ({formatSize(confirmDelete?.sizeMb || 0)}) will be permanently removed. You will not be able to restore from this backup again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={remove.isPending}>Cancel</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
              disabled={remove.isPending}
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {remove.isPending ? "Deleting..." : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-users tab ────────────────────────────────────────────────────────────
function SubusersTab({ serverId }: { serverId: number }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [perms, setPerms] = useState<string[]>(["console.view"]);
  const { toast } = useToast();
  const qc = useQueryClient();
  const QK = ["server-subusers", serverId];

  const PERMISSIONS = [
    "console.view", "console.send", "power.start", "power.stop", "power.restart", "power.kill",
    "files.view", "files.edit", "files.upload", "files.delete",
    "backups.create", "backups.delete", "databases.view", "databases.create",
    "schedules.view", "schedules.create",
  ];

  const { data: subusers = [], isLoading } = useQuery({ queryKey: QK, queryFn: () => apiFetch(`/api/servers/${serverId}/subusers`) });

  const add = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}/subusers`, { method: "POST", body: JSON.stringify({ userId: parseInt(userId), permissions: perms }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); setOpen(false); setUserId(""); toast({ title: "Sub-user added" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/servers/${serverId}/subusers/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast({ title: "Sub-user removed" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Sub-users</h3>
          <p className="text-sm text-muted-foreground">Grant other users access with specific permissions.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Sub-user</Button>
      </div>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : subusers.length === 0 ? (
        <div className="text-center p-10 bg-card rounded-lg border border-dashed border-border">
          <Users2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">No sub-users. Add one to share server access.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subusers.map((u: any) => (
            <Card key={u.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.username} <span className="text-muted-foreground font-normal text-xs">({u.email})</span></p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.permissions?.slice(0, 4).map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs border-border">{p}</Badge>
                    ))}
                    {u.permissions?.length > 4 && <Badge variant="outline" className="text-xs border-border">+{u.permissions.length - 4} more</Badge>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove.mutate(u.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users2 className="h-5 w-5 text-primary" /> Add Sub-user</DialogTitle>
            <DialogDescription>Enter the user ID to grant access. Find IDs in the Users admin page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium block mb-1.5">User ID</label>
              <Input placeholder="User ID (e.g. 2)" value={userId} onChange={e => setUserId(e.target.value)} className="bg-background" type="number" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Permissions</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PERMISSIONS.map(p => (
                  <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={perms.includes(p)} onChange={e => setPerms(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))} className="accent-primary" />
                    <code>{p}</code>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!userId || add.isPending} onClick={() => add.mutate()}>
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add Sub-user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Settings tab ─────────────────────────────────────────────────────────────
function SettingsTab({ server, serverId }: { server: any; serverId: number }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [name, setName] = useState(server.name);
  const [dockerImage, setDockerImage] = useState(server.dockerImage);
  const [startup, setStartup] = useState(server.startupCommand);
  const [envVars, setEnvVars] = useState<Record<string, string>>(server.envVariables || {});
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvVal, setNewEnvVal] = useState("");
  const [reinstallOpen, setReinstallOpen] = useState(false);
  const [cpuLimit, setCpuLimit] = useState<number>(server.cpuLimit ?? 100);
  const [memoryMb, setMemoryMb] = useState<number>(server.memoryMb ?? 1024);
  const [diskMb, setDiskMb] = useState<number>(server.diskMb ?? 5120);
  const { toast } = useToast();
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}`, { method: "PUT", body: JSON.stringify({ name, dockerImage, startupCommand: startup, envVariables: envVars }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetServerQueryKey(serverId) }); toast({ title: "Server settings saved" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const saveResources = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}`, { method: "PUT", body: JSON.stringify({ cpuLimit, memoryMb, diskMb }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetServerQueryKey(serverId) }); toast({ title: "Resources updated", description: "Server limits applied. Restart the server for changes to take effect." }); },
    onError: () => toast({ title: "Error", description: "Failed to update resources.", variant: "destructive" }),
  });

  const reinstall = useMutation({
    mutationFn: () => apiFetch(`/api/servers/${serverId}/reinstall`, { method: "POST" }),
    onSuccess: () => { setReinstallOpen(false); toast({ title: "Reinstall initiated", description: "Server will reinstall and come back online shortly." }); },
  });

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Server Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1.5">Server Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-background" />
            </div>
            <div><label className="text-sm font-medium block mb-1.5">Docker Image</label>
              <Input value={dockerImage} onChange={e => setDockerImage(e.target.value)} className="bg-background font-mono text-xs" />
            </div>
          </div>
          <div><label className="text-sm font-medium block mb-1.5">Startup Command</label>
            <Input value={startup} onChange={e => setStartup(e.target.value)} className="bg-background font-mono text-xs" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Environment Variables</label>
            <div className="space-y-2 mb-3">
              {Object.entries(envVars).map(([k, v]) => (
                <div key={k} className="flex gap-2 items-center">
                  <Input value={k} readOnly className="bg-muted/40 font-mono text-xs w-1/3" />
                  <Input value={v} onChange={e => setEnvVars(prev => ({ ...prev, [k]: e.target.value }))} className="bg-background font-mono text-xs flex-1" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => setEnvVars(prev => { const n = { ...prev }; delete n[k]; return n; })}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Input placeholder="VARIABLE_NAME" value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)} className="bg-background font-mono text-xs w-1/3" />
              <Input placeholder="value" value={newEnvVal} onChange={e => setNewEnvVal(e.target.value)} className="bg-background font-mono text-xs flex-1" />
              <Button size="sm" variant="outline" disabled={!newEnvKey} onClick={() => { setEnvVars(prev => ({ ...prev, [newEnvKey]: newEnvVal })); setNewEnvKey(""); setNewEnvVal(""); }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Save Settings
          </Button>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> Customize Resources</CardTitle>
            <CardDescription>Upgrade or downgrade this server's CPU, RAM and disk allocation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">CPU Limit (%)</label>
                <Input type="number" min={1} value={cpuLimit} onChange={e => setCpuLimit(Math.max(1, parseInt(e.target.value) || 0))} className="bg-background font-mono" />
                <p className="text-[11px] text-muted-foreground mt-1">100 = 1 core, 400 = 4 cores</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Memory (MB)</label>
                <Input type="number" min={64} value={memoryMb} onChange={e => setMemoryMb(Math.max(64, parseInt(e.target.value) || 0))} className="bg-background font-mono" />
                <p className="text-[11px] text-muted-foreground mt-1">≈ {(memoryMb / 1024).toFixed(2)} GB</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Disk (MB)</label>
                <Input type="number" min={256} value={diskMb} onChange={e => setDiskMb(Math.max(256, parseInt(e.target.value) || 0))} className="bg-background font-mono" />
                <p className="text-[11px] text-muted-foreground mt-1">≈ {(diskMb / 1024).toFixed(2)} GB</p>
              </div>
            </div>
            <Button onClick={() => saveResources.mutate()} disabled={saveResources.isPending}>
              {saveResources.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Apply New Limits
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-red-900/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Danger Zone</CardTitle>
          <CardDescription>These actions are destructive and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setReinstallOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reinstall Server
          </Button>
        </CardContent>
      </Card>

      <Dialog open={reinstallOpen} onOpenChange={setReinstallOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reinstall Server?</DialogTitle>
            <DialogDescription>This will wipe all server files and reinstall from scratch. Your server data will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReinstallOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={reinstall.isPending} onClick={() => reinstall.mutate()}>
              {reinstall.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reinstall"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Resources tab ──────────────────────────────────────────────────────────
function ResourcesTab({ serverId, server }: { serverId: number; server: any }) {
  const [cpuData, setCpuData] = useState<{ time: string; value: number }[]>([]);
  const [ramData, setRamData] = useState<{ time: string; value: number }[]>([]);
  const [netData, setNetData] = useState<{ time: string; in: number; out: number }[]>([]);

  const { data: stats } = useGetServerStats(serverId, {
    query: {
      enabled: server?.status === "running",
      queryKey: getGetServerStatsQueryKey(serverId),
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    if (stats) {
      const t = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setCpuData(p => [...p.slice(-19), { time: t, value: stats.cpuUsage }]);
      setRamData(p => [...p.slice(-19), { time: t, value: stats.memoryUsed }]);
      setNetData(p => [...p.slice(-19), { time: t, in: stats.networkIn || 0, out: stats.networkOut || 0 }]);
    }
  }, [stats]);

  const chartProps = { margin: { top: 5, right: 0, left: -25, bottom: 0 } };
  const axisProps = { stroke: "hsl(var(--muted-foreground))", fontSize: 10, tickLine: false, axisLine: false };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "CPU", value: `${(stats?.cpuUsage || 0).toFixed(1)}%`, icon: Cpu, color: "text-primary" },
          { label: "Memory", value: `${(stats?.memoryUsed || 0).toFixed(0)}/${stats?.memoryLimit || server.memoryMb}MB`, icon: MemoryStick, color: "text-blue-400" },
          { label: "Network In", value: `${(stats?.networkIn || 0).toFixed(2)} MB/s`, icon: ChevronDown, color: "text-green-400" },
          { label: "Network Out", value: `${(stats?.networkOut || 0).toFixed(2)} MB/s`, icon: ChevronUp, color: "text-orange-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-xl font-bold font-mono">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> CPU Usage (%)</CardTitle></CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuData} {...chartProps}>
                <defs><linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" {...axisProps} />
                <YAxis {...axisProps} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#cpu)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MemoryStick className="h-4 w-4 text-blue-400" /> Memory Usage (MB)</CardTitle></CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ramData} {...chartProps}>
                <defs><linearGradient id="ram" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" {...axisProps} />
                <YAxis {...axisProps} domain={[0, server.memoryMb]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="url(#ram)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ServerDetail() {
  const { id } = useParams();
  const serverId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: server, isLoading } = useGetServer(serverId, {
    query: { enabled: !!serverId, queryKey: getGetServerQueryKey(serverId), refetchInterval: 5000 },
  });

  const powerAction = useServerPowerAction();

  const handlePower = (action: "start" | "stop" | "restart" | "kill") => {
    powerAction.mutate({ id: serverId, data: { action } }, {
      onSuccess: () => {
        toast({ title: "Command sent", description: `${action} sent to server.` });
        queryClient.invalidateQueries({ queryKey: getGetServerQueryKey(serverId) });
      },
      onError: (err: any) => toast({ title: "Error", description: err?.message || `Failed to ${action}.`, variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!server) return <div className="text-center py-12 text-muted-foreground">Server not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground gap-1">
        <Link href="/servers" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Servers
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{server.name}</span>
      </div>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{server.name}</h1>
              <Badge variant="secondary" className={statusColor(server.status)}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${server.status === "running" ? "bg-green-500 animate-pulse" : "bg-current"}`} />
                {server.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  const addr = `${server.node?.fqdn || server.ip}:${server.port}`;
                  navigator.clipboard?.writeText(addr);
                  toast({ title: "Copied", description: addr });
                }}
                className="font-mono text-primary hover:text-primary/80 inline-flex items-center gap-1.5 group"
                title={`Click to copy · raw IP: ${server.ip}:${server.port}`}
              >
                <Globe className="h-3.5 w-3.5" />
                {(server.node?.fqdn || server.ip)}:{server.port}
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
              <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {server.cpuLimit}%</span>
              <span className="flex items-center gap-1"><MemoryStick className="h-3 w-3" /> {server.memoryMb}MB</span>
              <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {server.diskMb}MB</span>
              <Badge variant="outline" className="text-xs border-border capitalize">{server.gameType}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" disabled={server.status === "running" || server.status === "starting"} onClick={() => handlePower("start")}>
            <Play className="mr-2 h-4 w-4" /> Start
          </Button>
          <Button variant="secondary" disabled={server.status !== "running"} onClick={() => handlePower("restart")}>
            <RotateCw className="mr-2 h-4 w-4" /> Restart
          </Button>
          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" disabled={server.status === "stopped"} onClick={() => handlePower("stop")}>
            <Square className="mr-2 h-4 w-4" /> Stop
          </Button>
          <Button variant="destructive" className="bg-red-900 hover:bg-red-800" disabled={server.status === "stopped"} onClick={() => handlePower("kill")}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Kill
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="console">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap gap-1">
          {[
            { value: "console", label: "Console", icon: Terminal },
            { value: "resources", label: "Resources", icon: Activity },
            { value: "files", label: "File Manager", icon: FolderOpen },
            { value: "databases", label: "Databases", icon: Database },
            { value: "schedules", label: "Schedules", icon: Calendar },
            { value: "backups", label: "Backups", icon: Archive },
            { value: "subusers", label: "Sub-users", icon: Users2 },
            { value: "settings", label: "Settings", icon: Settings },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="console"><ConsoleTab server={server} /></TabsContent>
          <TabsContent value="resources"><ResourcesTab serverId={serverId} server={server} /></TabsContent>
          <TabsContent value="files"><FilesTab serverId={serverId} /></TabsContent>
          <TabsContent value="databases"><DatabasesTab serverId={serverId} /></TabsContent>
          <TabsContent value="schedules"><SchedulesTab serverId={serverId} /></TabsContent>
          <TabsContent value="backups"><BackupsTab serverId={serverId} /></TabsContent>
          <TabsContent value="subusers"><SubusersTab serverId={serverId} /></TabsContent>
          <TabsContent value="settings"><SettingsTab server={server} serverId={serverId} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
