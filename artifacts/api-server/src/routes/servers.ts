import { Router } from "express";
import { db } from "@workspace/db";
import { serversTable, usersTable, nodesTable, backupsTable, activityTable, serverDatabasesTable, serverSchedulesTable, serverSubusersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import crypto from "crypto";
import { CreateServerBody, UpdateServerBody, ServerPowerActionBody } from "@workspace/api-zod";

const router = Router();
router.use(requireAuth);

function pickPort(): number {
  return Math.floor(Math.random() * (30000 - 25565) + 25565);
}

router.get("/", async (req, res) => {
  const user = (req as any).user;
  let query = db.select({
    id: serversTable.id,
    name: serversTable.name,
    description: serversTable.description,
    userId: serversTable.userId,
    nodeId: serversTable.nodeId,
    status: serversTable.status,
    gameType: serversTable.gameType,
    dockerImage: serversTable.dockerImage,
    cpuLimit: serversTable.cpuLimit,
    memoryMb: serversTable.memoryMb,
    diskMb: serversTable.diskMb,
    ip: serversTable.ip,
    port: serversTable.port,
    startupCommand: serversTable.startupCommand,
    envVariables: serversTable.envVariables,
    createdAt: serversTable.createdAt,
    nodeFqdn: nodesTable.fqdn,
    nodeName: nodesTable.name,
  }).from(serversTable).leftJoin(nodesTable, eq(serversTable.nodeId, nodesTable.id));
  const servers = await (user.role === "admin" ? query : query.where(eq(serversTable.userId, user.id)));
  res.json(servers);
});

router.post("/", async (req, res) => {
  const parsed = CreateServerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const [node] = await db.select().from(nodesTable).where(eq(nodesTable.id, parsed.data.nodeId));
  const ip = node?.ip || "0.0.0.0";
  const port = parsed.data.port || pickPort();
  const [server] = await db.insert(serversTable).values({
    ...parsed.data,
    ip,
    port,
    status: "stopped",
    envVariables: parsed.data.envVariables || {},
  }).returning();
  await db.insert(activityTable).values({
    type: "server_created",
    description: `Server "${server.name}" created`,
    userId: (req as any).user.id,
    username: (req as any).user.username,
    resourceId: server.id,
    resourceType: "server",
  });
  res.status(201).json(server);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!server) return res.status(404).json({ error: "Not Found", message: "Server not found" });
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, username: usersTable.username, firstName: usersTable.firstName, lastName: usersTable.lastName, role: usersTable.role, isActive: usersTable.isActive, serverLimit: usersTable.serverLimit, vpsLimit: usersTable.vpsLimit, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, server.userId));
  const [node] = await db.select().from(nodesTable).where(eq(nodesTable.id, server.nodeId));
  res.json({ ...server, user, node });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateServerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const [server] = await db.update(serversTable).set(parsed.data).where(eq(serversTable.id, id)).returning();
  if (!server) return res.status(404).json({ error: "Not Found", message: "Server not found" });
  res.json(server);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(backupsTable).where(eq(backupsTable.serverId, id));
  await db.delete(serversTable).where(eq(serversTable.id, id));
  res.json({ success: true, message: "Server deleted" });
});

router.post("/:id/power", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Bad Request", message: "Invalid server ID" });
  const parsed = ServerPowerActionBody.safeParse(req.body);
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
  const newStatus = statusMap[action];
  await db.update(serversTable).set({ status: newStatus }).where(eq(serversTable.id, id));
  await db.insert(activityTable).values({
    type: `server_${action}`,
    description: `Server power action: ${action}`,
    userId: (req as any).user.id,
    username: (req as any).user.username,
    resourceId: id,
    resourceType: "server",
  });
  res.json({ success: true, message: `Server ${action} sent` });
});

router.get("/:id/stats", async (req, res) => {
  const id = parseInt(req.params.id);
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!server) return res.status(404).json({ error: "Not Found", message: "Server not found" });
  const isRunning = server.status === "running";
  res.json({
    cpuUsage: isRunning ? Math.random() * 80 + 5 : 0,
    memoryUsed: isRunning ? Math.floor(Math.random() * server.memoryMb * 0.7 + server.memoryMb * 0.1) : 0,
    memoryLimit: server.memoryMb,
    diskUsed: Math.floor(server.diskMb * 0.4),
    diskLimit: server.diskMb,
    networkIn: isRunning ? Math.random() * 10 : 0,
    networkOut: isRunning ? Math.random() * 5 : 0,
    uptime: isRunning ? Math.floor(Math.random() * 86400) : 0,
    status: server.status,
  });
});

router.post("/:id/reinstall", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(serversTable).set({ status: "installing" }).where(eq(serversTable.id, id));
  setTimeout(async () => {
    await db.update(serversTable).set({ status: "stopped" }).where(eq(serversTable.id, id));
  }, 5000);
  res.json({ success: true, message: "Reinstall initiated" });
});

router.get("/:id/backups", async (req, res) => {
  const id = parseInt(req.params.id);
  const backups = await db.select().from(backupsTable).where(eq(backupsTable.serverId, id));
  res.json(backups);
});

router.post("/:id/backups", async (req, res) => {
  const id = parseInt(req.params.id);
  const [backup] = await db.insert(backupsTable).values({
    serverId: id,
    name: req.body.name || `backup-${new Date().toISOString().split("T")[0]}-${Date.now()}`,
    sizeMb: 0,
    status: "pending",
  }).returning();
  setTimeout(async () => {
    await db.update(backupsTable).set({
      status: "completed",
      sizeMb: Math.random() * 500 + 50,
      completedAt: new Date(),
    }).where(eq(backupsTable.id, backup.id));
  }, 3000);
  res.status(201).json(backup);
});

router.delete("/:id/backups/:backupId", async (req, res) => {
  const backupId = parseInt(req.params.backupId);
  await db.delete(backupsTable).where(eq(backupsTable.id, backupId));
  res.json({ success: true });
});

// Download backup as a .tar.gz archive (placeholder payload while real storage
// is not wired). Returns proper headers so the browser triggers a file save.
router.get("/:id/backups/:backupId/download", async (req, res) => {
  const id = parseInt(req.params.id);
  const backupId = parseInt(req.params.backupId);
  const [backup] = await db.select().from(backupsTable).where(eq(backupsTable.id, backupId));
  if (!backup || backup.serverId !== id) {
    return res.status(404).json({ error: "Backup not found" });
  }
  if (backup.status !== "completed") {
    return res.status(409).json({ error: "Backup is not ready for download yet" });
  }
  const filename = `${backup.name.replace(/[^a-zA-Z0-9._-]/g, "_")}.tar.gz`;
  const payload = Buffer.from(
    `Nova Panel Backup Archive\n` +
    `=========================\n` +
    `Backup ID: ${backup.id}\n` +
    `Server ID: ${backup.serverId}\n` +
    `Name: ${backup.name}\n` +
    `Size: ${backup.sizeMb} MB\n` +
    `Created: ${backup.createdAt}\n` +
    `Completed: ${backup.completedAt}\n`
  );
  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", payload.length.toString());
  res.send(payload);
});

// Restore backup — simulates wiping all server files and re-uploading the
// archive. Sets the server to "installing" briefly, then back to "stopped".
router.post("/:id/backups/:backupId/restore", async (req, res) => {
  const id = parseInt(req.params.id);
  const backupId = parseInt(req.params.backupId);
  const [backup] = await db.select().from(backupsTable).where(eq(backupsTable.id, backupId));
  if (!backup || backup.serverId !== id) {
    return res.status(404).json({ error: "Backup not found" });
  }
  if (backup.status !== "completed") {
    return res.status(409).json({ error: "Backup is not ready to restore" });
  }
  await db.update(serversTable).set({ status: "installing" }).where(eq(serversTable.id, id));
  setTimeout(async () => {
    await db.update(serversTable).set({ status: "stopped" }).where(eq(serversTable.id, id));
  }, 4000);
  res.json({ success: true, message: "Restore initiated. All files wiped, backup is being re-uploaded." });
});

// Databases
router.get("/:id/databases", async (req, res) => {
  const id = parseInt(req.params.id);
  const dbs = await db.select({
    id: serverDatabasesTable.id,
    serverId: serverDatabasesTable.serverId,
    name: serverDatabasesTable.name,
    host: serverDatabasesTable.host,
    port: serverDatabasesTable.port,
    dbName: serverDatabasesTable.dbName,
    username: serverDatabasesTable.username,
    createdAt: serverDatabasesTable.createdAt,
  }).from(serverDatabasesTable).where(eq(serverDatabasesTable.serverId, id));
  res.json(dbs);
});

router.post("/:id/databases", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Bad Request", message: "name required" });
  const username = `s${id}_${crypto.randomBytes(4).toString("hex")}`;
  const dbName = `s${id}_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const password = crypto.randomBytes(16).toString("hex");
  const [dbRecord] = await db.insert(serverDatabasesTable).values({
    serverId: id, name, host: "127.0.0.1", port: 3306,
    dbName, username, passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
  }).returning();
  res.status(201).json({ ...dbRecord, password });
});

router.delete("/:id/databases/:dbId", async (req, res) => {
  const dbId = parseInt(req.params.dbId);
  await db.delete(serverDatabasesTable).where(eq(serverDatabasesTable.id, dbId));
  res.json({ success: true });
});

// Schedules
router.get("/:id/schedules", async (req, res) => {
  const id = parseInt(req.params.id);
  const schedules = await db.select().from(serverSchedulesTable).where(eq(serverSchedulesTable.serverId, id));
  res.json(schedules);
});

router.post("/:id/schedules", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, cron, action, payload } = req.body;
  if (!name || !cron || !action) return res.status(400).json({ error: "Bad Request", message: "name, cron, action required" });
  const [schedule] = await db.insert(serverSchedulesTable).values({
    serverId: id, name, cron, action, payload: payload || null, isActive: true,
  }).returning();
  res.status(201).json(schedule);
});

router.patch("/:id/schedules/:scheduleId", async (req, res) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const [schedule] = await db.update(serverSchedulesTable).set(req.body).where(eq(serverSchedulesTable.id, scheduleId)).returning();
  res.json(schedule);
});

router.delete("/:id/schedules/:scheduleId", async (req, res) => {
  const scheduleId = parseInt(req.params.scheduleId);
  await db.delete(serverSchedulesTable).where(eq(serverSchedulesTable.id, scheduleId));
  res.json({ success: true });
});

// Sub-users
router.get("/:id/subusers", async (req, res) => {
  const id = parseInt(req.params.id);
  const subusers = await db
    .select({
      id: serverSubusersTable.id,
      serverId: serverSubusersTable.serverId,
      userId: serverSubusersTable.userId,
      permissions: serverSubusersTable.permissions,
      createdAt: serverSubusersTable.createdAt,
      username: usersTable.username,
      email: usersTable.email,
    })
    .from(serverSubusersTable)
    .innerJoin(usersTable, eq(serverSubusersTable.userId, usersTable.id))
    .where(eq(serverSubusersTable.serverId, id));
  res.json(subusers);
});

router.post("/:id/subusers", async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId, permissions } = req.body;
  if (!userId) return res.status(400).json({ error: "Bad Request", message: "userId required" });
  const [subuser] = await db.insert(serverSubusersTable).values({
    serverId: id, userId, permissions: permissions || ["console.view"],
  }).returning();
  res.status(201).json(subuser);
});

router.delete("/:id/subusers/:subuserId", async (req, res) => {
  const subuserId = parseInt(req.params.subuserId);
  await db.delete(serverSubusersTable).where(eq(serverSubusersTable.id, subuserId));
  res.json({ success: true });
});

// File manager (simulated)
router.get("/:id/files", async (req, res) => {
  const dir = (req.query.dir as string) || "/";
  const files = [
    { name: "server.jar", type: "file", size: 45234567, modified: new Date(Date.now() - 3600000).toISOString() },
    { name: "server.properties", type: "file", size: 1234, modified: new Date(Date.now() - 86400000).toISOString() },
    { name: "ops.json", type: "file", size: 256, modified: new Date(Date.now() - 7200000).toISOString() },
    { name: "whitelist.json", type: "file", size: 128, modified: new Date(Date.now() - 172800000).toISOString() },
    { name: "banned-players.json", type: "file", size: 64, modified: new Date(Date.now() - 604800000).toISOString() },
    { name: "world", type: "directory", size: 0, modified: new Date(Date.now() - 3600000).toISOString() },
    { name: "plugins", type: "directory", size: 0, modified: new Date(Date.now() - 86400000).toISOString() },
    { name: "logs", type: "directory", size: 0, modified: new Date(Date.now() - 1800000).toISOString() },
    { name: "mods", type: "directory", size: 0, modified: new Date(Date.now() - 432000000).toISOString() },
    { name: "config", type: "directory", size: 0, modified: new Date(Date.now() - 259200000).toISOString() },
  ];
  res.json({ path: dir, files });
});

router.get("/:id/files/contents", async (req, res) => {
  const file = req.query.file as string;
  const sampleContent: Record<string, string> = {
    "server.properties": `#Minecraft server properties\nserver-port=25565\nmax-players=20\ndifficulty=normal\ngamemode=survival\nlevel-name=world\nmotd=A Minecraft Server\nonline-mode=true\nview-distance=10`,
    "ops.json": `[\n  {\n    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",\n    "name": "admin",\n    "level": 4,\n    "bypassesPlayerLimit": false\n  }\n]`,
    "whitelist.json": `[]`,
    "banned-players.json": `[]`,
  };
  const content = sampleContent[file as string] || `# ${file}\n# File content would appear here`;
  res.json({ file, content });
});

export default router;
