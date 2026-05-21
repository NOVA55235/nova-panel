import { Router } from "express";
import { db } from "@workspace/db";
import { allocationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const allocations = await db.select().from(allocationsTable);
  res.json(allocations);
});

export default router;
