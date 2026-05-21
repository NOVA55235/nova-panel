import { Router } from "express";
import { db } from "@workspace/db";
import { locationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const locations = await db.select().from(locationsTable).orderBy(locationsTable.createdAt);
  res.json(locations);
});

router.post("/", requireAdmin, async (req, res) => {
  const { name, shortCode, description, country, city } = req.body;
  if (!name || !shortCode) return res.status(400).json({ error: "Bad Request", message: "name and shortCode required" });
  const [loc] = await db.insert(locationsTable).values({ name, shortCode, description, country, city }).returning();
  res.status(201).json(loc);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, shortCode, description, country, city } = req.body;
  const [loc] = await db.update(locationsTable).set({ name, shortCode, description, country, city }).where(eq(locationsTable.id, id)).returning();
  if (!loc) return res.status(404).json({ error: "Not Found", message: "Location not found" });
  res.json(loc);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(locationsTable).where(eq(locationsTable.id, id));
  res.json({ success: true });
});

export default router;
