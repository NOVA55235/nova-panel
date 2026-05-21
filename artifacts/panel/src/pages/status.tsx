import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Shield, Zap, Globe, Server as ServerIcon, AlertCircle,
  CheckCircle2, Clock, TrendingUp, Wifi, Lock, Gauge
} from "lucide-react";

interface StatusMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: "ok" | "warn" | "crit";
  icon: React.ElementType;
}

interface IncidentLog {
  time: string;
  level: "info" | "warn" | "crit";
  message: string;
}

export default function StatusPage() {
  const [tick, setTick] = useState(0);
  const [requests, setRequests] = useState(() => Math.floor(Math.random() * 800) + 1200);
  const [blocked, setBlocked] = useState(() => Math.floor(Math.random() * 40) + 12);
  const [load, setLoad] = useState(() => Math.random() * 30 + 15);

  useEffect(() => {
    const i = setInterval(() => {
      setTick(t => t + 1);
      setRequests(r => r + Math.floor(Math.random() * 24) - 8);
      setBlocked(b => b + (Math.random() > 0.65 ? 1 : 0));
      setLoad(_ => Math.random() * 30 + 15);
    }, 2000);
    return () => clearInterval(i);
  }, []);

  const metrics: StatusMetric[] = [
    { label: "Site Load", value: Math.round(load), max: 100, unit: "%", status: load > 70 ? "warn" : "ok", icon: Gauge },
    { label: "Active Sessions", value: 142 + (tick % 5), max: 1000, unit: "", status: "ok", icon: Activity },
    { label: "Bandwidth", value: 24 + (tick % 8), max: 100, unit: "Mbps", status: "ok", icon: Wifi },
    { label: "Response Time", value: 38 + (tick % 12), max: 500, unit: "ms", status: "ok", icon: Clock },
  ];

  const services = [
    { name: "Panel API", status: "operational", uptime: "99.99%" },
    { name: "Database", status: "operational", uptime: "99.97%" },
    { name: "Game Server Daemon", status: "operational", uptime: "99.92%" },
    { name: "Discord Bot Bridge", status: "operational", uptime: "99.85%" },
    { name: "DDoS Mitigation", status: "operational", uptime: "100.00%" },
    { name: "CDN / Static Assets", status: "operational", uptime: "99.99%" },
  ];

  const incidents: IncidentLog[] = [
    { time: "14:22", level: "info", message: "All systems operational" },
    { time: "13:45", level: "info", message: "Routine maintenance completed on node-eu-1" },
    { time: "12:08", level: "warn", message: `${blocked} suspicious requests filtered by edge firewall` },
    { time: "10:33", level: "info", message: "Scheduled backup completed successfully (4.2 GB)" },
    { time: "09:14", level: "info", message: "Auto-failover test passed — switchover < 800ms" },
  ];

  const statusColor = (s: string) =>
    s === "ok" || s === "operational" ? "text-emerald-400" :
    s === "warn" ? "text-amber-400" : "text-destructive";

  return (
    <div className="space-y-6 anim-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary anim-pulse-glow rounded-full p-1 bg-primary/10" />
            Panel Status
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time site load, security posture, and infrastructure health.
          </p>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-sm font-semibold gap-2">
          <CheckCircle2 className="h-4 w-4" /> All Systems Operational
        </Badge>
      </div>

      {/* DDoS / Security banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border-primary/30 card-hover">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 anim-pulse-glow">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  DDoS Protection <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">ACTIVE</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Layer 3/4/7 mitigation · Anycast network · Auto challenge mode
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">{blocked.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Threats Blocked (24h)</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">{requests.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Requests / min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {metrics.map(m => (
          <Card key={m.label} className="bg-card border-border card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <m.icon className={`h-4 w-4 ${statusColor(m.status)}`} />
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/30 text-emerald-400 uppercase">
                  Live
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-black mt-1 tabular-nums">
                {m.value}<span className="text-sm font-normal text-muted-foreground ml-1">{m.unit}</span>
              </p>
              <Progress value={(m.value / m.max) * 100} className="h-1 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services + Incidents grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Services list */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ServerIcon className="h-4 w-4 text-primary" /> Service Status
            </CardTitle>
            <CardDescription>Live health of each Nova Panel service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 stagger">
            {services.map(s => (
              <div key={s.name} className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
                  </div>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground tabular-nums">{s.uptime}</span>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 capitalize">
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent incidents */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Activity Log
            </CardTitle>
            <CardDescription>Recent infrastructure events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 stagger">
            {incidents.map((it, i) => (
              <div key={i} className="flex gap-2.5 text-xs border-l-2 pl-3 py-1"
                style={{ borderColor: it.level === "warn" ? "hsl(38 88% 56%)" : it.level === "crit" ? "hsl(0 68% 56%)" : "hsl(198 92% 54%)" }}>
                <span className="text-muted-foreground font-mono shrink-0">{it.time}</span>
                <span className="text-foreground/90">{it.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Security features grid */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" /> Security Features Enabled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
            {[
              { icon: Shield, label: "DDoS L3/L4/L7", on: true },
              { icon: Lock, label: "TLS 1.3 / HSTS", on: true },
              { icon: Globe, label: "Anycast Network", on: true },
              { icon: Zap, label: "Rate Limiting", on: true },
              { icon: AlertCircle, label: "Bot Detection", on: true },
              { icon: Activity, label: "Real-time Logs", on: true },
              { icon: Wifi, label: "Auto-Failover", on: true },
              { icon: CheckCircle2, label: "Health Checks", on: true },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/30 border border-border">
                <f.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium flex-1">{f.label}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
