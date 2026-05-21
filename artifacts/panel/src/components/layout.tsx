import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Server, HardDrive, Network, Users,
  Settings, LogOut, Menu, MapPin, Key, Package,
  Bell, X, Zap, Shield, Activity, ChevronLeft, ChevronRight,
  Disc, Globe2, Camera, Cpu, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/animated-background";
import { getAnimBg, type AnimBgConfig } from "@/hooks/use-animated-bg";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

interface NavSection {
  label: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Status", href: "/status", icon: Activity, adminOnly: true },
    ],
  },
  {
    label: "Game Servers",
    items: [
      { name: "Servers", href: "/servers", icon: Server },
    ],
  },
  {
    label: "Virtual Servers",
    items: [
      { name: "VPS Instances", href: "/vps", icon: HardDrive },
      { name: "Snapshots", href: "/snapshots", icon: Camera, adminOnly: true },
    ],
  },
  {
    label: "Infrastructure",
    adminOnly: true,
    items: [
      { name: "Nodes", href: "/nodes", icon: Network },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "API Keys", href: "/api-keys", icon: Key },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Locations", href: "/locations", icon: MapPin },
      { name: "Nests & Eggs", href: "/nests", icon: Package },
      { name: "ISO Library", href: "/isos", icon: Disc },
      { name: "Address Pools", href: "/address-pools", icon: Globe2 },
      { name: "Discord Bot", href: "/admin/discord-bot", icon: Bot },
    ],
  },
];

const COLLAPSE_KEY = "nova_sidebar_collapsed";

function NavLink({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <Link href={item.href}>
      <span
        className={cn(
          "icon-tooltip-trigger flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer relative select-none",
          collapsed ? "justify-center px-2 py-2.5 mx-1" : "px-3 py-2",
          active
            ? "nav-item-active"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
        )}
        onClick={onClick}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">{item.badge}</Badge>
            )}
          </>
        )}
        {collapsed && <span className="icon-tooltip">{item.name}</span>}
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const [animBg, setAnimBg] = useState<AnimBgConfig>(getAnimBg);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const handler = (e: Event) => setAnimBg((e as CustomEvent).detail);
    window.addEventListener("nova-anim-bg-change", handler);
    return () => window.removeEventListener("nova-anim-bg-change", handler);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  const sidebarWidth = collapsed ? "w-[64px]" : "w-[220px]";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("h-16 flex items-center border-b border-sidebar-border shrink-0 relative", collapsed ? "justify-center px-2" : "px-5")}>
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-200 group-hover:rotate-12">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="anim-fade-in">
                <p className="font-bold text-[15px] leading-none text-sidebar-accent-foreground">Nova Panel</p>
                <p className="text-[10px] text-sidebar-foreground/50 leading-none mt-0.5">Server Management</p>
              </div>
            )}
          </Link>
          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all z-50 shadow-lg"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto py-4 space-y-5", collapsed ? "px-1" : "px-3")}>
          {NAV.map((section, i) => {
            if (section.adminOnly && user?.role !== "admin") return null;
            const visibleItems = section.items.filter(it => !it.adminOnly || user?.role === "admin");
            if (!visibleItems.length) return null;
            return (
              <div key={i}>
                {!collapsed && (
                  <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-2">
                    {section.label}
                  </p>
                )}
                {collapsed && i > 0 && <div className="border-t border-sidebar-border/50 my-3 mx-2" />}
                <ul className="space-y-0.5">
                  {visibleItems.map(item => (
                    <li key={item.href}>
                      <NavLink item={item} active={isActive(item.href)} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User + Watermark footer */}
        <div className="shrink-0 border-t border-sidebar-border">
          <div className={cn("py-3", collapsed ? "px-2" : "px-3")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "w-full flex items-center rounded-md hover:bg-sidebar-accent transition-colors text-left group icon-tooltip-trigger relative",
                  collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-2"
                )}>
                  <Avatar className="h-7 w-7 border border-sidebar-border shrink-0 group-hover:border-primary/50 transition-colors">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user?.username}</p>
                      <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
                    </div>
                  )}
                  {collapsed && <span className="icon-tooltip">{user?.username}</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 mb-2" side={collapsed ? "right" : "top"} align="start">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="w-fit text-[10px] mt-1 border-primary/30 text-primary capitalize">{user?.role}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" /> Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/api-keys" className="cursor-pointer w-full flex items-center">
                    <Key className="mr-2 h-4 w-4" /> API Keys
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Watermark */}
          {!collapsed && (
            <div className="px-4 py-2 border-t border-sidebar-border/50">
              <p className="text-[10px] text-sidebar-foreground/25 text-center">
                Nova Panel · <span className="text-primary/40">@Lord_nova98</span>
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300",
        collapsed ? "md:ml-[64px]" : "md:ml-[220px]"
      )}>
        {/* Top header */}
        <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-4 z-40 sticky top-0 shrink-0">
          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary anim-pulse-glow rounded-full" />
            <span className="text-foreground font-medium">Nova Panel</span>
          </div>

          <div className="flex-1" />

          {/* Right side — icon-only buttons with tooltips */}
          <div className="flex items-center gap-1">
            {user?.role === "admin" && (
              <Link href="/users">
                <button className="icon-tooltip-trigger relative h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="icon-tooltip" style={{ left: "auto", right: "calc(100% + 12px)" }}>Admin Panel</span>
                </button>
              </Link>
            )}
            <Link href="/status">
              <button className="icon-tooltip-trigger relative h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                <Activity className="h-4 w-4" />
                <span className="icon-tooltip" style={{ left: "auto", right: "calc(100% + 12px)" }}>Status</span>
              </button>
            </Link>
            <button className="icon-tooltip-trigger relative h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4" />
              <span className="icon-tooltip" style={{ left: "auto", right: "calc(100% + 12px)" }}>Notifications</span>
            </button>
            <Link href="/settings">
              <button className="icon-tooltip-trigger relative h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                <Settings className="h-4 w-4" />
                <span className="icon-tooltip" style={{ left: "auto", right: "calc(100% + 12px)" }}>Settings</span>
              </button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full ml-1">
                  <Avatar className="h-8 w-8 border border-border hover:border-primary/50 transition-colors">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 bg-background relative">
          <AnimatedBackground config={animBg} />
          <div className="max-w-7xl mx-auto w-full anim-fade-in relative z-10" key={location}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden anim-fade-in" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
