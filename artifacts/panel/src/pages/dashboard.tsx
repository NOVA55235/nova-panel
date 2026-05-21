import {
  useGetDashboardSummary,
  useGetRecentActivity,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, HardDrive, Network, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
    },
  });

  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({
    query: {
      queryKey: getGetRecentActivityQueryKey(),
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Overview of your infrastructure and recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Game Servers
            </CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingSummary ? "-" : summary?.totalServers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-accent">{isLoadingSummary ? "-" : summary?.runningServers}</span> running
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VPS Instances
            </CardTitle>
            <HardDrive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingSummary ? "-" : summary?.totalVps}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-accent">{isLoadingSummary ? "-" : summary?.runningVps}</span> running
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Nodes
            </CardTitle>
            <Network className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "-" : `${summary?.onlineNodes} / ${summary?.totalNodes}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total nodes online
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingSummary ? "-" : summary?.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle>Resource Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 flex items-center justify-center h-[300px] text-muted-foreground">
            {/* Chart placeholder */}
            <div className="flex flex-col items-center gap-2">
              <Activity className="h-8 w-8 text-muted-foreground/50" />
              <span>System metrics visualization</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingActivity ? (
                <div className="text-sm text-muted-foreground">Loading activity...</div>
              ) : activity?.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                activity?.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        {event.username && ` by ${event.username}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
