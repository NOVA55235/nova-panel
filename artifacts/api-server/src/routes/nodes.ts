import { Router } from "express";
import { db } from "@workspace/db";
import { nodesTable, serversTable, vpsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth, requireAdmin, generateApiToken } from "../lib/auth.js";
import { CreateNodeBody, UpdateNodeBody } from "@workspace/api-zod";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const nodes = await db.select().from(nodesTable);
  res.json(nodes);
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = CreateNodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const [node] = await db.insert(nodesTable).values({
    ...parsed.data,
    apiToken: generateApiToken(),
    isOnline: false,
  }).returning();
  res.status(201).json(node);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [node] = await db.select().from(nodesTable).where(eq(nodesTable.id, id));
  if (!node) return res.status(404).json({ error: "Not Found", message: "Node not found" });
  res.json(node);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateNodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const [node] = await db.update(nodesTable).set(parsed.data).where(eq(nodesTable.id, id)).returning();
  if (!node) return res.status(404).json({ error: "Not Found", message: "Node not found" });
  res.json(node);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(nodesTable).where(eq(nodesTable.id, id));
  res.json({ success: true, message: "Node deleted" });
});

router.get("/:id/stats", async (req, res) => {
  const id = parseInt(req.params.id);
  const [serverCount] = await db.select({ count: count() }).from(serversTable).where(eq(serversTable.nodeId, id));
  const [vpsCount] = await db.select({ count: count() }).from(vpsTable).where(eq(vpsTable.nodeId, id));
  res.json({
    cpuUsage: Math.random() * 60 + 10,
    memoryUsed: Math.floor(Math.random() * 8192 + 2048),
    memoryTotal: 16384,
    diskUsed: Math.floor(Math.random() * 200 + 50),
    diskTotal: 500,
    networkIn: Math.random() * 100,
    networkOut: Math.random() * 50,
    serverCount: serverCount.count,
    vpsCount: vpsCount.count,
  });
});

router.post("/:id/regenerate-token", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const token = generateApiToken();
  await db.update(nodesTable).set({ apiToken: token }).where(eq(nodesTable.id, id));
  res.json({ token });
});

export default router;
