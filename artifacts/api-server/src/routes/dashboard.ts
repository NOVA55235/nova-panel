import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, nodesTable, serversTable, vpsTable, backupsTable, activityTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (_req, res) => {
  const [totalServers] = await db.select({ count: count() }).from(serversTable);
  const [runningServers] = await db.select({ count: count() }).from(serversTable).where(eq(serversTable.status, "running"));
  const [stoppedServers] = await db.select({ count: count() }).from(serversTable).where(eq(serversTable.status, "stopped"));
  const [totalVps] = await db.select({ count: count() }).from(vpsTable);
  const [runningVps] = await db.select({ count: count() }).from(vpsTable).where(eq(vpsTable.status, "running"));
  const [totalNodes] = await db.select({ count: count() }).from(nodesTable);
  const [onlineNodes] = await db.select({ count: count() }).from(nodesTable).where(eq(nodesTable.isOnline, true));
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalBackups] = await db.select({ count: count() }).from(backupsTable);

  res.json({
    totalServers: Number(totalServers.count),
    runningServers: Number(runningServers.count),
    stoppedServers: Number(stoppedServers.count),
    totalVps: Number(totalVps.count),
    runningVps: Number(runningVps.count),
    totalNodes: Number(totalNodes.count),
    onlineNodes: Number(onlineNodes.count),
    totalUsers: Number(totalUsers.count),
    totalBackups: Number(totalBackups.count),
    totalDiskUsedGb: Math.random() * 200 + 50,
  });
});

router.get("/activity", async (_req, res) => {
  const events = await db.select().from(activityTable)
    .orderBy(sql`${activityTable.createdAt} DESC`)
    .limit(20);
  res.json(events);
});

export default router;
