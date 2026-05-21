import { Router } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: any, res) => {
  const keys = await db.select({
    id: apiKeysTable.id,
    name: apiKeysTable.name,
    keyPrefix: apiKeysTable.keyPrefix,
    allowedIps: apiKeysTable.allowedIps,
    isActive: apiKeysTable.isActive,
    lastUsedAt: apiKeysTable.lastUsedAt,
    createdAt: apiKeysTable.createdAt,
  }).from(apiKeysTable).where(eq(apiKeysTable.userId, req.user.id));
  res.json(keys);
});

router.post("/", requireAdmin, async (req: any, res) => {
  const { name, allowedIps } = req.body;
  if (!name) return res.status(400).json({ error: "Bad Request", message: "name required" });

  const rawKey = `gp_${crypto.randomBytes(32).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const [key] = await db.insert(apiKeysTable).values({
    userId: req.user.id,
    name,
    keyPrefix,
    keyHash,
    allowedIps: allowedIps || null,
    isActive: true,
  }).returning();

  res.status(201).json({ ...key, fullKey: rawKey });
});

router.delete("/:id", requireAdmin, async (req: any, res) => {
  const id = parseInt(req.params.id);
  await db.delete(apiKeysTable).where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, req.user.id)));
  res.json({ success: true });
});

export default router;
