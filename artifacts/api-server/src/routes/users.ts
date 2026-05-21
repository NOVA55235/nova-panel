import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin, hashPassword } from "../lib/auth.js";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    username: usersTable.username,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    role: usersTable.role,
    isActive: usersTable.isActive,
    serverLimit: usersTable.serverLimit,
    vpsLimit: usersTable.vpsLimit,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const { email, username, password, firstName, lastName, role, serverLimit, vpsLimit } = parsed.data;
  const [user] = await db.insert(usersTable).values({
    email,
    username,
    firstName,
    lastName,
    passwordHash: hashPassword(password),
    role: role || "user",
    serverLimit: serverLimit ?? 0,
    vpsLimit: vpsLimit ?? 0,
  }).returning();
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    username: usersTable.username,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    role: usersTable.role,
    isActive: usersTable.isActive,
    serverLimit: usersTable.serverLimit,
    vpsLimit: usersTable.vpsLimit,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "Not Found", message: "User not found" });
  res.json(user);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid input" });
  }
  const [user] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) return res.status(404).json({ error: "Not Found", message: "User not found" });
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true, message: "User deleted" });
});

export default router;
