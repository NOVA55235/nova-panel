import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Zap, Lock, Mail, Shield } from "lucide-react";
import { getLoginBg, PRESETS, type LoginBgConfig } from "@/hooks/use-login-bg";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login, isLoading } = useAuth();
  const [bgConfig, setBgConfig] = useState<LoginBgConfig>(getLoginBg);

  useEffect(() => {
    const h = (e: Event) => setBgConfig((e as CustomEvent).detail);
    window.addEventListener("loginbgchange", h);
    return () => window.removeEventListener("loginbgchange", h);
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(v: z.infer<typeof schema>) {
    login({ data: v }, {
      onError: (err: any) => form.setError("root", {
        message: err?.data?.message || err?.message || "Invalid credentials. Please try again.",
      }),
    });
  }

  const preset = PRESETS[bgConfig.preset];
  const isCustom = bgConfig.preset === "custom" && bgConfig.customUrl;
  const opacity = (bgConfig.opacity ?? 60) / 100;

  return (
    <div className="min-h-screen flex bg-background overflow-hidden relative">
      {/* Full-page background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {bgConfig.videoUrl ? (
          <video
            key={bgConfig.videoUrl}
            src={bgConfig.videoUrl}
            autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity }}
          />
        ) : isCustom ? (
          <div className="absolute inset-0" style={{ backgroundImage: `url(${bgConfig.customUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity }} />
        ) : (
          <div className="absolute inset-0" style={{ background: preset?.gradient ?? PRESETS.default.gradient, opacity }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,38%,4%)]/95 via-[hsl(220,28%,6%)]/70 to-[hsl(220,28%,6%)]/30" />
      </div>

      {/* LEFT — login form (Pterodactyl-style) */}
      <div className="relative z-10 w-full lg:w-[42%] flex flex-col justify-center p-6 sm:p-12 anim-slide-left">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 anim-float">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">Nova Panel</p>
              <p className="text-[11px] text-primary/70 tracking-[0.25em] uppercase mt-1">Everest Node</p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-foreground">Welcome back</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Sign in to manage your game servers, VPS fleet and infrastructure.
          </p>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary/60 mt-3 mb-8">
            <span className="h-px flex-1 bg-primary/20" />
            <span>Game Server &amp; VPS Control Plane</span>
            <span className="h-px flex-1 bg-primary/20" />
          </div>

          <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 shadow-2xl shadow-black/40 anim-fade-scale">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="admin@example.com" autoComplete="email" {...field} className="pl-9 bg-background border-border h-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} className="pl-9 bg-background border-border h-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {form.formState.errors.root && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2.5 flex items-center gap-2 anim-fade-in">
                    <Shield className="h-4 w-4 shrink-0" />
                    {form.formState.errors.root.message}
                  </div>
                )}

                <Button type="submit" className="w-full h-10 font-semibold everest-glow" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Signing in...</span>
                  ) : "Sign In"}
                </Button>

                <div className="text-center pt-1">
                  <Link href="/forgot-password">
                    <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                      Forgot your password?
                    </span>
                  </Link>
                </div>
              </form>
            </Form>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register">
              <span className="text-primary font-semibold hover:underline cursor-pointer">Register here</span>
            </Link>
          </p>

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/60 mt-8">
            <a href="https://discord.gg/qnMmKQKaZ" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Discord</a>
            <span className="opacity-40">·</span>
            <a href="https://github.com/NOVA55235" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">GitHub</a>
          </div>

          <p className="text-[11px] text-muted-foreground/40 mt-3 text-center">
            Nova Panel · Built by <span className="text-primary/60">@Lord_nova98</span>
          </p>
        </div>
      </div>

      {/* RIGHT — empty space, shows the admin's chosen background */}
      <div className="hidden lg:block flex-1" />
    </div>
  );
}
