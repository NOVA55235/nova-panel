import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import {
  useGetVps,
  useVpsPowerAction,
  useGetVpsStats,
  getGetVpsQueryKey,
  getGetVpsStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Square, RotateCw, Terminal, AlertTriangle, 
  Activity, HardDrive, Cpu, Loader2, ArrowLeft,
  ChevronRight, Key, ShieldAlert, Trash2, Copy, Maximize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, RefreshCw } from "lucide-react";
import { SiUbuntu, SiDebian } from "react-icons/si";

type ConsoleLine = {
  id: number;
  type: "system" | "input" | "output" | "error" | "warn" | "success";
  text: string;
};

let lineIdCounter = 0;
function mkLine(type: ConsoleLine["type"], text: string): ConsoleLine {
  return { id: lineIdCounter++, type, text };
}

function simulateCommand(cmd: string, vps: { name: string; username: string; osTemplate: string; cpuCores: number; memoryMb: number; diskGb: number; ipAddress: string }): ConsoleLine[] {
  const parts = cmd.trim().split(/\s+/);
  const bin = parts[0];
  const args = parts.slice(1);

  const out = (...lines: [ConsoleLine["type"], string][]) => lines.map(([t, s]) => mkLine(t, s));

  switch (bin) {
    case "":
      return [];
    case "help":
      return out(
        ["output", "Available commands (simulated):"],
        ["output", "  help           — show this help"],
        ["output", "  clear          — clear terminal"],
        ["output", "  ls [dir]       — list files"],
        ["output", "  pwd            — print working directory"],
        ["output", "  whoami         — current user"],
        ["output", "  uname -a       — system info"],
        ["output", "  free -h        — memory usage"],
        ["output", "  df -h          — disk usage"],
        ["output", "  uptime         — system uptime"],
        ["output", "  ps aux         — process list"],
        ["output", "  ip addr        — network interfaces"],
        ["output", "  cat /etc/os-release — OS details"],
        ["output", "  echo [text]    — print text"],
        ["warn",   "  Note: this is a simulated console. Connect via SSH for full access."],
      );
    case "clear":
      return [{ id: lineIdCounter++, type: "system", text: "__CLEAR__" }];
    case "pwd":
      return out(["output", `/home/${vps.username}`]);
    case "whoami":
      return out(["output", vps.username]);
    case "echo":
      return out(["output", args.join(" ")]);
    case "uname":
      return out(["output", `Linux ${vps.name} 6.1.0-21-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.90-1 (2024-05-03) x86_64 GNU/Linux`]);
    case "ls": {
      const dir = args[0] || "~";
      if (dir === "~" || dir === "/home/" + vps.username) {
        return out(
          ["success", ".bash_history  .bashrc  .profile  .ssh/"],
          ["output", "logs/  scripts/  data/"],
        );
      }
      return out(["output", "bin/  boot/  dev/  etc/  home/  lib/  lib64/  media/  mnt/  opt/  proc/  root/  run/  sbin/  srv/  sys/  tmp/  usr/  var/"]);
    }
    case "free": {
      const used = Math.round(vps.memoryMb * 0.12);
      const free = vps.memoryMb - used;
      const mb = args[0] === "-h" || args[0] === "-m";
      return out(
        ["output", `               total        used        free      shared  buff/cache   available`],
        ["output", `Mem:        ${vps.memoryMb.toString().padStart(7)}      ${used.toString().padStart(7)}     ${free.toString().padStart(7)}           0           0     ${(free - 100).toString().padStart(7)}`],
        ["output", `Swap:            0           0           0`],
        [mb ? "output" : "output", ""],
      );
    }
    case "df": {
      const usedGb = (vps.diskGb * 0.154).toFixed(1);
      const freeGb = (vps.diskGb - parseFloat(usedGb)).toFixed(1);
      return out(
        ["output", `Filesystem      Size  Used Avail Use% Mounted on`],
        ["output", `/dev/sda1        ${vps.diskGb}G  ${usedGb}G  ${freeGb}G  16% /`],
        ["output", `tmpfs           ${(vps.memoryMb / 2048).toFixed(1)}G     0  ${(vps.memoryMb / 2048).toFixed(1)}G   0% /dev/shm`],
      );
    }
    case "uptime": {
      const days = Math.floor(Math.random() * 30) + 1;
      return out(["output", ` ${new Date().toLocaleTimeString()} up ${days} days,  2:14,  1 user,  load average: 0.01, 0.03, 0.00`]);
    }
    case "ps": {
      return out(
        ["output", `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND`],
        ["output", `root           1  0.0  0.1 169272 11212 ?        Ss   May01   0:01 /sbin/init`],
        ["output", `root         234  0.0  0.0  14516  3008 ?        Ss   May01   0:00 /usr/sbin/sshd`],
        ["output", `${vps.username}       1048  0.1  0.2  21032  8760 pts/0    Ss   00:01   0:00 -bash`],
        ["output", `${vps.username}       1091  0.0  0.1  12524  3528 pts/0    R+   00:01   0:00 ps aux`],
      );
    }
    case "ip": {
      return out(
        ["output", `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536`],
        ["output", `    inet 127.0.0.1/8 scope host lo`],
        ["output", `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500`],
        ["success", `    inet ${vps.ipAddress}/24 brd ${vps.ipAddress.split('.').slice(0,3).join('.')}.255 scope global eth0`],
      );
    }
    case "cat": {
      if (args[0] === "/etc/os-release") {
        const os = vps.osTemplate;
        return out(
          ["output", `NAME="${os.includes("ubuntu") ? "Ubuntu" : os.includes("debian") ? "Debian GNU/Linux" : "Alpine Linux"}"`],
          ["output", `ID=${os.includes("ubuntu") ? "ubuntu" : os.includes("debian") ? "debian" : "alpine"}`],
          ["output", `PRETTY_NAME="${os.replace("-", " ").toUpperCase()}"`],
          ["output", `HOME_URL="https://www.${os.split("-")[0]}.com/"`],
        );
      }
      if (args[0] === "/etc/hostname") return out(["output", vps.name]);
      return out(["error", `cat: ${args[0] || ""}: No such file or directory`]);
    }
    case "hostname":
      return out(["output", vps.name]);
    case "date":
      return out(["output", new Date().toString()]);
    case "sudo":
      return out(["warn", `[sudo] password for ${vps.username}:`], ["error", "sudo: This is a simulated terminal. Use SSH for privileged access."]);
    case "ssh":
    case "scp":
    case "sftp":
      return out(["warn", `${bin}: use the SSH details in the sidebar to connect directly.`]);
    case "exit":
    case "logout":
      return out(["warn", "Session cannot be closed in the web console."]);
    default:
      return out(["error", `${bin}: command not found`], ["output", `Type 'help' to see available simulated commands.`]);
  }
}

export default function VpsDetail() {
  const { id } = useParams();
  const vpsId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [reinstallOpen, setReinstallOpen] = useState(false);
  const [cpuCores, setCpuCores] = useState<number>(1);
  const [memoryMb, setMemoryMb] = useState<number>(1024);
  const [diskGb, setDiskGb] = useState<number>(20);
  const [resourcesInit, setResourcesInit] = useState(false);

  // Console state
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [consoleLines, scrollToBottom]);

  // Initialize console on VPS load
  useEffect(() => {
    if (!vps) return;
    const boot: ConsoleLine[] = [
      mkLine("system", `Nova Panel Web Console — ${vps.osTemplate.toUpperCase()}`),
      mkLine("system", `Connected to ${vps.name} (${vps.ipAddress})`),
      mkLine("warn",   "This is a simulated console. For full access, use SSH."),
      mkLine("output", `Type 'help' for available commands.`),
      mkLine("output", ""),
    ];
    if (vps.status === "running") {
      boot.push(
        mkLine("success", `Welcome to ${vps.osTemplate.replace(/-/g, " ").toUpperCase()}!`),
        mkLine("output",  `System information as of ${new Date().toLocaleString()}`),
        mkLine("output",  `  System load:  0.01  0.03  0.00`),
        mkLine("output",  `  Usage of /:   15.4% of ${vps.diskGb}GB`),
        mkLine("output",  `  Memory usage: 12%    CPU: ${vps.cpuCores} vCPU(s)`),
        mkLine("output",  ""),
      );
    } else {
      boot.push(mkLine("error", "VPS is offline. Start the VPS to enable interactive console."));
    }
    setConsoleLines(boot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vps?.id]);

  function handleConsoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vps || vps.status !== "running") return;
    const cmd = consoleInput.trim();
    const prompt = mkLine("input", `${vps.username}@${vps.name}:~$ ${cmd}`);
    const results = simulateCommand(cmd, vps);

    if (results.some(l => l.text === "__CLEAR__")) {
      setConsoleLines([]);
    } else {
      setConsoleLines(prev => [...prev, prompt, ...results]);
    }

    if (cmd) {
      setCmdHistory(prev => [cmd, ...prev.slice(0, 49)]);
    }
    setConsoleInput("");
    setHistoryIdx(-1);
  }

  function handleConsoleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(next);
      setConsoleInput(cmdHistory[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next);
      setConsoleInput(next === -1 ? "" : cmdHistory[next] ?? "");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setConsoleLines([]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      if (vps) {
        const cancel = mkLine("input", `${vps.username}@${vps.name}:~$ ${consoleInput}^C`);
        setConsoleLines(prev => [...prev, cancel]);
      }
      setConsoleInput("");
      setHistoryIdx(-1);
    }
  }

  const lineColor: Record<ConsoleLine["type"], string> = {
    system:  "text-cyan-400/80 text-xs italic",
    input:   "text-emerald-400 font-semibold",
    output:  "text-gray-300",
    error:   "text-red-400",
    warn:    "text-yellow-400",
    success: "text-green-400",
  };

  const reinstall = useMutation({
    mutationFn: () => apiFetch(`/api/vps/${vpsId}/reinstall`, { method: "POST" }),
    onSuccess: () => {
      setReinstallOpen(false);
      queryClient.invalidateQueries({ queryKey: getGetVpsQueryKey(vpsId) });
      toast({ title: "Reinstall initiated", description: "VPS will rebuild and come back online shortly." });
    },
    onError: () => toast({ title: "Error", description: "Failed to start reinstall.", variant: "destructive" }),
  });

  const saveResources = useMutation({
    mutationFn: () => apiFetch(`/api/vps/${vpsId}`, { method: "PUT", body: JSON.stringify({ cpuCores, memoryMb, diskGb }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetVpsQueryKey(vpsId) });
      toast({ title: "Resources updated", description: "New limits applied. Reboot the VPS for changes to take effect." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update resources.", variant: "destructive" }),
  });

  const { data: vps, isLoading } = useGetVps(vpsId, {
    query: {
      enabled: !!vpsId,
      queryKey: getGetVpsQueryKey(vpsId),
      refetchInterval: 5000,
    }
  });

  const { data: stats } = useGetVpsStats(vpsId, {
    query: {
      enabled: !!vpsId && vps?.status === "running",
      queryKey: getGetVpsStatsQueryKey(vpsId),
      refetchInterval: 3000,
    }
  });

  const powerAction = useVpsPowerAction();

  useEffect(() => {
    if (vps && !resourcesInit) {
      setCpuCores(vps.cpuCores);
      setMemoryMb(vps.memoryMb);
      setDiskGb(vps.diskGb);
      setResourcesInit(true);
    }
  }, [vps, resourcesInit]);

  // Mock timeseries data for charts
  const [cpuData, setCpuData] = useState<{time: string, value: number}[]>([]);
  const [ramData, setRamData] = useState<{time: string, value: number}[]>([]);

  useEffect(() => {
    if (stats) {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
      
      setCpuData(prev => {
        const next = [...prev, { time: now, value: stats.cpuUsage }];
        return next.slice(-20); // Keep last 20 points
      });
      
      setRamData(prev => {
        const next = [...prev, { time: now, value: stats.memoryUsed }];
        return next.slice(-20);
      });
    }
  }, [stats]);

  const handlePowerAction = (action: "start" | "stop" | "restart" | "kill") => {
    powerAction.mutate({
      id: vpsId,
      data: { action }
    }, {
      onSuccess: () => {
        toast({
          title: "Command sent",
          description: `Successfully sent ${action} command to VPS.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetVpsQueryKey(vpsId) });
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err.message || `Failed to ${action} VPS.`,
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vps) {
    return <div>VPS not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-accent/20 text-accent hover:bg-accent/30";
      case "stopped": return "bg-muted text-muted-foreground";
      case "error": return "bg-destructive/20 text-destructive";
      default: return "bg-primary/20 text-primary";
    }
  };

  const getOsIcon = (osTemplate: string) => {
    if (osTemplate.includes("ubuntu")) return <SiUbuntu className="w-6 h-6 text-orange-500" />;
    if (osTemplate.includes("debian")) return <SiDebian className="w-6 h-6 text-red-600" />;
    if (osTemplate.includes("alpine")) return <HardDrive className="w-6 h-6 text-blue-500" />;
    return <HardDrive className="w-6 h-6 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/vps" className="hover:text-foreground transition-colors flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> VPS Instances
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground font-medium">{vps.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          <div className="bg-background p-3 rounded-lg border border-border">
            {getOsIcon(vps.osTemplate)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{vps.name}</h1>
              <Badge variant="secondary" className={getStatusColor(vps.status)}>
                {vps.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {vps.osTemplate} • {vps.cpuCores} vCPU • {vps.memoryMb}MB RAM • {vps.diskGb}GB SSD
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={vps.status !== "stopped" && vps.status !== "error"}
            onClick={() => handlePowerAction("start")}
          >
            <Play className="mr-2 h-4 w-4" /> Start
          </Button>
          <Button 
            variant="secondary"
            disabled={vps.status !== "running"}
            onClick={() => handlePowerAction("restart")}
          >
            <RotateCw className="mr-2 h-4 w-4" /> Restart
          </Button>
          <Button 
            variant="destructive"
            disabled={vps.status === "stopped"}
            onClick={() => handlePowerAction("stop")}
          >
            <Square className="mr-2 h-4 w-4 fill-current" /> Stop
          </Button>
          <Button 
            variant="destructive"
            className="bg-red-900 text-white hover:bg-red-800"
            disabled={vps.status === "stopped"}
            onClick={() => handlePowerAction("kill")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Kill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Tabs */}
          <Tabs defaultValue="resources" className="w-full">
            <TabsList className="bg-card border border-border w-full justify-start h-auto p-1 overflow-x-auto">
              <TabsTrigger value="resources"><Activity className="mr-2 h-4 w-4" /> Resources</TabsTrigger>
              <TabsTrigger value="console" className="py-2"><Terminal className="mr-2 h-4 w-4" /> Console</TabsTrigger>
              <TabsTrigger value="settings"><HardDrive className="mr-2 h-4 w-4" /> Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resources" className="mt-4 space-y-4">
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
                        <linearGradient id="colorCpuVps" x1="0" y1="0" x2="0" y2="1">
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
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpuVps)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <HardDrive className="mr-2 h-4 w-4 text-accent" /> Memory Usage
                    <span className="ml-auto font-mono text-xl">
                      {stats ? `${(stats.memoryUsed).toFixed(0)}MB / ${stats.memoryLimit}MB` : "0MB"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ramData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRamVps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, vps.memoryMb]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--accent))' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorRamVps)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="console" className="mt-4">
              <div className="rounded-xl overflow-hidden border border-[#2a2a2a] shadow-2xl shadow-black/60 flex flex-col" style={{ height: 520 }}>
                {/* Terminal title bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2e2e2e] select-none shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Traffic-light dots */}
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 cursor-pointer" title="Close" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 cursor-pointer" title="Minimize" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 cursor-pointer" title="Maximize" />
                    <span className="ml-3 text-xs font-mono text-[#666] tracking-wide">
                      {vps.username}@{vps.name} — bash
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 px-2 text-[#666] hover:text-[#aaa] hover:bg-white/5 text-xs gap-1"
                      onClick={() => {
                        const text = consoleLines.map(l => l.text).join("\n");
                        navigator.clipboard.writeText(text);
                        toast({ description: "Console output copied" });
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 px-2 text-[#666] hover:text-red-400 hover:bg-white/5 text-xs gap-1"
                      onClick={() => setConsoleLines([])}
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </Button>
                  </div>
                </div>

                {/* Output area */}
                <div
                  className="flex-1 overflow-y-auto bg-[#0d0d0d] px-4 py-3 font-mono text-[13px] leading-relaxed cursor-text"
                  onClick={() => consoleInputRef.current?.focus()}
                >
                  {consoleLines.map(line => (
                    <div key={line.id} className={`whitespace-pre-wrap break-all ${lineColor[line.type]}`}>
                      {line.text === "" ? "\u00a0" : line.text}
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>

                {/* Input bar */}
                <form
                  onSubmit={handleConsoleSubmit}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] border-t border-[#222]"
                >
                  {vps.status === "running" ? (
                    <span className="text-emerald-400 font-mono text-[13px] font-semibold whitespace-nowrap shrink-0 select-none">
                      {vps.username}@{vps.name}:~$
                    </span>
                  ) : (
                    <span className="text-red-500 font-mono text-[13px] shrink-0 select-none">offline ✗</span>
                  )}
                  <input
                    ref={consoleInputRef}
                    type="text"
                    value={consoleInput}
                    onChange={e => setConsoleInput(e.target.value)}
                    onKeyDown={handleConsoleKey}
                    disabled={vps.status !== "running"}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={vps.status === "running" ? "Type a command… (↑↓ history, Ctrl+L clear, Ctrl+C cancel)" : "Start the VPS to use the console"}
                    className="flex-1 bg-transparent outline-none font-mono text-[13px] text-gray-200 placeholder:text-[#444] disabled:opacity-40 disabled:cursor-not-allowed caret-emerald-400"
                  />
                  {vps.status === "running" && (
                    <Button type="submit" size="sm" variant="ghost"
                      className="h-6 px-2 text-emerald-500/60 hover:text-emerald-400 hover:bg-white/5 shrink-0 font-mono text-xs"
                    >
                      ↵
                    </Button>
                  )}
                </form>
              </div>
              <p className="text-[11px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                <Terminal className="h-3 w-3" />
                Simulated console — use <code className="text-primary/70 font-mono">ssh {vps.username}@{vps.ipAddress} -p {vps.sshPort}</code> for a real shell.
              </p>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4 space-y-4">
              {isAdmin && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> Customize Resources</CardTitle>
                    <CardDescription>Upgrade or downgrade this VPS's CPU, RAM and disk allocation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-1.5">CPU Cores</label>
                        <Input type="number" min={1} value={cpuCores} onChange={e => setCpuCores(Math.max(1, parseInt(e.target.value) || 0))} className="bg-background font-mono" />
                        <p className="text-[11px] text-muted-foreground mt-1">vCPU cores</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Memory (MB)</label>
                        <Input type="number" min={256} value={memoryMb} onChange={e => setMemoryMb(Math.max(256, parseInt(e.target.value) || 0))} className="bg-background font-mono" />
                        <p className="text-[11px] text-muted-foreground mt-1">≈ {(memoryMb / 1024).toFixed(2)} GB</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">Disk (GB)</label>
                        <Input type="number" min={1} value={diskGb} onChange={e => setDiskGb(Math.max(1, parseInt(e.target.value) || 0))} className="bg-background font-mono" />
                        <p className="text-[11px] text-muted-foreground mt-1">SSD storage</p>
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
                  <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Reinstall OS</CardTitle>
                  <CardDescription className="text-destructive font-medium flex items-center mt-2">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Warning: This will destroy all data on the VPS.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={() => setReinstallOpen(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Reinstall Operating System
                  </Button>
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
                <Key className="mr-2 h-4 w-4 text-primary" /> Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">IP Address</p>
                <div className="bg-background border border-border p-2 rounded text-sm font-mono flex justify-between items-center">
                  <span className="text-primary">{vps.ipAddress}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                    navigator.clipboard.writeText(vps.ipAddress);
                    toast({ description: "IP copied to clipboard" });
                  }}>
                    <span className="sr-only">Copy</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Username</p>
                <div className="bg-background border border-border p-2 rounded text-sm font-mono flex justify-between items-center">
                  <span>{vps.username}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                    navigator.clipboard.writeText(vps.username);
                    toast({ description: "Username copied to clipboard" });
                  }}>
                    <span className="sr-only">Copy</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">SSH Port</p>
                <div className="bg-background border border-border p-2 rounded text-sm font-mono">
                  {vps.sshPort}
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">SSH Connection Command</p>
                <div className="bg-black border border-border p-3 rounded text-xs font-mono text-primary overflow-x-auto whitespace-nowrap">
                  ssh {vps.username}@{vps.ipAddress} -p {vps.sshPort}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reinstallOpen} onOpenChange={setReinstallOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reinstall {vps?.osTemplate}?</DialogTitle>
            <DialogDescription>This will wipe ALL data on this VPS and reinstall the operating system from scratch. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReinstallOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={reinstall.isPending} onClick={() => reinstall.mutate()}>
              {reinstall.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reinstall Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
