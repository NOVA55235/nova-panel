import { Router } from "express";
import { db } from "@workspace/db";
import { vpsTable, usersTable, nodesTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { CreateVpsBody, VpsPowerActionBody, ReinstallVpsBody } from "@workspace/api-zod";

const router = Router();
router.use(requireAuth);

function generateIp(): string {
  return `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

function generateUsername(): string {
  const adjectives = ["swift", "bold", "sharp", "cool", "dark"];
  const nouns = ["node", "server", "host", "blade", "core"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${Math.floor(Math.random() * 100)}`;
}

router.get("/", async (req, res) => {
  const user = (req as any).user;
  const vpsList = user.role === "admin"
    ? await db.select().from(vpsTable)
    : await db.select().from(vpsTable).where(eq(vpsTable.userId, user.id));
  res.json(vpsList);
});

router.post("/", async (req, res) => {
  const parsed = CreateVpsBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const ipAddress = generateIp();
  const username = generateUsername();
  const sshPort = Math.floor(Math.random() * (65535 - 10000) + 10000);
  const containerId = `vps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [vps] = await db.insert(vpsTable).values({
    ...parsed.data,
    status: "stopped",
    ipAddress,
    username,
    sshPort,
    containerId,
  }).returning();
  await db.insert(activityTable).values({
    type: "vps_created",
    description: `VPS "${vps.name}" created with ${parsed.data.osTemplate}`,
    userId: (req as any).user.id,
    username: (req as any).user.username,
    resourceId: vps.id,
    resourceType: "vps",
  });
  res.status(201).json(vps);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [vps] = await db.select().from(vpsTable).where(eq(vpsTable.id, id));
  if (!vps) return res.status(404).json({ error: "Not Found", message: "VPS not found" });
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, username: usersTable.username, firstName: usersTable.firstName, lastName: usersTable.lastName, role: usersTable.role, isActive: usersTable.isActive, serverLimit: usersTable.serverLimit, vpsLimit: usersTable.vpsLimit, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, vps.userId));
  const [node] = await db.select().from(nodesTable).where(eq(nodesTable.id, vps.nodeId));
  res.json({ ...vps, user, node });
});

router.put("/:id", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden", message: "Only admins can modify VPS specs" });
  }
  const id = parseInt(req.params.id);
  const allowed = ["name", "cpuCores", "memoryMb", "diskGb", "bandwidthGb"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "Bad Request", message: "No editable fields provided" });
  }
  const [vps] = await db.update(vpsTable).set(patch).where(eq(vpsTable.id, id)).returning();
  if (!vps) return res.status(404).json({ error: "Not Found", message: "VPS not found" });
  res.json(vps);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(vpsTable).where(eq(vpsTable.id, id));
  res.json({ success: true, message: "VPS deleted" });
});

router.post("/:id/power", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Bad Request", message: "Invalid VPS ID" });
  const parsed = VpsPowerActionBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid action" });
  }
  const { action } = parsed.data;
  const statusMap: Record<string, "running" | "stopped" | "starting" | "stopping"> = {
    start: "running",
    stop: "stopped",
    restart: "running",
    kill: "stopped",
  };
  await db.update(vpsTable).set({ status: statusMap[action] }).where(eq(vpsTable.id, id));
  await db.insert(activityTable).values({
    type: `vps_${action}`,
    description: `VPS power action: ${action}`,
    userId: (req as any).user.id,
    username: (req as any).user.username,
    resourceId: id,
    resourceType: "vps",
  });
  res.json({ success: true, message: `VPS ${action} sent` });
});

router.post("/:id/reinstall", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Bad Request", message: "Invalid VPS ID" });
  const parsed = ReinstallVpsBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  await db.update(vpsTable).set({ status: "installing", osTemplate: parsed.data.osTemplate }).where(eq(vpsTable.id, id));
  setTimeout(async () => {
    await db.update(vpsTable).set({ status: "stopped" }).where(eq(vpsTable.id, id));
  }, 5000);
  res.json({ success: true, message: "Reinstall initiated" });
});

router.get("/:id/stats", async (req, res) => {
  const id = parseInt(req.params.id);
  const [vps] = await db.select().from(vpsTable).where(eq(vpsTable.id, id));
  if (!vps) return res.status(404).json({ error: "Not Found", message: "VPS not found" });
  const isRunning = vps.status === "running";
  res.json({
    cpuUsage: isRunning ? Math.random() * 70 + 5 : 0,
    memoryUsed: isRunning ? Math.floor(Math.random() * vps.memoryMb * 0.6 + vps.memoryMb * 0.1) : 0,
    memoryLimit: vps.memoryMb,
    diskUsed: Math.floor(vps.diskGb * 1024 * 0.3),
    diskLimit: vps.diskGb * 1024,
    networkIn: isRunning ? Math.random() * 20 : 0,
    networkOut: isRunning ? Math.random() * 10 : 0,
    uptime: isRunning ? Math.floor(Math.random() * 86400 * 7) : 0,
    status: vps.status,
  });
});

export default router;
