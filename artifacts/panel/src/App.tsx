import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { fetchPanelBgFromServer } from "@/hooks/use-panel-bg";
import { fetchLoginBgFromServer } from "@/hooks/use-login-bg";
import { loadAnimBgFromServer, applyAnimBg } from "@/hooks/use-animated-bg";

import { Layout } from "@/components/layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Servers from "@/pages/servers";
import ServerDetail from "@/pages/server-detail";
import Vps from "@/pages/vps";
import VpsDetail from "@/pages/vps-detail";
import Nodes from "@/pages/nodes";
import NodeDetail from "@/pages/node-detail";
import Users from "@/pages/users";
import Locations from "@/pages/locations";
import ApiKeys from "@/pages/api-keys";
import Nests from "@/pages/nests";
import Settings from "@/pages/settings";
import StatusPage from "@/pages/status";
import ISOs from "@/pages/isos";
import AddressPools from "@/pages/address-pools";
import Snapshots from "@/pages/snapshots";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import DiscordBot from "@/pages/discord-bot";
import { SplashScreen, useSplash } from "@/components/splash-screen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
        <span className="text-white font-black text-sm">NP</span>
      </div>
      <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any; adminOnly?: boolean }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
    else if (!isLoading && isAuthenticated && adminOnly && user?.role !== "admin") setLocation("/");
  }, [isAuthenticated, isLoading, user, setLocation, adminOnly]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;
  if (adminOnly && user?.role !== "admin") return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />

      <Route path="/servers" component={() => <ProtectedRoute component={Servers} />} />
      <Route path="/servers/:id" component={() => <ProtectedRoute component={ServerDetail} />} />

      <Route path="/vps" component={() => <ProtectedRoute component={Vps} />} />
      <Route path="/vps/:id" component={() => <ProtectedRoute component={VpsDetail} />} />

      <Route path="/nodes" component={() => <ProtectedRoute component={Nodes} />} />
      <Route path="/nodes/:id" component={() => <ProtectedRoute component={NodeDetail} />} />

      {/* Account */}
      <Route path="/api-keys" component={() => <ProtectedRoute component={ApiKeys} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/status" component={() => <ProtectedRoute component={StatusPage} />} />

      {/* Admin */}
      <Route path="/users" component={() => <ProtectedRoute component={Users} adminOnly />} />
      <Route path="/locations" component={() => <ProtectedRoute component={Locations} adminOnly />} />
      <Route path="/nests" component={() => <ProtectedRoute component={Nests} adminOnly />} />
      <Route path="/isos" component={() => <ProtectedRoute component={ISOs} adminOnly />} />
      <Route path="/address-pools" component={() => <ProtectedRoute component={AddressPools} adminOnly />} />
      <Route path="/snapshots" component={() => <ProtectedRoute component={Snapshots} />} />
      <Route path="/admin/discord-bot" component={() => <ProtectedRoute component={DiscordBot} adminOnly />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const splash = useSplash();
  // Load admin-set branding on boot for everyone (panel + login bg)
  useEffect(() => {
    fetchPanelBgFromServer().catch(() => {});
    fetchLoginBgFromServer().catch(() => {});
    loadAnimBgFromServer().then(cfg => { if (cfg) applyAnimBg(cfg); }).catch(() => {});
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {splash.show && <SplashScreen onDone={splash.dismiss} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
