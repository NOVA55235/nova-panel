import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const token = () => localStorage.getItem("gamepanel_token") || "";

async function fetchKeys() {
  const r = await fetch(`${API_BASE}/api/api-keys`, { headers: { Authorization: `Bearer ${token()}` } });
  return r.json();
}
async function createKey(name: string) {
  const r = await fetch(`${API_BASE}/api/api-keys`, {
    method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return r.json();
}
async function deleteKey(id: number) {
  await fetch(`${API_BASE}/api/api-keys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
}

const KEYS_QUERY = ["api-keys"];

export default function ApiKeys() {
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: keys = [], isLoading } = useQuery({ queryKey: KEYS_QUERY, queryFn: fetchKeys });

  const create = useMutation({
    mutationFn: () => createKey(newKeyName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: KEYS_QUERY });
      setCreatedKey(data.fullKey);
      setCreateOpen(false);
      setNewKeyName("");
    },
    onError: () => toast({ title: "Error", description: "Failed to create API key.", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS_QUERY });
      toast({ title: "API key deleted" });
      setDeleteTarget(null);
    },
  });

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Manage API keys for programmatic access to GamePanel."
              : "View API keys assigned to your account. Only administrators can create or revoke keys."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create API Key
          </Button>
        )}
      </div>

      <Card className="bg-amber-950/20 border-amber-700/30">
        <CardContent className="pt-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">Keep your API keys secret</p>
            <p className="text-amber-500/80 mt-1">API keys grant full access to your account. Never share them or commit them to version control. Rotate keys regularly for security.</p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : keys.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border border-border border-dashed">
          <Key className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No API keys</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Create an API key to access GamePanel programmatically." : "No API keys have been issued to your account yet."}
          </p>
          {isAdmin && (
            <Button className="mt-4" variant="outline" onClick={() => setCreateOpen(true)}>Create First Key</Button>
          )}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {keys.map((key: any) => (
              <div key={key.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{key.name}</p>
                    <Badge variant="secondary" className={key.isActive ? "bg-green-500/20 text-green-400 text-xs" : "bg-red-500/20 text-red-400 text-xs"}>
                      {key.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{key.keyPrefix}••••••••••••••••••</code>
                    {key.lastUsedAt && <span className="text-xs text-muted-foreground">Last used {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}</span>}
                    <span className="text-xs text-muted-foreground">Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0" onClick={() => setDeleteTarget(key.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">API Usage</CardTitle>
          <CardDescription>Use your API key in the Authorization header for all requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-black/50 border border-border p-4 font-mono text-sm text-green-400 overflow-x-auto">
            <p className="text-muted-foreground text-xs mb-2"># Authenticate with your API key</p>
            <p>curl -H "Authorization: Bearer gp_your_api_key" \</p>
            <p className="pl-4">{typeof window !== 'undefined' ? window.location.origin : ''}/api/servers</p>
          </div>
          <p className="text-xs text-muted-foreground">All API endpoints are documented in the OpenAPI spec at <code className="font-mono bg-muted/50 px-1 rounded">lib/api-spec/openapi.yaml</code></p>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> Create API Key</DialogTitle>
            <DialogDescription>Give your key a descriptive name to remember what it's for.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">Key Name</label>
              <Input placeholder="e.g. My Discord Bot, Backup Script" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="bg-background" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setNewKeyName(""); }}>Cancel</Button>
            <Button disabled={!newKeyName || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show created key dialog */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent className="sm:max-w-[520px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400"><Check className="h-5 w-5" /> API Key Created</DialogTitle>
            <DialogDescription className="text-amber-400">
              Copy your key now — it will never be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-black/50 border border-border p-3 rounded-md text-green-300 break-all">{createdKey}</code>
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdKey!, "created")}>
                {copiedId === "created" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>Done — I've copied my key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[380px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Revoke API Key</DialogTitle>
            <DialogDescription>This key will be permanently deleted and any applications using it will stop working.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget)}>
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
