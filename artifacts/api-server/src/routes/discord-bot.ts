import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { loadConfig, saveConfig, startBot, stopBot, getStatus } from "../lib/discord-bot.js";

const router = Router();
router.use(requireAuth);

function adminOnly(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

router.get("/", adminOnly, async (_req, res) => {
  const cfg = await loadConfig();
  const status = await getStatus();
  res.json({
    config: cfg ? {
      hasToken: !!cfg.token,
      tokenPreview: cfg.token ? `${cfg.token.slice(0, 6)}…${cfg.token.slice(-4)}` : null,
      clientId: cfg.clientId,
      guildId: cfg.guildId,
      ownerDiscordId: cfg.ownerDiscordId,
      enabled: cfg.enabled,
    } : null,
    status,
  });
});

router.put("/config", adminOnly, async (req, res) => {
  const { token, clientId, guildId, ownerDiscordId } = req.body ?? {};
  const patch: any = {};
  if (typeof token === "string" && token.length > 10) patch.token = token.trim();
  if (typeof clientId === "string") patch.clientId = clientId.trim() || null;
  if (typeof guildId === "string") patch.guildId = guildId.trim() || null;
  if (typeof ownerDiscordId === "string") patch.ownerDiscordId = ownerDiscordId.trim() || null;
  const saved = await saveConfig(patch);
  res.json({ success: true, hasToken: !!saved.token });
});

router.post("/start", adminOnly, async (_req, res) => {
  const status = await startBot();
  res.json(status);
});

router.post("/stop", adminOnly, async (_req, res) => {
  await stopBot();
  res.json({ success: true });
});

router.delete("/", adminOnly, async (_req, res) => {
  await stopBot();
  await saveConfig({ token: null, clientId: null, guildId: null, ownerDiscordId: null, enabled: false, status: "offline", lastError: null });
  res.json({ success: true });
});

export default router;
