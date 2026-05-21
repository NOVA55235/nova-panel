import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2, ArrowLeft, Zap, Sparkles, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [info, setInfo] = useState<{ email?: string; hasDiscord?: boolean } | null>(null);
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [generatedPwd, setGeneratedPwd] = useState<string | null>(null);
  const [deliveredViaDiscord, setDeliveredViaDiscord] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) { setValid(false); return; }
    setToken(t);
    fetch(`/api/auth/reset-password/${t}`)
      .then(r => r.json())
      .then(d => {
        setValid(d.valid);
        if (d.valid) setInfo({ email: d.email, hasDiscord: d.hasDiscord });
      })
      .catch(() => setValid(false));
  }, []);

  async function submit(generate: boolean) {
    if (!generate) {
      if (pwd.length < 8) {
        toast({ title: "Too short", description: "Password must be at least 8 characters.", variant: "destructive" });
        return;
      }
      if (pwd !== confirmPwd) {
        toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: generate ? "" : pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Reset failed", description: data?.error ?? "Try again.", variant: "destructive" });
        return;
      }
      setDone(true);
      setGeneratedPwd(data.newPassword ?? null);
      setDeliveredViaDiscord(!!data.deliveredViaDiscord);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md anim-fade-in">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 anim-float">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">Nova Panel</p>
              <p className="text-[11px] text-primary/70 tracking-[0.25em] uppercase mt-1">Everest Node</p>
            </div>
          </div>

          {valid === null ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : valid === false ? (
            <div className="bg-card/80 backdrop-blur-md border border-destructive/30 rounded-xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invalid or expired link</h2>
              <p className="text-sm text-muted-foreground mb-6">
                This reset link has either been used already or has expired (links are valid for 1 hour).
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">Request a new link</Button>
              </Link>
            </div>
          ) : done ? (
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-8 text-center anim-fade-scale">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password reset</h2>
              <p className="text-sm text-muted-foreground mb-4">Your password has been updated.</p>
              {generatedPwd && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Your generated password (save it now — won't be shown again):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded border border-border break-all">{generatedPwd}</code>
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard?.writeText(generatedPwd); toast({ title: "Copied" }); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {deliveredViaDiscord && (
                <p className="text-xs text-emerald-400 mb-4">
                  ✓ Sent to your Discord DMs by the Nova bot.
                </p>
              )}
              <Button className="w-full" onClick={() => setLocation("/login")}>Sign in</Button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-black text-foreground">Choose a new password</h2>
              <p className="text-muted-foreground text-sm mt-2 mb-8">
                Resetting password for <span className="font-mono text-foreground">{info?.email}</span>
              </p>

              <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 space-y-4 anim-fade-scale">
                <div>
                  <Label htmlFor="pwd">New password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="pwd" type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="At least 8 characters" className="bg-background pl-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cpwd">Confirm password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="cpwd" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="bg-background pl-9" />
                  </div>
                </div>
                <Button onClick={() => submit(false)} disabled={submitting} className="w-full everest-glow gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Set new password
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground uppercase tracking-wider">or</span></div>
                </div>
                <Button onClick={() => submit(true)} disabled={submitting} variant="outline" className="w-full gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Auto-generate strong password
                </Button>
                {info?.hasDiscord && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Your new password will also be DM'd to you by the Nova Discord bot.
                  </p>
                )}
                <Link href="/login">
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="hidden lg:block bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_60%)]" />
      </div>
    </div>
  );
}
