import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, Loader2, Power, PowerOff, Trash2, ExternalLink, Save,
  CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, Github
} from "lucide-react";

interface BotResponse {
  config: {
    hasToken: boolean;
    tokenPreview: string | null;
    clientId: string | null;
    guildId: string | null;
    ownerDiscordId: string | null;
    enabled: boolean;
  } | null;
  status: {
    enabled: boolean;
    status: "online" | "offline" | "starting" | "error";
    lastError: string | null;
    startedAt: string | null;
    username?: string;
    guildCount?: number;
  };
}

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("gamepanel_token");
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `HTTP ${res.status}`);
  return res.json();
}

export default function DiscordBotPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [ownerDiscordId, setOwnerDiscordId] = useState("");
  const [showToken, setShowToken] = useState(false);

  const { data, isLoading } = useQuery<BotResponse>({
    queryKey: ["discord-bot"],
    queryFn: () => api("/discord-bot"),
    refetchInterval: 5000,
  });

  const saveCfg = useMutation({
    mutationFn: () => api("/discord-bot/config", {
      method: "PUT",
      body: JSON.stringify({
        ...(token ? { token } : {}),
        clientId, guildId, ownerDiscordId,
      }),
    }),
    onSuccess: () => {
      setToken("");
      qc.invalidateQueries({ queryKey: ["discord-bot"] });
      toast({ title: "Saved", description: "Bot configuration updated." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const start = useMutation({
    mutationFn: () => api("/discord-bot/start", { method: "POST" }),
    onSuccess: (s: any) => {
      qc.invalidateQueries({ queryKey: ["discord-bot"] });
      toast({
        title: s.status === "online" ? "Bot online" : "Bot start failed",
        description: s.lastError ?? `Logged in as ${s.username ?? "—"}`,
        variant: s.status === "online" ? "default" : "destructive",
      });
    },
  });

  const stop = useMutation({
    mutationFn: () => api("/discord-bot/stop", { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["discord-bot"] }); toast({ title: "Bot stopped" }); },
  });

  const wipe = useMutation({
    mutationFn: () => api("/discord-bot", { method: "DELETE" }),
    onSuccess: () => {
      setToken(""); setClientId(""); setGuildId(""); setOwnerDiscordId("");
      qc.invalidateQueries({ queryKey: ["discord-bot"] });
      toast({ title: "Configuration wiped" });
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cfg = data?.config;
  const status = data?.status;
  const isOnline = status?.status === "online";

  return (
    <div className="space-y-6 anim-fade-in max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="h-7 w-7 text-primary" />
          Nova Discord Bot
        </h2>
        <p className="text-muted-foreground mt-1">
          Paste a bot token and run it. The bot manages the panel from Discord and DMs password resets to users who linked their Discord ID.
        </p>
      </div>

      {/* Status Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${isOnline ? "bg-emerald-500/15" : "bg-muted"}`}>
                <Bot className={`h-5 w-5 ${isOnline ? "text-emerald-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{isOnline ? `Online · ${status?.username ?? "Nova Bot"}` : "Offline"}</CardTitle>
                <CardDescription className="mt-1">
                  {isOnline
                    ? `Connected to ${status?.guildCount ?? 0} server(s) · Started ${status?.startedAt ? new Date(status.startedAt).toLocaleString() : "—"}`
                    : status?.lastError
                      ? <span className="text-destructive">{status.lastError}</span>
                      : "Bot is not currently running"}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {isOnline ? (
                <Button onClick={() => stop.mutate()} disabled={stop.isPending} variant="outline" className="gap-2">
                  {stop.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
                  Stop bot
                </Button>
              ) : (
                <Button onClick={() => start.mutate()} disabled={start.isPending || !cfg?.hasToken} className="everest-glow gap-2">
                  {start.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  Start bot
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Status", value: status?.status ?? "offline", color: isOnline ? "text-emerald-400" : status?.status === "error" ? "text-destructive" : "text-muted-foreground" },
              { label: "Token", value: cfg?.hasToken ? cfg.tokenPreview : "Not set", color: cfg?.hasToken ? "text-foreground" : "text-muted-foreground" },
              { label: "Servers", value: status?.guildCount?.toString() ?? "—", color: "text-foreground" },
              { label: "Auto-start", value: cfg?.enabled ? "Yes" : "No", color: cfg?.enabled ? "text-primary" : "text-muted-foreground" },
            ].map(s => (
              <div key={s.label} className="bg-muted/20 border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className={`text-sm font-mono mt-1 capitalize ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Bot Configuration</CardTitle>
          <CardDescription>
            Get a token from <a className="text-primary hover:underline inline-flex items-center gap-1" href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal <ExternalLink className="h-3 w-3" /></a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bot Token {cfg?.hasToken && <Badge variant="outline" className="ml-2 text-[10px] border-emerald-500/30 text-emerald-400">SET</Badge>}</Label>
            <div className="relative mt-1.5">
              <Input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder={cfg?.hasToken ? `Currently: ${cfg.tokenPreview}` : "MTM4OTQ4..."}
                className="bg-background font-mono text-xs pr-10"
              />
              <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowToken(s => !s)}>
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Client ID (optional)</Label>
              <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder={cfg?.clientId ?? "Application ID"} className="bg-background mt-1.5 font-mono text-xs" />
            </div>
            <div>
              <Label>Guild ID (optional, for instant slash commands)</Label>
              <Input value={guildId} onChange={e => setGuildId(e.target.value)} placeholder={cfg?.guildId ?? "Server ID"} className="bg-background mt-1.5 font-mono text-xs" />
            </div>
          </div>
          <div>
            <Label>Owner Discord ID (notifications target)</Label>
            <Input value={ownerDiscordId} onChange={e => setOwnerDiscordId(e.target.value)} placeholder={cfg?.ownerDiscordId ?? "Your Discord user ID"} className="bg-background mt-1.5 font-mono text-xs" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => saveCfg.mutate()} disabled={saveCfg.isPending} className="gap-2">
              {saveCfg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save config
            </Button>
            <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { if (confirm("Wipe all bot configuration?")) wipe.mutate(); }} disabled={wipe.isPending}>
              {wipe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Wipe config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slash commands */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Available Slash Commands</CardTitle>
          <CardDescription>Auto-registered when the bot starts. Use them in your linked Discord server.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { cmd: "/status", desc: "Overall panel stats (servers, vps, nodes, users)" },
              { cmd: "/servers", desc: "List all game servers and their status" },
              { cmd: "/vps", desc: "List all VPS instances" },
              { cmd: "/nodes", desc: "Node health & FQDNs" },
              { cmd: "/help", desc: "Show all available commands" },
            ].map(c => (
              <div key={c.cmd} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <code className="font-mono text-xs text-primary bg-background px-2 py-1 rounded">{c.cmd}</code>
                <span className="text-xs text-muted-foreground">{c.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick setup */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {cfg?.hasToken ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-amber-400" />}
            Quick Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground">
            <li>Open the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord Developer Portal</a> and create a new application.</li>
            <li>Go to <span className="text-foreground font-mono text-xs">Bot → Reset Token</span> and copy the token.</li>
            <li>Paste it above, save, then click <span className="text-foreground font-semibold">Start bot</span>.</li>
            <li>Invite the bot to your server using the OAuth2 URL generator with <span className="text-foreground font-mono text-xs">bot</span> + <span className="text-foreground font-mono text-xs">applications.commands</span> scopes.</li>
            <li>(Optional) Have users link their Discord ID under Settings to receive password reset DMs.</li>
          </ol>
          <div className="flex gap-2 pt-3 border-t border-primary/20 mt-3">
            <a href="https://discord.gg/qnMmKQKaZ" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2"><Bot className="h-3.5 w-3.5" /> Official Discord</Button>
            </a>
            <a href="https://github.com/NOVA55235" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2"><Github className="h-3.5 w-3.5" /> GitHub</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
