import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette, Check, ImageIcon, Sliders, ExternalLink,
  User, Lock, Zap, Monitor, LogIn, Sparkles, Video, X
} from "lucide-react";
import { getLoginBg, setLoginBg, PRESETS as LOGIN_PRESETS, type LoginBgPreset, type LoginBgConfig } from "@/hooks/use-login-bg";
import { getPanelBg, setPanelBg, applyPanelBg, PANEL_PRESETS, type PanelBgPreset, type PanelBgConfig } from "@/hooks/use-panel-bg";
import { getAnimBg, applyAnimBg, saveAnimBgToServer, ANIM_BG_META, type AnimBgConfig, type AnimBgType } from "@/hooks/use-animated-bg";
import { AnimatedBackground } from "@/components/animated-background";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LOGIN_PRESET_KEYS = Object.keys(LOGIN_PRESETS) as LoginBgPreset[];
const PANEL_PRESET_KEYS = Object.keys(PANEL_PRESETS) as PanelBgPreset[];

function PresetGrid<T extends string>({
  presets,
  keys,
  selected,
  onSelect,
  isLogin = false,
}: {
  presets: Record<T, { label: string; gradient?: string; description: string }>;
  keys: T[];
  selected: T;
  onSelect: (k: T) => void;
  isLogin?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {keys.filter(k => k !== "custom").map(key => {
        const p = presets[key];
        const isSelected = selected === key;
        return (
          <button
            key={key as string}
            onClick={() => onSelect(key)}
            className={cn(
              "relative rounded-xl overflow-hidden border-2 transition-all duration-200 h-20 focus:outline-none group",
              isSelected
                ? "border-primary shadow-lg shadow-primary/20 scale-[1.03]"
                : "border-border hover:border-primary/40 hover:scale-[1.01]"
            )}
          >
            <div className="absolute inset-0 bg-[hsl(220,28%,6%)]" />
            {p.gradient && (
              <div className="absolute inset-0" style={{ background: p.gradient, opacity: isLogin ? 0.9 : 1 }} />
            )}
            {!p.gradient && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">No BG</span>
              </div>
            )}
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 z-10">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1 z-10">
              <p className="text-[11px] font-semibold text-white truncate">{p.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const ANIM_TYPES = Object.keys(ANIM_BG_META) as AnimBgType[];

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  // Login bg
  const [loginBg, setLoginBgState] = useState<LoginBgConfig>(getLoginBg);
  const [loginCustomUrl, setLoginCustomUrl] = useState(loginBg.customUrl ?? "");
  const [loginVideoUrl, setLoginVideoUrl] = useState(loginBg.videoUrl ?? "");

  // Panel bg
  const [panelBg, setPanelBgState] = useState<PanelBgConfig>(getPanelBg);
  const [panelCustomUrl, setPanelCustomUrl] = useState(panelBg.customUrl ?? "");
  const [panelVideoUrl, setPanelVideoUrl] = useState(panelBg.videoUrl ?? "");

  // Animated bg
  const [animBg, setAnimBgState] = useState<AnimBgConfig>(getAnimBg);
  const [animSaving, setAnimSaving] = useState(false);

  // Live preview for panel bg
  useEffect(() => {
    if (panelBg.preset !== "custom" || panelBg.customUrl) {
      applyPanelBg(panelBg);
    }
  }, [panelBg]);

  async function saveLoginBg() {
    const config: LoginBgConfig = {
      ...loginBg,
      customUrl: loginBg.preset === "custom" ? loginCustomUrl : undefined,
      videoUrl: loginVideoUrl.trim() || undefined,
    };
    const ok = await setLoginBg(config);
    toast({
      title: ok ? "Login background saved" : "Saved locally only",
      description: ok ? "Applied for everyone on the login page." : "Server save failed — local preview only.",
      variant: ok ? "default" : "destructive",
    });
  }

  async function savePanelBg() {
    const config: PanelBgConfig = {
      ...panelBg,
      customUrl: panelBg.preset === "custom" ? panelCustomUrl : undefined,
      videoUrl: panelVideoUrl.trim() || undefined,
    };
    const ok = await setPanelBg(config);
    toast({
      title: ok ? "Panel background saved" : "Saved locally only",
      description: ok ? "Applied for every user on the dashboard." : "Server save failed — local preview only.",
      variant: ok ? "default" : "destructive",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account, security, and panel appearance.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-card border border-border h-auto p-1 gap-1 flex-wrap">
          {[
            { value: "profile", label: "Profile", icon: User, adminOnly: false },
            { value: "security", label: "Security", icon: Lock, adminOnly: false },
            { value: "panel-bg", label: "Panel Background", icon: Monitor, adminOnly: true },
            { value: "login-bg", label: "Login Background", icon: LogIn, adminOnly: true },
            { value: "anim-bg", label: "Animated BG", icon: Sparkles, adminOnly: true },
          ].filter(t => !t.adminOnly || isAdmin).map(t => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-4">
          <Card className="bg-card border-border max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</CardTitle>
              <CardDescription>Your account information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input defaultValue={user?.username} disabled className="bg-muted/50 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Username cannot be changed.</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue={user?.email} className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue={user?.firstName} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue={user?.lastName} className="bg-background" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button>Save Changes</Button>
                <Badge variant="secondary" className={user?.role === "admin" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                  {user?.role}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="mt-4">
          <Card className="bg-card border-border max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Security</CardTitle>
              <CardDescription>Update your login password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" autoComplete="current-password" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" autoComplete="new-password" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" autoComplete="new-password" className="bg-background" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Panel Background ── */}
        <TabsContent value="panel-bg" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Panel Background</CardTitle>
                  <CardDescription>
                    Customize the background overlay shown inside the dashboard. Changes are applied live as you click.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Presets */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Background Presets</Label>
                <PresetGrid
                  presets={PANEL_PRESETS}
                  keys={PANEL_PRESET_KEYS}
                  selected={panelBg.preset}
                  onSelect={(k) => setPanelBgState(prev => ({ ...prev, preset: k }))}
                />
              </div>

              {/* Video background */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> Video Background URL
                  {panelVideoUrl && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-normal">Active — overrides preset</span>}
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://example.com/background.mp4"
                    value={panelVideoUrl}
                    onChange={e => setPanelVideoUrl(e.target.value)}
                    className="bg-background flex-1 font-mono text-sm"
                  />
                  <Button variant="outline" disabled={!panelVideoUrl} onClick={() => {
                    const cfg = { ...panelBg, videoUrl: panelVideoUrl };
                    setPanelBgState(cfg);
                    applyPanelBg(cfg);
                  }}>
                    <Video className="h-4 w-4 mr-1" /> Preview
                  </Button>
                  {panelVideoUrl && (
                    <Button variant="ghost" size="icon" onClick={() => {
                      setPanelVideoUrl("");
                      const cfg = { ...panelBg, videoUrl: undefined };
                      setPanelBgState(cfg);
                      applyPanelBg(cfg);
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste any direct MP4/WebM URL. Works great with <a href="https://motionbgs.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">motionbgs.com</a> — right-click a video → Copy video address. When set, video overrides any gradient preset.
                </p>
              </div>

              {/* Custom image */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Custom Image URL
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://example.com/your-background.jpg"
                    value={panelCustomUrl}
                    onChange={e => setPanelCustomUrl(e.target.value)}
                    className="bg-background flex-1"
                  />
                  <Button variant="outline" disabled={!panelCustomUrl} onClick={() => {
                    setPanelBgState(prev => ({ ...prev, preset: "custom", customUrl: panelCustomUrl }));
                    applyPanelBg({ preset: "custom", customUrl: panelCustomUrl, opacity: panelBg.opacity });
                  }}>Use Image</Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Use any public HTTPS image URL. Recommended: 1920×1080 or larger.
                </p>
              </div>

              {/* Opacity */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="h-4 w-4" /> Intensity
                  <span className="text-muted-foreground font-normal text-sm">{panelBg.opacity ?? 100}%</span>
                </Label>
                <Slider
                  value={[panelBg.opacity ?? 100]}
                  onValueChange={([v]) => setPanelBgState(prev => ({ ...prev, opacity: v }))}
                  min={5} max={100} step={5}
                  className="w-full max-w-xs"
                />
                <p className="text-xs text-muted-foreground">Lower = more subtle glow. Changes apply live.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={savePanelBg} className="gap-2">
                  <Check className="h-4 w-4" /> Save Panel Background
                </Button>
                <Button variant="outline" onClick={() => {
                  const def: PanelBgConfig = { preset: "everest", opacity: 100 };
                  setPanelBgState(def);
                  setPanelBg(def);
                  toast({ title: "Reset to Everest default" });
                }}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Login Background ── */}
        <TabsContent value="login-bg" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LogIn className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Login Page Background</CardTitle>
                  <CardDescription>Customize the background shown on the login screen. Stored locally in your browser.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Presets */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Background Presets</Label>
                <PresetGrid
                  presets={LOGIN_PRESETS}
                  keys={LOGIN_PRESET_KEYS}
                  selected={loginBg.preset}
                  onSelect={(k) => setLoginBgState(prev => ({ ...prev, preset: k }))}
                  isLogin
                />
              </div>

              {/* Video background */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> Video Background URL
                  {loginVideoUrl && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-normal">Active — overrides preset</span>}
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://example.com/background.mp4"
                    value={loginVideoUrl}
                    onChange={e => setLoginVideoUrl(e.target.value)}
                    className="bg-background flex-1 font-mono text-sm"
                  />
                  {loginVideoUrl && (
                    <Button variant="ghost" size="icon" onClick={() => {
                      setLoginVideoUrl("");
                      setLoginBgState(prev => ({ ...prev, videoUrl: undefined }));
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste any direct MP4/WebM URL. Works great with <a href="https://motionbgs.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">motionbgs.com</a>. When set, video plays fullscreen on the login page instead of the gradient preset.
                </p>
              </div>

              {/* Custom image */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Custom Image URL
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://example.com/background.jpg"
                    value={loginCustomUrl}
                    onChange={e => setLoginCustomUrl(e.target.value)}
                    className="bg-background flex-1"
                  />
                  <Button variant="outline" disabled={!loginCustomUrl} onClick={() => setLoginBgState(prev => ({ ...prev, preset: "custom", customUrl: loginCustomUrl }))}>
                    Use Image
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Use any public HTTPS image. Recommended: 1920×1080+.
                </p>
              </div>

              {/* Opacity */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="h-4 w-4" /> Intensity
                  <span className="text-muted-foreground font-normal text-sm">{loginBg.opacity ?? 60}%</span>
                </Label>
                <Slider
                  value={[loginBg.opacity ?? 60]}
                  onValueChange={([v]) => setLoginBgState(prev => ({ ...prev, opacity: v }))}
                  min={10} max={100} step={5}
                  className="w-full max-w-xs"
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold">Preview</Label>
                <div className="relative rounded-xl overflow-hidden h-40 border border-border bg-[hsl(220,28%,6%)]">
                  {loginVideoUrl ? (
                    <video key={loginVideoUrl} src={loginVideoUrl} autoPlay loop muted playsInline
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: (loginBg.opacity ?? 60) / 100 }} />
                  ) : loginBg.preset === "custom" && loginCustomUrl ? (
                    <div className="absolute inset-0" style={{ backgroundImage: `url(${loginCustomUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: (loginBg.opacity ?? 60) / 100 }} />
                  ) : (
                    loginBg.preset !== "custom" && LOGIN_PRESETS[loginBg.preset]?.gradient && (
                      <div className="absolute inset-0" style={{ background: LOGIN_PRESETS[loginBg.preset].gradient, opacity: (loginBg.opacity ?? 60) / 100 }} />
                    )
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,38%,4%)]/80 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-6 py-4 text-center shadow-xl w-52">
                      <div className="w-8 h-8 rounded-lg bg-primary mx-auto mb-2 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Zap className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-xs font-bold text-foreground">Nova Panel</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Sign in to manage your servers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveLoginBg} className="gap-2">
                  <Check className="h-4 w-4" /> Save Login Background
                </Button>
                <Button variant="outline" onClick={() => {
                  const def: LoginBgConfig = { preset: "default", opacity: 60 };
                  setLoginBgState(def);
                  setLoginBg(def);
                  toast({ title: "Reset to default" });
                }}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── Animated Background ── */}
        <TabsContent value="anim-bg" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Animated Background</CardTitle>
                  <CardDescription>Add a live animated effect behind the dashboard content. Changes preview instantly.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type picker */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Animation Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ANIM_TYPES.map(type => {
                    const meta = ANIM_BG_META[type];
                    const isSelected = animBg.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const next = { ...animBg, type };
                          setAnimBgState(next);
                          applyAnimBg(next);
                        }}
                        className={cn(
                          "relative rounded-xl overflow-hidden border-2 transition-all duration-200 h-24 focus:outline-none group text-left",
                          isSelected
                            ? "border-primary shadow-lg shadow-primary/20 scale-[1.03]"
                            : "border-border hover:border-primary/40 hover:scale-[1.01]"
                        )}
                      >
                        {/* Mini preview background */}
                        <div className="absolute inset-0" style={{ backgroundColor: meta.color }} />
                        {type !== "none" && (
                          <div className="absolute inset-0 overflow-hidden">
                            <AnimatedBackground config={{ type, opacity: 80, speed: 3 }} />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 z-20">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-1.5 z-20">
                          <p className="text-[11px] font-semibold text-white">{meta.label}</p>
                          <p className="text-[9px] text-white/60 leading-tight">{meta.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opacity */}
              {animBg.type !== "none" && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Sliders className="h-4 w-4" /> Intensity
                    <span className="text-muted-foreground font-normal text-sm">{animBg.opacity}%</span>
                  </Label>
                  <Slider
                    value={[animBg.opacity]}
                    onValueChange={([v]) => {
                      const next = { ...animBg, opacity: v };
                      setAnimBgState(next);
                      applyAnimBg(next);
                    }}
                    min={10} max={100} step={5}
                    className="w-full max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">Lower = more subtle. Changes apply live.</p>
                </div>
              )}

              {/* Speed */}
              {animBg.type !== "none" && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Speed
                    <span className="text-muted-foreground font-normal text-sm">{["", "Very Slow", "Slow", "Normal", "Fast", "Very Fast"][animBg.speed]}</span>
                  </Label>
                  <Slider
                    value={[animBg.speed]}
                    onValueChange={([v]) => {
                      const next = { ...animBg, speed: v };
                      setAnimBgState(next);
                      applyAnimBg(next);
                    }}
                    min={1} max={5} step={1}
                    className="w-full max-w-xs"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  disabled={animSaving}
                  onClick={async () => {
                    setAnimSaving(true);
                    const ok = await saveAnimBgToServer(animBg);
                    setAnimSaving(false);
                    toast({
                      title: ok ? "Animated background saved" : "Saved locally only",
                      description: ok ? "Applied for all users." : "Server save failed — local only.",
                      variant: ok ? "default" : "destructive",
                    });
                  }}
                  className="gap-2"
                >
                  {animSaving ? <Sliders className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Animated Background
                </Button>
                <Button variant="outline" onClick={() => {
                  const def: AnimBgConfig = { type: "none", opacity: 60, speed: 3 };
                  setAnimBgState(def);
                  applyAnimBg(def);
                  toast({ title: "Animated background disabled" });
                }}>
                  Turn Off
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
