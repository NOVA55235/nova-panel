import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gamepanel_salt_2024").digest("hex");
}

export function generateToken(userId: number, role: string): string {
  const payload = { userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env["SESSION_SECRET"] || "fallback-secret")
    .update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [data, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", process.env["SESSION_SECRET"] || "fallback-secret")
      .update(data).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export function generateApiToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized", message: "No token provided" });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Unauthorized", message: "User not found or inactive" });
  }
  req.user = user;
  next();
}

export async function requireAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden", message: "Admin access required" });
  }
  next();
}
