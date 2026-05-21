import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2, ArrowLeft, Zap } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [deliveredViaDiscord, setDeliveredViaDiscord] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setDeliveredViaDiscord(!!data.deliveredViaDiscord);
      setDone(true);
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

          {done ? (
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-8 shadow-2xl shadow-black/40 text-center anim-fade-scale">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Reset link sent</h2>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-mono text-foreground">{email}</span>, a password reset link has been generated.
              </p>
              {deliveredViaDiscord && (
                <p className="text-xs text-emerald-400 mt-3">
                  ✓ Sent via the Nova Discord bot to your linked Discord account.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Link is valid for 1 hour. Check your email and Discord DMs (if linked).
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-6 w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-black text-foreground">Forgot password?</h2>
              <p className="text-muted-foreground text-sm mt-2 mb-8">
                Enter your email — we'll send a reset link to your inbox and DM it via the official Nova Discord bot if you've linked Discord.
              </p>

              <form onSubmit={submit} className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 shadow-2xl shadow-black/40 space-y-4 anim-fade-scale">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-background pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full everest-glow gap-2 font-semibold">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send reset link
                </Button>
                <Link href="/login">
                  <Button type="button" variant="ghost" className="w-full text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
                  </Button>
                </Link>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Need help? Join us on{" "}
                <a href="https://discord.gg/qnMmKQKaZ" target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord</a>
                {" · "}
                <a href="https://github.com/NOVA55235" target="_blank" rel="noreferrer" className="text-primary hover:underline">GitHub</a>
              </p>
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
