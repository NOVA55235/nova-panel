import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Loader2, Cpu, HardDrive, Zap, Globe, Users,
  Sliders, Boxes, Sparkles, Network, MapPin, Mail, Search, Check
} from "lucide-react";

type Kind = "server" | "vps";

const GAME_PRESETS = [
  { id: "minecraft", label: "Minecraft", icon: "⛏️", port: 25565, mem: 4096, cpu: 200, disk: 10 },
  { id: "rust", label: "Rust", icon: "🔧", port: 28015, mem: 8192, cpu: 400, disk: 30 },
  { id: "cs2", label: "CS2", icon: "🔫", port: 27015, mem: 4096, cpu: 200, disk: 25 },
  { id: "fivem", label: "FiveM", icon: "🚗", port: 30120, mem: 6144, cpu: 300, disk: 20 },
  { id: "ark", label: "ARK", icon: "🦖", port: 7777, mem: 12288, cpu: 600, disk: 100 },
  { id: "valheim", label: "Valheim", icon: "🛡️", port: 2456, mem: 4096, cpu: 200, disk: 15 },
  { id: "terraria", label: "Terraria", icon: "🌳", port: 7777, mem: 1024, cpu: 100, disk: 5 },
  { id: "discord", label: "Discord Bot", icon: "🤖", port: 0, mem: 512, cpu: 50, disk: 2 },
  { id: "custom", label: "Custom", icon: "⚙️", port: 25565, mem: 2048, cpu: 100, disk: 10 },
];

const OS_PRESETS = [
  { id: "ubuntu-24", label: "Ubuntu 24.04", icon: "🐧", color: "text-orange-400", mem: 2048, cpu: 200, disk: 25 },
  { id: "ubuntu-22", label: "Ubuntu 22.04", icon: "🐧", color: "text-orange-400", mem: 2048, cpu: 200, disk: 25 },
  { id: "debian-12", label: "Debian 12", icon: "🌀", color: "text-red-400", mem: 1024, cpu: 100, disk: 20 },
  { id: "alpine", label: "Alpine Linux", icon: "🏔️", color: "text-blue-400", mem: 512, cpu: 100, disk: 10 },
  { id: "rocky-9", label: "Rocky Linux 9", icon: "🪨", color: "text-emerald-400", mem: 2048, cpu: 200, disk: 25 },
  { id: "fedora", label: "Fedora 40", icon: "🎩", color: "text-blue-500", mem: 2048, cpu: 200, disk: 25 },
  { id: "arch", label: "Arch Linux", icon: "🅰️", color: "text-cyan-400", mem: 1024, cpu: 100, disk: 15 },
  { id: "windows", label: "Windows Server", icon: "🪟", color: "text-blue-300", mem: 4096, cpu: 400, disk: 50 },
  { id: "custom-iso", label: "Custom ISO", icon: "💿", color: "text-violet-400", mem: 2048, cpu: 200, disk: 25 },
];

const VPS_PLANS = [
  { id: "starter", label: "Starter", cpu: 100, mem: 1024, disk: 20, price: "$5/mo" },
  { id: "standard", label: "Standard", cpu: 200, mem: 2048, disk: 50, price: "$10/mo" },
  { id: "performance", label: "Performance", cpu: 400, mem: 8192, disk: 100, price: "$30/mo" },
  { id: "enterprise", label: "Enterprise", cpu: 800, mem: 16384, disk: 200, price: "$60/mo" },
  { id: "custom", label: "Custom", cpu: 200, mem: 2048, disk: 50, price: "—" },
];

export interface CreateInstanceDialogProps {
  kind: Kind;
  triggerLabel?: string;
  onCreated?: () => void;
}

export function CreateInstanceDialog({ kind, triggerLabel, onCreated }: CreateInstanceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const isVps = kind === "vps";

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("basics");
  const [userSearch, setUserSearch] = useState("");

  const { data: usersList } = useListUsers({
    query: { queryKey: getListUsersQueryKey(), enabled: open && isAdmin },
  });

  const filteredUsers = usersList?.filter(u =>
    !userSearch ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const initialPreset = isVps ? OS_PRESETS[0] : GAME_PRESETS[0];

  const [form, setForm] = useState({
    name: "",
    description: "",
    typeId: initialPreset.id,
    plan: isVps ? "standard" : "",
    location: "us-east-1",
    node: "auto",
    ownerId: user?.id ? String(user.id) : "self",
    cpu: initialPreset.cpu,
    memory: initialPreset.mem,
    disk: initialPreset.disk,
    port: isVps ? 22 : (initialPreset as any).port ?? 25565,
    autoStart: true,
    backups: true,
    eula: false,
    rootPassword: "",
    sshKey: "",
  });

  function pickType(id: string) {
    const presets = isVps ? OS_PRESETS : GAME_PRESETS;
    const p = presets.find(x => x.id === id);
    if (!p) return;
    setForm(f => ({
      ...f,
      typeId: id,
      memory: (p as any).mem,
      cpu: (p as any).cpu,
      disk: (p as any).disk,
      ...(isVps ? {} : { port: (p as any).port }),
    }));
  }

  function pickPlan(id: string) {
    const p = VPS_PLANS.find(x => x.id === id);
    if (!p) return;
    setForm(f => ({ ...f, plan: id, cpu: p.cpu, memory: p.mem, disk: p.disk }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: `Give your ${kind} a name.`, variant: "destructive" });
      setTab("basics");
      return;
    }
    if (isVps && !form.rootPassword.trim() && !form.sshKey.trim()) {
      toast({ title: "Auth required", description: "Set a root password or SSH key.", variant: "destructive" });
      setTab("advanced");
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setOpen(false);

    const owner = form.ownerId === "self"
      ? "you"
      : usersList?.find(u => String(u.id) === form.ownerId)?.email ?? "selected user";

    toast({
      title: `${isVps ? "VPS" : "Server"} created`,
      description: `${form.name} is provisioning. Assigned to ${owner}.`,
    });
    onCreated?.();
  }

  const presets = isVps ? OS_PRESETS : GAME_PRESETS;
  const selectedType = presets.find(p => p.id === form.typeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto everest-glow gap-2 font-semibold">
          <Plus className="h-4 w-4" /> {triggerLabel ?? (isVps ? "Create VPS" : "Create Server")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 anim-pulse-glow">
              {isVps ? <HardDrive className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <DialogTitle className="text-xl">
                Create New {isVps ? "VPS Instance" : "Game Server"}
              </DialogTitle>
              <DialogDescription>
                {isVps
                  ? "Provision a virtual private server with full root access. Auto-failover enabled."
                  : "Provision a new game server. Pick a game, set resources, assign to a user."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="bg-muted/40 w-full justify-start h-auto p-1 gap-1 flex-wrap">
            <TabsTrigger value="basics" className="gap-1.5"><Boxes className="h-3.5 w-3.5" /> Basics</TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5"><Cpu className="h-3.5 w-3.5" /> Resources</TabsTrigger>
            <TabsTrigger value="assign" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Assign User</TabsTrigger>
            <TabsTrigger value="network" className="gap-1.5"><Network className="h-3.5 w-3.5" /> Network</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1.5"><Sliders className="h-3.5 w-3.5" /> Advanced</TabsTrigger>
          </TabsList>

          {/* ── BASICS ── */}
          <TabsContent value="basics" className="mt-4 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide font-semibold mb-2 block">
                {isVps ? "Operating System" : "Game Type"}
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {presets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickType(p.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      form.typeId === p.id
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                        : "border-border bg-muted/20 hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-[10px] font-semibold text-center leading-tight">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isVps ? "e.g. web-prod-01" : "e.g. My Awesome SMP"}
                className="bg-background mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder={`What is this ${kind} for?`}
                className="bg-background mt-1.5 resize-none"
              />
            </div>
          </TabsContent>

          {/* ── RESOURCES ── */}
          <TabsContent value="resources" className="mt-4 space-y-5">
            {isVps && (
              <div>
                <Label className="text-xs uppercase tracking-wide font-semibold mb-2 block">Plan Preset</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {VPS_PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickPlan(p.id)}
                      className={`p-2.5 rounded-lg border-2 transition-all text-left ${
                        form.plan === p.id
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                          : "border-border bg-muted/20 hover:border-primary/40"
                      }`}
                    >
                      <p className="text-xs font-bold">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.mem / 1024}GB RAM</p>
                      <p className="text-[10px] text-primary font-mono mt-0.5">{p.price}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> CPU Limit</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={form.cpu}
                    onChange={e => setForm({ ...form, cpu: Math.max(1, parseInt(e.target.value) || 0) })}
                    className="bg-background h-7 w-24 text-sm font-mono text-right"
                  />
                  <span className="text-sm font-mono text-primary">%</span>
                </div>
              </div>
              <Slider value={[Math.min(form.cpu, 1600)]} onValueChange={([v]) => setForm({ ...form, cpu: v })} min={50} max={1600} step={50} />
              <p className="text-[11px] text-muted-foreground mt-1.5">100% = 1 full vCPU core · 400% = 4 cores. Type any custom value above.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Memory (RAM)</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={64}
                    value={form.memory}
                    onChange={e => setForm({ ...form, memory: Math.max(64, parseInt(e.target.value) || 0) })}
                    className="bg-background h-7 w-28 text-sm font-mono text-right"
                  />
                  <span className="text-sm font-mono text-primary">MB</span>
                </div>
              </div>
              <Slider value={[Math.min(form.memory, 65536)]} onValueChange={([v]) => setForm({ ...form, memory: v })} min={256} max={65536} step={256} />
              <p className="text-[11px] text-muted-foreground mt-1.5">≈ {(form.memory / 1024).toFixed(2)} GB · type any value above.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5" /> Disk Storage</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={form.disk}
                    onChange={e => setForm({ ...form, disk: Math.max(1, parseInt(e.target.value) || 0) })}
                    className="bg-background h-7 w-24 text-sm font-mono text-right"
                  />
                  <span className="text-sm font-mono text-primary">GB</span>
                </div>
              </div>
              <Slider value={[Math.min(form.disk, 1000)]} onValueChange={([v]) => setForm({ ...form, disk: v })} min={1} max={1000} step={1} />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                Allocating <span className="text-foreground font-semibold">{form.cpu}%</span> CPU ·{" "}
                <span className="text-foreground font-semibold">{(form.memory / 1024).toFixed(1)} GB</span> RAM ·{" "}
                <span className="text-foreground font-semibold">{form.disk} GB</span> disk
              </span>
            </div>
          </TabsContent>

          {/* ── ASSIGN USER ── */}
          <TabsContent value="assign" className="mt-4 space-y-4">
            {!isAdmin ? (
              <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm">
                <p className="font-medium">Auto-assigned to you</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Only administrators can re-assign instances to other users.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    <Mail className="h-3.5 w-3.5" /> Assign to User
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or username..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="bg-background pl-9 mb-2"
                    />
                  </div>
                  <div className="border border-border rounded-lg max-h-64 overflow-y-auto bg-background/50">
                    {/* Self option */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, ownerId: "self" })}
                      className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/10 transition-colors border-b border-border ${
                        form.ownerId === "self" ? "bg-primary/15" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">YOU</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">Assign to myself</p>
                          <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      {form.ownerId === "self" && <Check className="h-4 w-4 text-primary" />}
                    </button>

                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setForm({ ...form, ownerId: String(u.id) })}
                          className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/10 transition-colors border-b border-border last:border-b-0 ${
                            form.ownerId === String(u.id) ? "bg-primary/15" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold">{u.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium truncate">{u.username}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                            </div>
                            {u.role === "admin" && (
                              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary shrink-0">admin</Badge>
                            )}
                          </div>
                          {form.ownerId === String(u.id) && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        {userSearch ? "No users match your search." : "No users available."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-xs flex items-start gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-emerald-400 font-semibold">Unlimited sub-users</span> — after creation,
                    add more users from the {kind} detail page → Sub-users tab.
                  </span>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── NETWORK ── */}
          <TabsContent value="network" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</Label>
                <Select value={form.location} onValueChange={v => setForm({ ...form, location: v })}>
                  <SelectTrigger className="bg-background mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">🇺🇸 US East</SelectItem>
                    <SelectItem value="us-west-1">🇺🇸 US West</SelectItem>
                    <SelectItem value="eu-central-1">🇩🇪 Europe</SelectItem>
                    <SelectItem value="ap-south-1">🇮🇳 Asia / India</SelectItem>
                    <SelectItem value="ap-east-1">🇸🇬 Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Network className="h-3.5 w-3.5" /> Node</Label>
                <Select value={form.node} onValueChange={v => setForm({ ...form, node: v })}>
                  <SelectTrigger className="bg-background mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">⚡ Auto (best available)</SelectItem>
                    <SelectItem value="node-1">node-1 · 22% load</SelectItem>
                    <SelectItem value="node-2">node-2 · 45% load</SelectItem>
                    <SelectItem value="node-3">node-3 · 18% load</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="port" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> {isVps ? "SSH Port" : "Primary Port"}
              </Label>
              <Input
                id="port"
                type="number"
                value={form.port}
                onChange={e => setForm({ ...form, port: Number(e.target.value) })}
                className="bg-background mt-1.5 font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Default port for {selectedType?.label}. Port forwarding is auto-configured. See INSTALL.md for router setup.
              </p>
            </div>
          </TabsContent>

          {/* ── ADVANCED ── */}
          <TabsContent value="advanced" className="mt-4 space-y-3">
            {isVps && (
              <>
                <div>
                  <Label htmlFor="rootpw" className="text-sm">Root Password</Label>
                  <Input
                    id="rootpw"
                    type="password"
                    placeholder="Leave empty if using SSH key"
                    value={form.rootPassword}
                    onChange={e => setForm({ ...form, rootPassword: e.target.value })}
                    className="bg-background mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="sshkey" className="text-sm">SSH Public Key (optional)</Label>
                  <Textarea
                    id="sshkey"
                    rows={2}
                    placeholder="ssh-ed25519 AAAA..."
                    value={form.sshKey}
                    onChange={e => setForm({ ...form, sshKey: e.target.value })}
                    className="bg-background mt-1.5 font-mono text-xs resize-none"
                  />
                </div>
              </>
            )}

            {[
              { key: "autoStart", label: "Auto-start on node boot", desc: "Restart automatically if node restarts" },
              { key: "backups", label: "Daily backups", desc: "Snapshot once per day, keep last 7" },
              ...(!isVps ? [{ key: "eula", label: "Accept EULA / Terms", desc: "Required for Minecraft and similar games" }] : []),
            ].map(opt => (
              <label key={opt.key} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={(form as any)[opt.key]}
                  onChange={e => setForm({ ...form, [opt.key]: e.target.checked })}
                  className="mt-0.5 accent-primary h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-xs flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                <span className="text-emerald-400 font-semibold">Auto-failover enabled</span> — if the assigned node goes down,
                this {kind} is migrated to a healthy node automatically.
              </span>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="everest-glow gap-2 font-semibold">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {submitting ? "Provisioning..." : `Create ${isVps ? "VPS" : "Server"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
