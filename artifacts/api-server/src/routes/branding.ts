import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const BRANDING_KEY = "branding";

const DEFAULT_BRANDING = {
  loginBg: { preset: "default", opacity: 60 },
  panelBg: { preset: "everest", opacity: 100 },
};

// Public: anyone (logged-in or not) can read branding so the login screen renders correctly
router.get("/", async (_req, res) => {
  const [row] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, BRANDING_KEY));
  res.json(row?.value ?? DEFAULT_BRANDING);
});

// Admin-only: write branding (accepts any keys — loginBg, panelBg, animated_bg, etc.)
router.put("/", requireAuth, async (req: any, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const updates = req.body ?? {};
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

  const [existing] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, BRANDING_KEY));
  const current = (existing?.value as any) ?? DEFAULT_BRANDING;
  const next = { ...current, ...updates };

  if (existing) {
    await db.update(appSettingsTable).set({ value: next, updatedAt: new Date() })
      .where(eq(appSettingsTable.key, BRANDING_KEY));
  } else {
    await db.insert(appSettingsTable).values({ key: BRANDING_KEY, value: next });
  }
  res.json({ success: true, ...next });
});

export default router;
