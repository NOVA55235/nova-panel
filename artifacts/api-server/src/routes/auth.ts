import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, passwordResetsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { hashPassword, generateToken, requireAuth } from "../lib/auth.js";
import { dmUser } from "../lib/discord-bot.js";
import { LoginBody, RegisterBody } from "@workspace/api-zod";

const router = Router();

function genPassword(len = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "Forbidden", message: "Account is disabled" });
  }
  const token = generateToken(user.id, user.role);
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const { email, username, password, firstName, lastName } = parsed.data;
  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Bad Request", message: "Email already registered" });
  }
  const [user] = await db.insert(usersTable).values({
    email,
    username,
    firstName,
    lastName,
    passwordHash: hashPassword(password),
    role: "user",
  }).returning();
  const token = generateToken(user.id, user.role);
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.status(201).json({ token, user: userWithoutPassword });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

router.post("/logout", requireAuth, async (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

// ── Password reset ──────────────────────────────────────────────────────────
// Step 1: user requests a reset by email. Always returns 200 (no enumeration).
// Token is logged server-side for the admin and DM'd via Discord if configured.
router.post("/forgot-password", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email) return res.json({ success: true });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) return res.json({ success: true });

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await db.insert(passwordResetsTable).values({
    userId: user.id,
    token,
    expiresAt: expires,
  });

  const origin = `${req.protocol}://${req.get("host")}`;
  const resetUrl = `${origin}/reset-password?token=${token}`;
  console.log(`[password-reset] for ${user.email}: ${resetUrl}`);

  let deliveredViaDiscord = false;
  if (user.discordId) {
    deliveredViaDiscord = await dmUser(
      user.discordId,
      `**Nova Panel — Password Reset**\n` +
      `Hello ${user.firstName}, a password reset was requested for your account.\n` +
      `Open this link within 1 hour to choose or generate a new password:\n${resetUrl}\n\n` +
      `If you did not request this, ignore this message.`
    );
    if (deliveredViaDiscord) {
      await db.update(passwordResetsTable).set({ deliveredViaDiscord: true })
        .where(eq(passwordResetsTable.token, token));
    }
  }
  res.json({ success: true, deliveredViaDiscord });
});

// Step 2: validate token (used by reset page on load).
router.get("/reset-password/:token", async (req, res) => {
  const token = req.params.token;
  const [r] = await db.select().from(passwordResetsTable).where(
    and(
      eq(passwordResetsTable.token, token),
      eq(passwordResetsTable.used, false),
      gt(passwordResetsTable.expiresAt, new Date()),
    )
  );
  if (!r) return res.status(404).json({ valid: false });
  const [user] = await db.select({ email: usersTable.email, username: usersTable.username, discordId: usersTable.discordId })
    .from(usersTable).where(eq(usersTable.id, r.userId));
  res.json({ valid: true, email: user?.email, username: user?.username, hasDiscord: !!user?.discordId });
});

// Step 3: complete reset. If newPassword empty, server generates one and DMs via Discord.
router.post("/reset-password/:token", async (req, res) => {
  const token = req.params.token;
  const [r] = await db.select().from(passwordResetsTable).where(
    and(
      eq(passwordResetsTable.token, token),
      eq(passwordResetsTable.used, false),
      gt(passwordResetsTable.expiresAt, new Date()),
    )
  );
  if (!r) return res.status(400).json({ error: "Invalid or expired token" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
  if (!user) return res.status(400).json({ error: "User not found" });

  let newPassword = String(req.body?.newPassword ?? "").trim();
  let generated = false;
  if (!newPassword) {
    newPassword = genPassword(14);
    generated = true;
  } else if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  await db.update(usersTable).set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.id, user.id));
  await db.update(passwordResetsTable).set({ used: true, newPassword: generated ? newPassword : null })
    .where(eq(passwordResetsTable.id, r.id));

  let deliveredViaDiscord = false;
  if (user.discordId) {
    deliveredViaDiscord = await dmUser(
      user.discordId,
      `**Nova Panel — New Password**\n` +
      `Hello ${user.firstName}, your password has been reset.\n` +
      `**New password:** \`${newPassword}\`\n\n` +
      `Sign in, then change it from Settings → Account.`
    );
    if (deliveredViaDiscord) {
      await db.update(passwordResetsTable).set({ deliveredViaDiscord: true })
        .where(eq(passwordResetsTable.id, r.id));
    }
  }

  res.json({
    success: true,
    generated,
    // Only return the password if it was generated AND not delivered via Discord
    newPassword: generated && !deliveredViaDiscord ? newPassword : undefined,
    deliveredViaDiscord,
  });
});

// Admin: instantly reset any user's password and (optionally) DM them via Discord.
router.post("/admin-reset/:userId", requireAuth, async (req: any, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const userId = parseInt(req.params.userId);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "User not found" });

  const newPassword = genPassword(14);
  await db.update(usersTable).set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.id, userId));

  let deliveredViaDiscord = false;
  if (user.discordId) {
    deliveredViaDiscord = await dmUser(
      user.discordId,
      `**Nova Panel — Password Reset by Admin**\n` +
      `Your password has been reset.\n` +
      `**New password:** \`${newPassword}\`\n\n` +
      `Sign in, then change it from Settings → Account.`
    );
  }
  res.json({ success: true, newPassword, deliveredViaDiscord, hasDiscord: !!user.discordId });
});

// Update own Discord ID for receiving bot DMs
router.put("/me/discord", requireAuth, async (req: any, res) => {
  const discordId = String(req.body?.discordId ?? "").trim() || null;
  await db.update(usersTable).set({ discordId }).where(eq(usersTable.id, req.user.id));
  res.json({ success: true, discordId });
});

export default router;
