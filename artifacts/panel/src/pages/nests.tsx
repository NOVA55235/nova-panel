import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight, Server, Cpu, Code2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const token = () => localStorage.getItem("gamepanel_token") || "";

async function fetchNests() {
  const r = await fetch(`${API_BASE}/api/nests`, { headers: { Authorization: `Bearer ${token()}` } });
  return r.json();
}
async function fetchNest(id: number) {
  const r = await fetch(`${API_BASE}/api/nests/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
  return r.json();
}

export default function Nests() {
  const [selectedNest, setSelectedNest] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: nests = [] } = useQuery({ queryKey: ["nests"], queryFn: fetchNests });
  const { data: nestDetail } = useQuery({
    queryKey: ["nest", selectedNest],
    queryFn: () => fetchNest(selectedNest!),
    enabled: !!selectedNest,
  });

  function copy(text: string, id: string) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  }

  const GAME_ICONS: Record<string, string> = {
    "Minecraft": "⛏️",
    "Counter-Strike": "🎯",
    "Rust": "🔧",
    "Valheim": "⚔️",
    "ARK: Survival Evolved": "🦕",
    "Terraria": "🌎",
    "Voice Servers": "🎙️",
    "FiveM / GTA": "🚗",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nests & Eggs</h2>
        <p className="text-muted-foreground mt-1">Pre-configured game server templates. Select an egg when creating a server.</p>
      </div>

      <div className="grid md:grid-cols-[280px,1fr] gap-6">
        {/* Nest list */}
        <div className="space-y-2">
          {nests.map((n: any) => (
            <button
              key={n.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                selectedNest === n.id
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
              }`}
              onClick={() => setSelectedNest(n.id)}
            >
              <span className="text-xl">{GAME_ICONS[n.name] || "🎮"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{n.name}</p>
                <p className="text-xs text-muted-foreground truncate">{n.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        {/* Egg detail */}
        <div>
          {!selectedNest ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-dashed border-border text-center p-8">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Select a nest to view its eggs</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Each nest contains pre-configured server templates</p>
            </div>
          ) : nestDetail ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{GAME_ICONS[nestDetail.name] || "🎮"}</span>
                <div>
                  <h3 className="text-xl font-bold">{nestDetail.name}</h3>
                  <p className="text-sm text-muted-foreground">{nestDetail.eggs?.length} egg{nestDetail.eggs?.length !== 1 ? "s" : ""} available</p>
                </div>
              </div>

              {nestDetail.eggs?.map((egg: any) => (
                <Card key={egg.id} className="bg-card border-border hover:border-primary/30 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{egg.name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[240px]">{egg.dockerImage}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7 shrink-0 gap-1" onClick={() => copy(egg.dockerImage, `docker-${egg.id}`)}>
                        {copiedId === `docker-${egg.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy Image
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Code2 className="h-3 w-3" /> Startup Command
                      </p>
                      <div className="flex items-start gap-2">
                        <code className="flex-1 text-xs font-mono bg-black/30 border border-border rounded-md p-2.5 text-green-300 break-all">{egg.startup}</code>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 mt-0.5" onClick={() => copy(egg.startup, `startup-${egg.id}`)}>
                          {copiedId === `startup-${egg.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {egg.envVars && Object.keys(egg.envVars).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Environment Variables</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(egg.envVars).map(([k, v]: [string, any]) => (
                            <Badge key={k} variant="outline" className="text-[10px] font-mono border-border">
                              {k}={v || '""'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-48">
              <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
